"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Locations } from "@/features/locations/components/locations";
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
  const [query] = useQueryState("search", {
    defaultValue: "",
    shallow: false,
    clearOnDefault: true,
  });
  const normalizedQuery = query.trim();
  const { data } = useSuspenseQuery(
    trpc.locations.getMany.queryOptions({
      search: normalizedQuery || undefined,
    }),
  );

  return (
    <div className="scrollbar-hidden h-auto min-h-screen w-full overflow-y-visible sm:h-full sm:overflow-y-auto">
      <div className="w-full px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <Locations locations={data} searchQuery={normalizedQuery} />
        </div>
      </div>
    </div>
  );
}
