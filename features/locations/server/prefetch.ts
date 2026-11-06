import { prefetch, trpc } from '@/trpc/server';
import { LOCATIONS_PAGE_SIZE } from '@/features/locations/params';

export const prefetchLocations = (params: {
  page: number;
  search: string;
}) => {
  prefetch(
    trpc.locations.getMany.queryOptions({
      ...params,
      pageSize: LOCATIONS_PAGE_SIZE,
    }),
  );
};

export const prefetchLocation = (slug: string) => {
  prefetch(trpc.locations.getBySlug.queryOptions({ slug }));
};
