import { Suspense } from 'react';
import { HydrateClient } from '@/trpc/server';
import { prefetchLocations } from '@/features/locations/server/prefetch';
import { Locations } from '@/features/locations/components/locations';

const Page = async () => {
  prefetchLocations({ page: 1, pageSize: 10 });

  return (
    <HydrateClient>
      <Suspense fallback={<p>Loading users...</p>}>
        <Locations />
      </Suspense>
    </HydrateClient>
  );
};

export default Page;
