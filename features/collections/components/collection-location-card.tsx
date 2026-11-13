"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookmarkIcon,
  BookmarkOffIcon,
  CrownIcon,
  MapPinIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getGoogleMapsUrl, getPublicLocationSharePath } from "@/features/locations/utils";
import type { PaidPromotionPlan } from "@/features/locations/constants/promotion-plans";

export type CollectionLocation = {
  id: string;
  ownerId: string;
  shareId: string;
  locationName: string;
  publicId: string;
  name: string;
  description: string | null;
  tags: string[];
  images: string[];
  imagePositionX: number;
  imagePositionY: number;
  address: string | null;
  mapsUrl: string;
  ownerName: string;
  promotionPlan: PaidPromotionPlan | null;
};

function getPromotionLabel(plan: PaidPromotionPlan) {
  switch (plan) {
    case "SINGLE_ELITE":
      return "Elite";
    case "SINGLE_FEATURED":
      return "Featured";
    case "SINGLE_REFRESH":
      return "Refreshed";
  }
}

function getPromotionIcon(plan: PaidPromotionPlan) {
  switch (plan) {
    case "SINGLE_ELITE":
      return CrownIcon;
    case "SINGLE_FEATURED":
      return SparklesIcon;
    case "SINGLE_REFRESH":
      return RefreshCwIcon;
  }
}

export function CollectionLocationCard({
  location,
  isOwner = false,
  isSaved,
  isSaving,
  onToggleSaved,
}: {
  location: CollectionLocation;
  isOwner?: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSaved: () => void;
}) {
  const href = getPublicLocationSharePath(location.locationName);

  return (
    <Card className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sidebar-accent/40 hover:shadow-xl">
      <Link
        href={href}
        className="relative block aspect-video w-full shrink-0 overflow-hidden bg-linear-to-br from-primary/10 via-background to-accent/20 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={`View ${location.name}`}
      >
        {location.images[0] ? (
          <Image
            src={location.images[0]}
            alt={location.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-1 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <>
            <span className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px]" />
            <span className="absolute -left-8 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
            <span className="absolute -bottom-16 -right-8 size-48 rounded-full bg-sidebar-accent/40 blur-3xl" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-2xl border border-white/40 bg-background/70 text-primary shadow-xl backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:-rotate-3">
                <MapPinIcon className="size-8" aria-hidden="true" />
              </span>
            </span>
          </>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent via-35% to-transparent"
        />
        {location.promotionPlan && (() => {
          const PromotionIcon = getPromotionIcon(location.promotionPlan);
          return (
            <Badge className="absolute left-3 top-3 h-7 gap-1.5 border border-white/35 bg-background/90 px-2.5 text-foreground shadow-lg backdrop-blur-md">
              <PromotionIcon aria-hidden="true" />
              {getPromotionLabel(location.promotionPlan)}
            </Badge>
          );
        })()}
        <h2 className="absolute bottom-3 left-4 right-4 line-clamp-1 text-left text-lg font-semibold tracking-tight text-white drop-shadow sm:text-xl">
          {location.name}
        </h2>
      </Link>

      <CardContent className="flex grow flex-col gap-1.5 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary ring-1 ring-primary/10">
            {location.ownerName.slice(0, 1)}
          </span>
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            Shared by{" "}
            <span className="font-medium text-foreground/80">
              {location.ownerName}
            </span>
          </p>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {location.description || location.address || "A public place to discover."}
        </p>

        <div className="flex min-h-6 flex-wrap gap-1.5">
          {location.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="max-w-full truncate rounded-full bg-secondary/70 px-2.5 font-normal text-secondary-foreground/80"
            >
              #{tag}
            </Badge>
          ))}
          {location.tags.length > 3 && (
            <Badge
              variant="outline"
              className="rounded-full px-2.5 font-normal text-muted-foreground"
            >
              +{location.tags.length - 3}
            </Badge>
          )}
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-1.5 border-t border-border/70 pt-1.5">
          <a
            href={getGoogleMapsUrl(location.mapsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MapPinIcon className="size-4 text-primary" aria-hidden="true" />
            Map
          </a>
          {(!isOwner || isSaved) && (
            <Button
              type="button"
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              disabled={isSaving}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Remove ${location.name} from collections`
                  : `Save ${location.name} to collections`
              }
              onClick={onToggleSaved}
              className="min-h-10 rounded-full"
            >
              {isSaved ? (
                <BookmarkOffIcon aria-hidden="true" />
              ) : (
                <BookmarkIcon aria-hidden="true" />
              )}
              {isSaved ? "Remove from collections" : "Save to collections"}
            </Button>
          )}
        </footer>
      </CardContent>
    </Card>
  );
}
