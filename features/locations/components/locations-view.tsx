"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Locations } from "@/features/locations/components/locations";
import { LOCATIONS_PAGE_SIZE } from "@/features/locations/params";
import { useLocationsParams } from "@/features/locations/hooks/use-locations-params";
import { useTRPC } from "@/trpc/client";
import type { FallbackProps } from "react-error-boundary";

export function LocationsViewLoading() {
  return (
    <LoadingState
      title="Loading your locations"
      description="Getting your saved places ready."
    />
  );
}

export function LocationsViewError({ resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Error loading locations"
      description="Something went wrong while loading your locations."
      onRetry={resetErrorBoundary}
    />
  );
}

export function LocationsView() {
  const trpc = useTRPC();
  const [params, setParams] = useLocationsParams();
  const { data, isFetching } = useSuspenseQuery(
    trpc.locations.getMany.queryOptions({
      ...params,
      pageSize: LOCATIONS_PAGE_SIZE,
    }),
  );

  return (
    <div className="min-h-full w-full">
      <div className="w-full px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <Locations
            locations={data.items}
            searchQuery={params.search.trim()}
            page={data.page}
            totalPages={data.totalPages}
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            isFetching={isFetching}
            onPageChange={(page) => void setParams({ ...params, page })}
          />
        </div>
      </div>
    </div>
  );
}
