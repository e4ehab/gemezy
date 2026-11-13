
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MapPinIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  ImagesIcon,
  CheckIcon,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  getGoogleMapsUrl,
  getLocationSharePath,
  getPublicLocationSharePath,
} from "@/features/locations/utils";
import { cn } from "@/lib/utils";

type SharedLocation = {
  shareId: string;
  shareSlug: string | null;
  name: string;
  images: string[];
  mapsUrl: string;
  imagePositionX: number;
  imagePositionY: number;
};

export function SharedLocationView({
  location,
}: {
  location: SharedLocation;
}) {
  const images = location.images ?? [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const activeImage = images[activeImageIndex];
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  const showPreviousImage = useCallback(() => {
    if (!hasMultipleImages) return;

    setActiveImageIndex((index) =>
      (index - 1 + images.length) % images.length
    );
  }, [hasMultipleImages, images.length]);

  const showNextImage = useCallback(() => {
    if (!hasMultipleImages) return;

    setActiveImageIndex((index) =>
      (index + 1) % images.length
    );
  }, [hasMultipleImages, images.length]);

  const getShareUrl = () => {
    return new URL(
      location.shareSlug
        ? getPublicLocationSharePath(location.shareSlug)
        : getLocationSharePath(location.shareId),
      window.location.origin
    ).toString();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());

      setIsCopied(true);
      toast.success("Share link copied");

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("Could not copy the share link");
    }
  };

  const shareOnWhatsApp = () => {
    const shareUrl = getShareUrl();
    const mapsUrl = getGoogleMapsUrl(location.mapsUrl);

    const message = [
      `Check out ${location.name}`,
      shareUrl,
      `Open in Google Maps: ${mapsUrl}`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">

      {/* Header */}
      <header className="mb-7 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPinIcon className="size-5" />
          </div>
          <h1 className="min-w-0 wrap-break-word text-xl font-semibold tracking-tight sm:text-2xl">
            {location.name}
          </h1>
        </div>
        <Link
          href="/explore"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-h-10 shrink-0 gap-2 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to Explore</span>
        </Link>
      </header>

      {/* Photo Gallery */}
      <section
        aria-label="Location photos"
        className="mb-7 space-y-3"
      >
        <div
          className={`grid items-center gap-2 sm:gap-4 ${
            hasMultipleImages
              ? "grid-cols-[auto_minmax(0,1fr)_auto]"
              : "grid-cols-1"
          }`}
        >
          {hasMultipleImages && (
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Previous photo"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-11"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
          )}

          {activeImage ? (
            <div className="flex min-w-0 justify-center">
              <div className="relative w-fit max-w-full overflow-hidden rounded-2xl border border-border shadow-lg shadow-black/10">
                <Image
                  src={activeImage}
                  alt={`${location.name} photo ${activeImageIndex + 1}`}
                  width={1600}
                  height={1200}
                  unoptimized
                  priority={activeImageIndex === 0}
                  sizes="(max-width: 768px) 100vw, 960px"
                  className="block h-auto max-h-[min(68dvh,48rem)] w-auto max-w-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-48 min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted shadow-sm">
                <MapPinIcon className="size-8 text-primary" />
              </div>
              <p className="text-sm font-medium">No photos available</p>
            </div>
          )}

          {hasMultipleImages && (
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Next photo"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-11"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          )}
        </div>

        {hasImages && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImagesIcon className="size-3.5" />
            Photo {activeImageIndex + 1} of {images.length}
          </div>
        )}

        {/* Thumbnail Gallery */}
        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto px-0.5 py-1 scrollbar-thin">
            {images.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={activeImageIndex === index}
                className={`relative size-17 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition-all duration-200 sm:size-20 ${
                  activeImageIndex === index
                    ? "border-primary opacity-100 ring-2 ring-primary/10"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={imageUrl}
                  alt=""
                  aria-hidden="true"
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Location Details */}
      <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-lg shadow-black/5">
        <CardContent className="space-y-6 p-5 sm:p-7 lg:p-8">

          {/* Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Shared location
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Someone shared this location with you on Gemezy.
              Open it in Google Maps to explore and navigate there.
            </p>
          </div>

          {/* Privacy Information */}
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Your privacy is respected
              </p>

              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Personal notes, tags, and exact coordinates are kept private.
                Only the information shared by the owner is visible here.
              </p>
            </div>
          </div>

          {/* Primary Action */}
          <a
            href={getGoogleMapsUrl(location.mapsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ size: "lg" })} flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-md shadow-primary/10`}
          >
            <MapPinIcon className="size-5" />
            Open in Google Maps
            <ArrowUpRightIcon className="ml-auto size-4" />
          </a>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={copyLink}
              className="h-12 rounded-xl"
            >
              {isCopied ? (
                <CheckIcon className="size-4 text-emerald-500" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {isCopied ? "Copied" : "Copy link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={shareOnWhatsApp}
              className="h-12 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <MessageCircleIcon className="size-4" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="mt-7 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          Shared with you through{" "}
          <span className="font-semibold text-foreground">
            Gemezy
          </span>
        </p>
      </footer>

    </main>
  );
}
