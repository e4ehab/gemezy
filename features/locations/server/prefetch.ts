import type { inferInput } from '@trpc/tanstack-react-query';
import { prefetch, trpc } from '@/trpc/server';

type Input = inferInput<typeof trpc.locations.getMany>;

export const prefetchLocations = (params: Input) => {
  prefetch(trpc.locations.getMany.queryOptions(params));
};
