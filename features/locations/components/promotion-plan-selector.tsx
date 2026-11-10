"use client";

import { StarIcon } from "lucide-react";
import {
  promotionPlans,
  type PromotionPlan,
} from "@/features/locations/constants/promotion-plans";

export function PromotionPlanSelector({
  value,
  onChange,
  includeFree = true,
  disabled = false,
}: {
  value: PromotionPlan | null;
  onChange: (value: PromotionPlan) => void;
  includeFree?: boolean;
  disabled?: boolean;
}) {
  const plans = includeFree
    ? promotionPlans
    : promotionPlans.filter((plan) => plan.value !== "FREE");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => (
          <label
            key={plan.value}
            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
              value === plan.value
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/50"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="promotionPlan"
              value={plan.value}
              checked={value === plan.value}
              onChange={() => onChange(plan.value)}
              disabled={disabled}
              className="mt-1 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  {plan.value !== "FREE" && (
                    <StarIcon className="size-4 shrink-0 text-primary" />
                  )}
                  {plan.title}
                  {plan.value === "FREE" && (
                    <span className="text-xs text-muted-foreground">
                      (default)
                    </span>
                  )}
                </span>
                {"priceLabel" in plan && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-primary">
                    {plan.priceLabel}
                  </span>
                )}
              </span>
              {"priceLabel" in plan && (
                <span className="block text-xs text-muted-foreground">
                  one-time payment
                </span>
              )}
              <span className="block text-sm text-muted-foreground">
                {plan.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
