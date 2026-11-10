type PromotionNotificationInput = {
  userId: string;
  orderId: string;
  planTitle: string;
  locationName: string;
  locationSlug: string;
};

export function buildPromotionActivatedNotification({
  userId,
  orderId,
  planTitle,
  locationName,
  locationSlug,
}: PromotionNotificationInput) {
  return {
    where: { polarOrderId: orderId },
    create: {
      userId,
      type: "PROMOTION_ACTIVATED" as const,
      title: `${planTitle} activated`,
      message: `You upgraded ${locationName} to ${planTitle}.`,
      href: `/locations/${encodeURIComponent(locationSlug)}`,
      polarOrderId: orderId,
    },
    update: {},
  };
}

type NotificationReadStore = {
  updateMany: (args: {
    where: { userId: string; readAt: null };
    data: { readAt: Date };
  }) => Promise<{ count: number }>;
};

export async function markAllNotificationsRead(
  store: NotificationReadStore,
  userId: string,
  readAt = new Date(),
) {
  return store.updateMany({
    where: { userId, readAt: null },
    data: { readAt },
  });
}
