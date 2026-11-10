'use client';

import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  getPaidPromotionPlan,
  type PaidPromotionPlan,
} from '@/features/locations/constants/promotion-plans';

export function useSuspenseLocation(slug: string) {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.locations.getBySlug.queryOptions({ slug }));
}

export function useCreateLocation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.locations.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.locations.getMany.queryFilter()),
    }),
  );
}

export function usePurchaseLocationPromotion() {
  const trpc = useTRPC();
  const reserve = useMutation(
    trpc.locations.reservePromotionCheckout.mutationOptions(),
  );
  const cancel = useMutation(
    trpc.locations.cancelPromotionCheckout.mutationOptions(),
  );

  const purchase = async (input: {
    locationId: string;
    locationSlug: string;
    plan: PaidPromotionPlan;
  }) => {
    const reservation = await reserve.mutateAsync(input);
    const plan = getPaidPromotionPlan(input.plan);
    if (!plan) {
      await cancel.mutateAsync({
        checkoutReference: reservation.checkoutReference,
      });
      throw new Error('Choose a valid promotion plan.');
    }

    try {
      const successUrl = new URL(
        `/locations/${encodeURIComponent(input.locationSlug)}`,
        window.location.origin,
      );
      successUrl.searchParams.set('promotion', 'success');
      successUrl.searchParams.set('plan', plan.slug);

      const response = await fetch('/api/auth/checkout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: reservation.planSlug,
          reference_id: reservation.checkoutReference,
          success_url: successUrl.toString(),
          metadata: {
            locationId: reservation.locationId,
            promotionPlan: plan.slug,
            promotionReference: reservation.checkoutReference,
          },
        }),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('url' in result) ||
        typeof result.url !== 'string'
      ) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'message' in result &&
          typeof result.message === 'string'
            ? result.message
            : 'Could not start promotion checkout.';
        throw new Error(message);
      }

      window.location.assign(result.url);
    } catch (error) {
      try {
        await cancel.mutateAsync({
          checkoutReference: reservation.checkoutReference,
        });
      } catch (cancelError) {
        throw new AggregateError(
          [error, cancelError],
          'Checkout failed and the pending reservation could not be released.',
        );
      }
      throw error;
    }
  };

  return {
    purchase,
    isPending: reserve.isPending || cancel.isPending,
  };
}

export function useUpdateLocation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.locations.update.mutationOptions({
      onSuccess: async (_location, input) => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.locations.getMany.queryFilter()),
          queryClient.invalidateQueries(
            trpc.locations.getBySlug.queryFilter({ slug: input.slug }),
          ),
        ]);
      },
    }),
  );
}

export function useDeleteLocation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.locations.delete.mutationOptions({
      onSuccess: async (_result, input) => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.locations.getMany.queryFilter()),
          queryClient.removeQueries({
            queryKey: trpc.locations.getBySlug.queryKey({ slug: input.slug }),
          }),
        ]);
      },
    }),
  );
}

export function useUpdateLocationVisibility() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.locations.updateVisibility.mutationOptions({
      onSuccess: async (_location, input) =>
        queryClient.invalidateQueries(
          trpc.locations.getBySlug.queryFilter({ slug: input.slug }),
        ),
    }),
  );
}
