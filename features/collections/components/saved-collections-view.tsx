"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookmarkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { CollectionLocationCard } from "@/features/collections/components/collection-location-card";
import { useSetCollectionSaved } from "@/features/collections/hooks/use-collections";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

export function SavedCollectionsView() {
  const trpc = useTRPC();
  const savedQuery = useQuery(trpc.collections.getMany.queryOptions());
  const setSaved = useSetCollectionSaved();

  if (savedQuery.isPending) {
    return (
      <LoadingState
        title="Loading saved collections"
        description="Getting your saved public places ready."
      />
    );
  }

  if (savedQuery.isError) {
    return (
      <ErrorState
        title="Could not load saved collections"
        description="Something went wrong while loading your saved places."
        onRetry={() => void savedQuery.refetch()}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Your places</p>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          Saved Collections
        </h1>
        <p className="text-muted-foreground">
          Public places you’ve saved from Explore.
        </p>
      </header>

      {savedQuery.data.length > 0 ? (
        <section
          aria-label="Saved public places"
          className="grid grid-cols-1 gap-4 pb-6 sm:auto-rows-fr sm:grid-cols-2 sm:gap-6 sm:pb-8 lg:grid-cols-3 xl:grid-cols-4"
        >
          {savedQuery.data.map((location) => (
            <CollectionLocationCard
              key={location.id}
              location={location}
              isSaved
              isSaving={
                setSaved.isPending &&
                setSaved.variables?.publicId === location.publicId
              }
              onToggleSaved={() =>
                setSaved.mutate({
                  publicId: location.publicId,
                  isSaved: false,
                })
              }
            />
          ))}
        </section>
      ) : (
        <Card className="border-dashed bg-card/60">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookmarkIcon className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold">Your collection is empty</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Save public places from Explore and they’ll show up here.
            </p>
            <Link
              href="/explore"
              className={cn(buttonVariants(), "mt-1")}
            >
              Explore places
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
