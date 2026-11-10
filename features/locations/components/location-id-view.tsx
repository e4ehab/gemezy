
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompassIcon,
  CreditCardIcon,
  LoaderCircleIcon,
  MapPinIcon,
  PencilIcon,
  TimerIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import type { FallbackProps } from "react-error-boundary";

import { toast } from "@/components/ui/toast";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { buttonVariants } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  cleanPromotionCheckoutReturnUrl,
  getGoogleMapsUrl,
} from "@/features/locations/utils";
import { cn } from "@/lib/utils";

import {
  useDeleteLocation,
  useSuspenseLocation,
} from "@/features/locations/hooks/use-locations";

import { LocationSharingPanel } from "@/features/locations/components/location-sharing-panel";
import { PromoteLocationDialog } from "@/features/locations/components/promote-location-dialog";
import {
  getLocationPromotionState,
  getPromotionPlanBySlug,
  getPromotionPlanByValue,
} from "@/features/locations/constants/promotion-plans";

type LocationIdViewProps = {
  slug: string;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function LocationIdViewLoading() {
  return (
    <LoadingState
      title="Loading location"
      description="Preparing your saved place details."
    />
  );
}

export function LocationIdViewError({
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <ErrorState
      title="Error loading location"
      description="Could not load this location. It may not exist or may not be available to your account."
      onRetry={resetErrorBoundary}
    />
  );
}

export function LocationIdView({
  slug,
}: LocationIdViewProps) {
  const router = useRouter();

  const { data: location, refetch } = useSuspenseLocation(slug);
  const deleteLocation = useDeleteLocation();
  const hasHandledCheckoutReturn = useRef(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const images = location.images ?? [];
  const activeImage = images[activeImageIndex];

  const mapsUrl = getGoogleMapsUrl(location.mapsUrl);
  const promotionExpiry =
    location.promotion?.status === "ACTIVE"
      ? location.promotion.expiresAt
      : location.promotion?.status === "PENDING"
        ? location.promotion.pendingUntil
        : null;

  useEffect(() => {
    if (!promotionExpiry) return;

    const timeout = window.setTimeout(
      () => setCurrentTime(new Date()),
      Math.max(0, promotionExpiry.getTime() - Date.now()) + 10,
    );
    return () => window.clearTimeout(timeout);
  }, [promotionExpiry]);

  const promotionState = getLocationPromotionState(
    location.promotion,
    currentTime,
  );
  const currentPromotion =
    promotionState === "ACTIVE" ? location.promotion : null;
  const pendingPromotion =
    promotionState === "PENDING" ? location.promotion : null;
  const currentPromotionPlan = currentPromotion
    ? getPromotionPlanByValue(currentPromotion.plan)
    : undefined;

  useEffect(() => {
    if (hasHandledCheckoutReturn.current) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("promotion") !== "success") return;
    hasHandledCheckoutReturn.current = true;

    const planSlug = url.searchParams.get("plan");
    const selectedPlan = planSlug
      ? getPromotionPlanBySlug(planSlug)
      : undefined;
    const planTitle = selectedPlan?.title ?? "Your promotion";
    cleanPromotionCheckoutReturnUrl(url);
    window.history.replaceState(window.history.state, "", url.toString());

    toast.info(
      "Payment received",
      `Confirming ${planTitle} for ${location.name}...`,
    );

    let attempts = 0;
    let timeout: number | undefined;
    let canceled = false;
    const finish = (message?: string) => {
      if (message) toast.info(message);
    };

    const checkPromotion = async () => {
      try {
        const result = await refetch();
        if (canceled) return;

        const promotion = result.data?.promotion;
        const isActivated =
          promotion?.status === "ACTIVE" &&
          promotion.expiresAt !== null &&
          promotion.expiresAt > new Date() &&
          (!selectedPlan || promotion.plan === selectedPlan.value);

        if (isActivated) {
          toast.success(
            `${planTitle} activated`,
            `${location.name} is now promoted.`,
          );
          return;
        }

        attempts += 1;
        if (attempts >= 30) {
          finish(
            `Payment was received for ${planTitle} at ${location.name}. Activation is taking longer than expected; refresh this page shortly.`,
          );
          return;
        }

        timeout = window.setTimeout(checkPromotion, 2000);
      } catch {
        if (!canceled) {
          finish(
            `Payment was received for ${planTitle} at ${location.name}, but activation could not be confirmed. Refresh this page shortly.`,
          );
        }
      }
    };

    void checkPromotion();
    return () => {
      canceled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [location.name, refetch]);

  const createdAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(location.createdAt);

  const showPreviousImage = () => {
    setActiveImageIndex(
      (index) =>
        (index - 1 + images.length) % images.length,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex(
      (index) => (index + 1) % images.length,
    );
  };

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync({ slug });

      setIsDeleteDialogOpen(false);

      toast.success("Location deleted");

      router.push("/locations");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete this location",
      );
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-clip">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        <header className="mb-6 space-y-2 sm:mb-8">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPinIcon className="size-5" />
              </div>
              <h1 className="min-w-0 wrap-break-word text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {location.name}
              </h1>
            </div>
            <Link
              href="/locations"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0",
              )}
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">My locations</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>

          {location.address && (
            <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground sm:text-base">
              <MapPinIcon className="mt-1 size-4 shrink-0 text-primary" />
              <span className="min-w-0 wrap-break-word">{location.address}</span>
            </p>
          )}
        </header>

        {/* Responsive main layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* Main content */}
          <div className="min-w-0 space-y-6 sm:space-y-8">

            {/* Photo gallery */}
            <section
              aria-label="Location photos"
              className="space-y-3"
            >
              <div
                className={`grid items-center gap-2 sm:gap-4 ${
                  images.length > 1
                    ? "grid-cols-[auto_minmax(0,1fr)_auto]"
                    : "grid-cols-1"
                }`}
              >
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Show previous photo"
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center",
                      "rounded-full border border-border bg-card text-foreground shadow-sm",
                      "transition hover:bg-muted sm:size-11",
                      focusRing,
                    )}
                  >
                    <ChevronLeftIcon className="size-5" />
                  </button>
                )}

                {activeImage ? (
                  <div className="flex min-w-0 justify-center">
                    <div className="relative w-fit max-w-full overflow-hidden rounded-2xl border border-border shadow-lg shadow-black/10">
                      <Image
                        src={activeImage}
                        alt={`${location.name} photo ${
                          activeImageIndex + 1
                        }`}
                        width={1600}
                        height={1200}
                        unoptimized
                        priority={activeImageIndex === 0}
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="block h-auto max-h-[min(68dvh,48rem)] w-auto max-w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-48 min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-muted-foreground">
                    <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted text-primary shadow-sm sm:size-20">
                      <MapPinIcon className="size-8 sm:size-10" />
                    </div>
                    <p className="text-sm font-medium">No photos available</p>
                  </div>
                )}

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Show next photo"
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center",
                      "rounded-full border border-border bg-card text-foreground shadow-sm",
                      "transition hover:bg-muted sm:size-11",
                      focusRing,
                    )}
                  >
                    <ChevronRightIcon className="size-5" />
                  </button>
                )}
              </div>

              {images.length > 0 && (
                <div className="text-center text-xs text-muted-foreground">
                  Photo {activeImageIndex + 1} of {images.length}
                </div>
              )}

              {/* Thumbnail gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-1 py-1 scrollbar-hidden">
                  {images.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImageIndex(index)
                      }
                      aria-label={`Show photo ${index + 1}`}
                      aria-pressed={
                        activeImageIndex === index
                      }
                      className={cn(
                        "relative size-14 shrink-0",
                        "overflow-hidden rounded-xl",
                        "transition-all sm:size-16",
                        focusRing,
                        activeImageIndex === index
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "opacity-60 hover:opacity-100",
                      )}
                    >
                      <Image
                        src={imageUrl}
                        alt=""
                        aria-hidden="true"
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Location information */}
            <section className="space-y-4">
              {/* Tags */}
              {location.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {location.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary sm:text-sm"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}

              {/* Description */}
              {location.description && (
                <div className="max-w-3xl">
                  <h2 className="mb-2 text-sm font-semibold sm:text-base">
                    About this place
                  </h2>

                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground sm:text-base">
                    {location.description}
                  </p>
                </div>
              )}
            </section>

            {/* Location metadata */}
            <section className="rounded-2xl border border-border bg-card px-4 sm:px-5">
              <div className="flex min-h-14 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDaysIcon className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Saved on
                  </p>

                  <p className="text-sm font-medium">
                    {createdAt}
                  </p>
                </div>
              </div>


            </section>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-6">

            <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold">Current plan</h2>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {currentPromotion ? (
                    <BadgeCheckIcon className="size-4" />
                  ) : pendingPromotion ? (
                    <TimerIcon className="size-4" />
                  ) : (
                    <CreditCardIcon className="size-4" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {currentPromotionPlan?.title ??
                      (pendingPromotion
                        ? "Checkout pending"
                        : "Free")}
                  </p>
                  {currentPromotion?.expiresAt && (
                    <p className="text-sm text-muted-foreground">
                      Active until{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "long",
                      }).format(currentPromotion.expiresAt)}
                    </p>
                  )}
                  {pendingPromotion && (
                    <p className="text-sm text-muted-foreground">
                      Complete checkout to activate your plan.
                    </p>
                  )}
                  {!currentPromotion && !pendingPromotion && (
                    <p className="text-sm text-muted-foreground">
                      No active promotion for this location.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Primary actions */}
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">

              <h2 className="text-sm font-semibold">
                Location actions
              </h2>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-12 w-full justify-center gap-2",
                  "shadow-sm shadow-primary/15",
                )}
              >
                <CompassIcon className="size-4" />
                Open in Google Maps
                <ArrowUpRightIcon className="ml-auto size-4" />
              </a>

              <Link
                href={`/locations/${slug}/edit`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                  }),
                  "min-h-12 w-full justify-center gap-2",
                )}
              >
                <PencilIcon className="size-4" />
                Edit location
              </Link>

              <PromoteLocationDialog
                locationId={location.id}
                locationSlug={slug}
                isUnavailable={promotionState !== "FREE"}
              />

              {/* Delete action */}
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                  if (!deleteLocation.isPending) {
                    setIsDeleteDialogOpen(open);
                  }
                }}
              >
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      disabled={deleteLocation.isPending}
                      className={cn(
                        buttonVariants({
                          variant: "ghost",
                          size: "lg",
                        }),
                        "min-h-11 w-full justify-center gap-2",
                        "text-destructive hover:bg-destructive/10",
                        "hover:text-destructive",
                      )}
                    />
                  }
                >
                  <Trash2Icon className="size-4" />
                  Delete location
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                      <AlertTriangleIcon />
                    </AlertDialogMedia>

                    <AlertDialogTitle>
                      Delete this location?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <strong>{location.name}</strong>{" "}
                      from your collection. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      disabled={deleteLocation.isPending}
                    >
                      Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                      variant="destructive"
                      disabled={deleteLocation.isPending}
                      onClick={handleDelete}
                    >
                      {deleteLocation.isPending ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : (
                        <Trash2Icon />
                      )}

                      {deleteLocation.isPending
                        ? "Deleting..."
                        : "Delete location"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </section>

            {/* Sharing */}
            <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Share2Icon className="size-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    Manage Visibility
                  </h2>

                </div>
              </div>

              <LocationSharingPanel
                slug={slug}
                shareId={location.shareId}
                shareSlug={location.shareSlug}
                name={location.name}
                mapsUrl={mapsUrl}
                visibility={location.visibility}
              />
            </section>
          </aside>
        </div>
      </div>

    </main>
  );
}
