'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '@/trpc/routers/_app';

export type GetLocationsInput = inferRouterInputs<AppRouter>['locations']['getMany'];

export function useSuspenseLocations(params: GetLocationsInput) {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.locations.getMany.queryOptions(params));
}
