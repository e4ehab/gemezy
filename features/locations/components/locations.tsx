"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getGoogleMapsUrl,
  getLocationSharePath,
  getPublicLocationSharePath,
} from "@/features/locations/utils";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowUpRightIcon,
  CopyIcon,
  Birdhouse,
  MapPinIcon,
  MessageCircleIcon,
  PlusIcon,
} from "lucide-react";

type SavedLocation =
  inferRouterOutputs<AppRouter>["locations"]["getMany"]["items"][number];

export function Locations({
  locations,
  searchQuery,
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  isFetching,
  onPageChange,
}: {
  locations: SavedLocation[];
  searchQuery: string;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const isMobile = useIsMobile();

  const copyLocationId = async (publicId: string) => {
    try {
      await navigator.clipboard.writeText(publicId);
      toast.success("Location ID copied");
    } catch {
      toast.error("Could not copy the location ID");
    }
  };

  const shareLocationOnWhatsApp = (location: (typeof locations)[number]) => {
    if (location.visibility === "PRIVATE") {
      toast.info("Make this location public or friends only before sharing");
      return;
    }
    const locationUrl = new URL(
      location.shareSlug
        ? getPublicLocationSharePath(location.shareSlug)
        : getLocationSharePath(location.shareId),
      window.location.origin,
    ).toString();
    const mapsUrl = getGoogleMapsUrl(location.mapsUrl);
    const message = `Check out ${location.name}\n${locationUrl}\nOpen in Google Maps: ${mapsUrl}`;
    try {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      toast.error("Could not open WhatsApp to share this location");
    }
  };

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 py-16 text-center">
        <Birdhouse className="mb-3 size-10 text-primary/70" />
        <p className="text-lg font-medium text-muted-foreground">
          {searchQuery ? "No matching locations" : "No locations yet"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchQuery
            ? "Try another name, location ID, or tag."
            : "Save a place to start building your collection."}
        </p>
        {!searchQuery && (
          <Link href="/locations/new" className={cn(buttonVariants(), "mt-5")}>
            <PlusIcon />
            Add your first location
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-4 pb-6 sm:auto-rows-fr sm:grid-cols-2 sm:gap-6 sm:pb-8 lg:grid-cols-3 xl:grid-cols-4">
      {locations.map((location) => {
        const images = location.images ?? [];

        return (
        <article
          key={location.id}
          className="group flex h-auto flex-col overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sidebar-accent/40 hover:shadow-xl sm:h-full"
        >
          <Link
            href={`/locations/${encodeURIComponent(location.slug)}`}
            className="rounded-t-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            aria-label={`View ${location.name}`}
          >
            <div className="relative flex aspect-16/8 w-full shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-primary/20 via-sidebar-accent/15 to-muted sm:aspect-16/10">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={location.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    objectPosition: `${location.imagePositionX}% ${location.imagePositionY}%`,
                  }}
                />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-35 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[28px_28px]" />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 400 180"
                    className="absolute inset-0 size-full text-primary/30"
                    fill="none"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <path d="M-20 132C58 116 62 48 142 58s84 94 160 69 87-82 137-76" stroke="currentColor" strokeWidth="12" />
                    <path d="M-20 132C58 116 62 48 142 58s84 94 160 69 87-82 137-76" stroke="var(--sidebar)" strokeDasharray="3 9" strokeLinecap="round" strokeWidth="2" />
                    <path d="M66 190c8-38 38-42 39-80s-26-56-18-117M285 190c-20-40-10-68 14-91s52-26 67-99" stroke="currentColor" strokeOpacity=".55" strokeWidth="3" />
                  </svg>
                  <div className="relative flex size-14 items-center justify-center rounded-2xl border border-white/60 bg-background/85 text-primary shadow-lg backdrop-blur transition duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <MapPinIcon className="size-7" />
                  </div>
                </>
              )}
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                <MapPinIcon className="size-3.5 text-primary" />
                Saved place
              </div>
              <div className="absolute bottom-4 right-4 rounded-lg border border-white/40 bg-background/75 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground shadow-sm backdrop-blur">
                {location.publicId}
              </div>
            </div>
          </Link>

          <div className="flex flex-col gap-2 p-3 sm:grow sm:gap-3 sm:p-5">
            <Link
              href={`/locations/${encodeURIComponent(location.slug)}`}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                <Birdhouse className="size-4 shrink-0 text-sidebar-accent" />
                <h2 className="line-clamp-1 text-lg font-semibold text-sidebar-foreground">
                  {location.name}
                </h2>
              </div>
            </Link>

            <p className="line-clamp-2 text-sm leading-5 text-sidebar-foreground/70">
              {location.description || location.address || "A saved place, ready for your next adventure."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {location.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-sidebar-border bg-sidebar-accent/20 px-2 py-1 text-xs text-sidebar-foreground/80"
                >
                  #{tag}
                </span>
              ))}
              {location.tags.length > 3 && (
                <span className="rounded-md border border-sidebar-border bg-sidebar-accent/20 px-2 py-1 text-xs text-sidebar-foreground/60">
                  +{location.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 pb-3 text-sm sm:flex-nowrap sm:px-4 sm:pb-4">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate font-mono text-xs text-sidebar-foreground/50">
                {location.publicId}
              </span>
              <Button
                type="button"
                variant="ghost"
                size={isMobile ? "icon-lg" : "icon-xs"}
                className={cn(
                  "shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground",
                  isMobile && "size-11",
                )}
                title="Copy location ID"
                aria-label={`Copy location ID ${location.publicId}`}
                onClick={() => copyLocationId(location.publicId)}
              >
                <CopyIcon />
              </Button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={getGoogleMapsUrl(location.mapsUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-sm text-sidebar-foreground/60 outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  isMobile && "flex size-11 items-center justify-center",
                )}
                aria-label={`Open ${location.name} in Google Maps`}
                title="Open in Google Maps"
              >
                <MapPinIcon className="size-4" />
              </a>
              <Button
                type="button"
                variant="ghost"
                size={isMobile ? "icon-lg" : "icon-xs"}
                className={cn(
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  isMobile && "size-11",
                )}
                title="Share via WhatsApp"
                aria-label={`Share ${location.name} via WhatsApp`}
                onClick={() => shareLocationOnWhatsApp(location)}
              >
                <MessageCircleIcon />
              </Button>
              <Link
                href={`/locations/${encodeURIComponent(location.slug)}`}
                className="flex min-h-11 items-center gap-1 font-medium text-sidebar-accent transition-colors duration-300 hover:text-primary md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                View
                <ArrowUpRightIcon className="size-4" />
              </Link>
            </div>
          </footer>
        </article>
        );
      })}
    </div>
    <nav
      aria-label="Location pages"
      className="flex items-center justify-between gap-3 border-t border-border py-4"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!hasPreviousPage || isFetching}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!hasNextPage || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
    </>
  );
}
