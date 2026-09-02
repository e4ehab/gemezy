// this is our dashboardpage
import { Suspense } from 'react';
import { HydrateClient } from '@/trpc/server';
import { prefetchLocations } from '@/features/locations/server/prefetch';
import { Locations } from '@/features/locations/components/locations';

export default async function Page() {
  prefetchLocations({ page: 1, pageSize: 10 });

  // return (
  //   <HydrateClient>
  //     <h1>Welcome to GemEzy</h1>
  //     <Suspense fallback={<p>Loading users...</p>}>
  //       <Locations />
  //     </Suspense>
  //   </HydrateClient>
  // );
  return (
    <h1>Welcome to GemEzy</h1>
  );
}
