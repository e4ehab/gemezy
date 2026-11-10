export const promotionPlans = [
  {
    value: "FREE",
    title: "Free",
    description: "Save your location with no promotion.",
  },
  {
    value: "SINGLE_REFRESH",
    slug: "single-refresh",
    durationDays: 7,
    priceLabel: "EGP 30",
    title: "Single Refresh",
    description:
      "Refresh your location daily for 7 days to push it to the top of standard Explore search results.",
  },
  {
    value: "SINGLE_FEATURED",
    slug: "single-featured",
    durationDays: 7,
    priceLabel: "EGP 35",
    title: "Single Featured",
    description:
      "Feature your location for 7 days for top ranks on the relevant page and up to 4× more exposure.",
  },
  {
    value: "SINGLE_ELITE",
    slug: "single-elite",
    durationDays: 10,
    priceLabel: "EGP 50",
    title: "Single Elite",
    description:
      "Feature your location for 10 days for top placement on the relevant page and up to 10× more exposure.",
  },
] as const;

export type PromotionPlan = (typeof promotionPlans)[number]["value"];
export type PaidPromotionPlan = Exclude<PromotionPlan, "FREE">;
export type PaidPromotionPlanDetails = Exclude<
  (typeof promotionPlans)[number],
  { value: "FREE" }
>;
export type LocationPromotionSnapshot = {
  status: "PENDING" | "ACTIVE" | "CANCELED";
  pendingUntil: Date;
  expiresAt: Date | null;
};

export function getLocationPromotionState(
  promotion: LocationPromotionSnapshot | null | undefined,
  now: Date,
) {
  if (
    promotion?.status === "ACTIVE" &&
    promotion.expiresAt !== null &&
    promotion.expiresAt > now
  ) {
    return "ACTIVE" as const;
  }
  if (
    promotion?.status === "PENDING" &&
    promotion.pendingUntil > now
  ) {
    return "PENDING" as const;
  }
  return "FREE" as const;
}

export function getPaidPromotionPlan(
  value: PromotionPlan,
): PaidPromotionPlanDetails | undefined {
  return promotionPlans.find(
    (plan): plan is PaidPromotionPlanDetails =>
      plan.value === value && "slug" in plan,
  );
}

export function getPromotionPlanBySlug(
  slug: string,
): PaidPromotionPlanDetails | undefined {
  return promotionPlans.find(
    (plan): plan is PaidPromotionPlanDetails =>
      plan.value !== "FREE" && plan.slug === slug,
  );
}

export function getPromotionPlanByValue(value: string) {
  return promotionPlans.find((plan) => plan.value === value);
}
