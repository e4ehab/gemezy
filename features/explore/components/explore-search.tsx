"use client";

import { CommandItem } from "@/components/ui/command";
import { MapPinIcon } from "lucide-react";
import { getPublicLocationSharePath } from "@/features/locations/utils";

type ExploreSearchLocation = {
  name: string;
  publicId: string;
  locationName: string;
};

type ExploreSearchProps = {
  locations: ExploreSearchLocation[];
  onSelect: (href: string) => void;
};

export function ExploreSearch({ locations, onSelect }: ExploreSearchProps) {
  return locations.map((location) => (
    <CommandItem
      key={`explore-${location.publicId}`}
      value={`${location.name} ${location.locationName} ${location.publicId}`}
      onSelect={() =>
        onSelect(getPublicLocationSharePath(location.locationName))
      }
      className="gap-3 px-3 py-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <MapPinIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{location.name}</span>
        <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
          {location.publicId}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">Explore</span>
    </CommandItem>
  ));
}
