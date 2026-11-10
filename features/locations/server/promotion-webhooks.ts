import type { webhooks as PolarWebhooks } from "@polar-sh/sdk/2026-04";
import prisma from "@/lib/db";
import {
  getPromotionPlanBySlug,
  type PaidPromotionPlan,
} from "@/features/locations/constants/promotion-plans";
import { buildPromotionActivatedNotification } from "@/features/notifications/server/services";

function getMetadataString(
  metadata: Record<string, unknown>,
  key: string,
) {
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function getProductId(plan: PaidPromotionPlan) {
  switch (plan) {
    case "SINGLE_REFRESH":
      return process.env.POLAR_SINGLE_REFRESH_PRODUCT_ID;
    case "SINGLE_FEATURED":
      return process.env.POLAR_SINGLE_FEATURED_PRODUCT_ID;
    case "SINGLE_ELITE":
      return process.env.POLAR_SINGLE_ELITE_PRODUCT_ID;
  }
}

async function updateCheckoutReservation(
  payload:
    | PolarWebhooks.WebhookCheckoutCreatedPayload
    | PolarWebhooks.WebhookCheckoutUpdatedPayload,
) {
  const checkout = payload.data;
  const checkoutReference = getMetadataString(
    checkout.metadata,
    "promotionReference",
  );
  if (!checkoutReference) return;

  if (checkout.status === "expired" || checkout.status === "failed") {
    await prisma.locationPromotion.updateMany({
      where: { checkoutReference, status: "PENDING" },
      data: { status: "CANCELED" },
    });
    return;
  }

  await prisma.locationPromotion.updateMany({
    where: { checkoutReference, status: "PENDING" },
    data: { pendingUntil: checkout.expires_at },
  });
}

export async function onPromotionCheckoutCreated(
  payload: PolarWebhooks.WebhookCheckoutCreatedPayload,
) {
  await updateCheckoutReservation(payload);
}

export async function onPromotionCheckoutUpdated(
  payload: PolarWebhooks.WebhookCheckoutUpdatedPayload,
) {
  await updateCheckoutReservation(payload);
}

async function activatePaidPromotionOrder(
  order:
    | PolarWebhooks.WebhookOrderPaidPayload["data"]
    | PolarWebhooks.WebhookOrderUpdatedPayload["data"],
) {
  if (!order.paid || order.status !== "paid") return;

  const locationId = getMetadataString(order.metadata, "locationId");
  const checkoutReference = getMetadataString(
    order.metadata,
    "promotionReference",
  );
  const promotionPlanSlug = getMetadataString(
    order.metadata,
    "promotionPlan",
  );
  if (!locationId || !checkoutReference || !promotionPlanSlug) {
    throw new Error("Paid Polar order is missing location promotion metadata.");
  }

  const plan = getPromotionPlanBySlug(promotionPlanSlug);
  if (!plan || order.product_id !== getProductId(plan.value)) {
    throw new Error("Paid Polar order does not match a configured promotion plan.");
  }

  const promotion = await prisma.locationPromotion.findUnique({
    where: { checkoutReference },
    include: {
      location: {
        select: { userId: true, name: true, locationName: true },
      },
    },
  });
  if (
    !promotion ||
    promotion.locationId !== locationId ||
    promotion.plan !== plan.value ||
    promotion.location.userId !== order.customer.external_id
  ) {
    throw new Error("Paid Polar order does not match its location reservation.");
  }

  const startedAt = new Date();
  const expiresAt = new Date(
    startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
  );
  await prisma.$transaction(async (transaction) => {
    const activated = await transaction.locationPromotion.updateMany({
      where: {
        id: promotion.id,
        locationId,
        plan: plan.value,
        checkoutReference,
        status: "PENDING",
      },
      data: {
        status: "ACTIVE",
        startsAt: startedAt,
        expiresAt,
        polarOrderId: order.id,
      },
    });

    if (activated.count === 0) {
      const alreadyProcessed = await transaction.locationPromotion.findUnique({
        where: { polarOrderId: order.id },
        select: { id: true },
      });
      if (!alreadyProcessed) {
        throw new Error(
          "Paid Polar order no longer has an open location reservation.",
        );
      }
    }

    await transaction.notification.upsert({
      ...buildPromotionActivatedNotification({
        userId: promotion.location.userId,
        orderId: order.id,
        planTitle: plan.title,
        locationName: promotion.location.name,
        locationSlug: promotion.location.locationName,
      }),
    });
  });
}

export async function onPromotionOrderPaid({
  data: order,
}: PolarWebhooks.WebhookOrderPaidPayload) {
  await activatePaidPromotionOrder(order);
}

export async function onPromotionOrderUpdated({
  data: order,
}: PolarWebhooks.WebhookOrderUpdatedPayload) {
  await activatePaidPromotionOrder(order);
}
