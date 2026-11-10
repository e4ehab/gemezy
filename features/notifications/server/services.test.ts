import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPromotionActivatedNotification,
  markAllNotificationsRead,
} from "./services";

test("builds an idempotent notification describing the activated location plan", () => {
  assert.deepEqual(
    buildPromotionActivatedNotification({
      userId: "user-1",
      orderId: "polar-order-1",
      planTitle: "Single Elite",
      locationName: "Cafe & Garden",
      locationSlug: "cafe-garden",
    }),
    {
      where: { polarOrderId: "polar-order-1" },
      create: {
        userId: "user-1",
        type: "PROMOTION_ACTIVATED",
        title: "Single Elite activated",
        message: "You upgraded Cafe & Garden to Single Elite.",
        href: "/locations/cafe-garden",
        polarOrderId: "polar-order-1",
      },
      update: {},
    },
  );
});

test("mark all notifications read is scoped to unread notifications for one user", async () => {
  const readAt = new Date("2026-11-11T00:00:00.000Z");
  let received:
    | {
        where: { userId: string; readAt: null };
        data: { readAt: Date };
      }
    | undefined;

  const result = await markAllNotificationsRead(
    {
      updateMany: async (args) => {
        received = args;
        return { count: 2 };
      },
    },
    "user-1",
    readAt,
  );

  assert.deepEqual(received, {
    where: { userId: "user-1", readAt: null },
    data: { readAt },
  });
  assert.equal(result.count, 2);
});
