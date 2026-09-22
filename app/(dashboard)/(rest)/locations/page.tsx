import { Suspense } from 'react';
import { HydrateClient } from '@/trpc/server';
import { prefetchLocations } from '@/features/locations/server/prefetch';
import { Locations } from '@/features/locations/components/locations';
import { requireAuth } from '@/lib/auth-utils';

export default async function Page() {
  await requireAuth();
  prefetchLocations({ page: 1, pageSize: 10 });

  return (
    <HydrateClient>
      <h1>Welcome to GemEzy</h1>
      <Suspense fallback={<p>Loading users...</p>}>
        <Locations />
      </Suspense>
    </HydrateClient>
  );
}
