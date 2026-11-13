"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { CollectionLocationCard, type CollectionLocation } from "@/features/collections/components/collection-location-card";
import { useSetCollectionSaved } from "@/features/collections/hooks/use-collections";
import { useTRPC } from "@/trpc/client";

export function ExploreLocationsGrid({
  locations,
}: {
  locations: CollectionLocation[];
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const savedQuery = useQuery(trpc.collections.getSavedIds.queryOptions());
  const setSaved = useSetCollectionSaved();
  const savedIds = new Set(savedQuery.data?.publicIds ?? []);

  return (
    <section
      aria-label="Public places"
      className="grid grid-cols-1 gap-4 pb-6 sm:auto-rows-fr sm:grid-cols-2 sm:gap-6 sm:pb-8 lg:grid-cols-3 xl:grid-cols-4"
    >
      {locations.map((location) => (
        <CollectionLocationCard
          key={location.id}
          location={location}
          isOwner={savedQuery.data?.userId === location.ownerId}
          isSaved={savedIds.has(location.publicId)}
          isSaving={savedQuery.isPending || (
            setSaved.isPending &&
            setSaved.variables?.publicId === location.publicId
          )}
          onToggleSaved={() => {
            if (savedQuery.isError) {
              toast.error("Could not check your saved collections. Please retry.");
              return;
            }
            if (!savedQuery.data?.authenticated) {
              toast.info("Sign in to save places to your collections");
              router.push("/login");
              return;
            }
            setSaved.mutate({
              publicId: location.publicId,
              isSaved: !savedIds.has(location.publicId),
            });
          }}
        />
      ))}
    </section>
  );
}
