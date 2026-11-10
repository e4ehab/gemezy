"use client";

import { useState } from "react";
import {
  ArrowUpRightIcon,
  LoaderCircleIcon,
  MegaphoneIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PromotionPlanSelector } from "@/features/locations/components/promotion-plan-selector";
import { usePurchaseLocationPromotion } from "@/features/locations/hooks/use-locations";
import {
  type PaidPromotionPlan,
} from "@/features/locations/constants/promotion-plans";

type PromoteLocationDialogProps = {
  locationId: string;
  locationSlug: string;
  isUnavailable: boolean;
};

export function PromoteLocationDialog({
  locationId,
  locationSlug,
  isUnavailable,
}: PromoteLocationDialogProps) {
  const purchaseLocationPromotion = usePurchaseLocationPromotion();
  const [isOpen, setIsOpen] = useState(false);
  const [promotionPlan, setPromotionPlan] = useState<PaidPromotionPlan | null>(
    null,
  );
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const purchasePromotion = async () => {
    if (!promotionPlan || isUnavailable) return;

    setIsStartingCheckout(true);
    try {
      await purchaseLocationPromotion.purchase({
        locationId,
        locationSlug,
        plan: promotionPlan,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start checkout. You can try again later.",
      );
    } finally {
      setIsStartingCheckout(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isStartingCheckout) setIsOpen(open);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isUnavailable}
            className="min-h-12 w-full justify-center gap-2"
          />
        }
      >
        <MegaphoneIcon className="size-4" />
        Promote address
      </DialogTrigger>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promote address</DialogTitle>
          <DialogDescription>
            Choose a one-time promotion plan for this location. You’ll complete
            payment securely through Polar.
          </DialogDescription>
        </DialogHeader>
        <PromotionPlanSelector
          value={promotionPlan}
          onChange={(value) =>
            setPromotionPlan(value === "FREE" ? null : value)
          }
          includeFree={false}
          disabled={isStartingCheckout}
        />
        <Button
          type="button"
          disabled={!promotionPlan || isStartingCheckout}
          onClick={purchasePromotion}
          className="min-h-11 w-full sm:w-auto"
        >
          {isStartingCheckout ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <ArrowUpRightIcon />
          )}
          {isStartingCheckout ? "Opening checkout..." : "Continue to payment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
