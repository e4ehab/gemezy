import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { LocationsView, LocationsViewError, LocationsViewLoading } from "@/features/locations/components/locations-view";
import { prefetchLocations } from "@/features/locations/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import type { SearchParams } from "nuqs/server";
import { locationsParamsLoader } from "@/features/locations/server/params-loader";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();
  const params = await locationsParamsLoader(searchParams);
  prefetchLocations(params);

  return (
    <HydrateClient>
      <Suspense fallback={<LocationsViewLoading />}>
        <ErrorBoundary FallbackComponent={LocationsViewError}>
          <LocationsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
