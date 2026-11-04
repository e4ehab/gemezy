"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import type { inferRouterOutputs } from "@trpc/server";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  useFriend,
  useSendFriendRequest,
} from "@/features/friends/hooks/use-friends";
import {
  getGoogleMapsUrl,
  getLocationSharePath,
  getPublicLocationSharePath,
} from "@/features/locations/utils";
import type { AppRouter } from "@/trpc/routers/_app";

type FriendData = inferRouterOutputs<AppRouter>["friends"]["getByUsername"];

export function FriendIdViewLoading() {
  return (
    <LoadingState
      title="Loading friend"
      description="Finding the locations they have shared with you."
    />
  );
}

export function FriendIdViewError({ resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Could not load this friend"
      description="This friend may have been removed, or their public locations could not be loaded."
      onRetry={resetErrorBoundary}
    />
  );
}

export function FriendIdView({
  username,
  initialData,
}: {
  username: string;
  initialData: FriendData;
}) {
  const { data: queryData, isError, refetch } = useFriend(username, initialData);
  const data = queryData ?? initialData;
  const sendFriendRequest = useSendFriendRequest();

  const sendRequest = async () => {
    try {
      await sendFriendRequest.mutateAsync({ friendId: data.friend.publicId });
      toast.success("Friend request sent");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send friend request",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      {isError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span>Could not refresh this friend&apos;s locations.</span>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Link
          href="/friends"
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} -ml-2`}
        >
          <ArrowLeftIcon />
          Friends
        </Link>
        <div className="shrink-0">
          {data.relationship === "NONE" && (
            <Button
              type="button"
              variant="default"
              className="min-h-11 px-3 font-semibold shadow-md ring-2 ring-primary/25 hover:shadow-lg sm:px-5"
              disabled={sendFriendRequest.isPending}
              onClick={() => void sendRequest()}
            >
              <UserPlusIcon />
              Add friend
            </Button>
          )}
          {data.relationship === "PENDING" && (
            <span className="text-sm text-muted-foreground">Request pending</span>
          )}
        </div>
      </div>

      <header className="flex min-w-0 items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-xl font-semibold text-primary sm:size-16">
          {data.friend.image ? (
            <Image
              src={data.friend.image}
              alt=""
              width={64}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            data.friend.name.trim().slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {data.friend.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{data.friend.publicId}</p>
        </div>
      </header>

      <hr className="border-border" />

      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {data.relationship === "FRIENDS"
              ? "Locations shared with you"
              : "Public locations"}
          </h2>
        </div>

        {data.locations.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-5 py-12 text-center">
            <UsersRoundIcon className="mb-3 size-10 text-primary/70" aria-hidden="true" />
            <h3 className="font-semibold">
              {data.relationship === "FRIENDS"
                ? "No locations shared yet"
                : "No public locations yet"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {data.relationship === "FRIENDS"
                ? `${data.friend.name} hasn’t shared any locations with you yet.`
                : `${data.friend.name} hasn’t made any locations public yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.locations.map((location) => (
              <Card
                key={location.shareId}
                className="overflow-hidden border-border bg-card text-card-foreground"
              >
                <div className="relative flex aspect-16/10 items-center justify-center overflow-hidden bg-linear-to-br from-primary/20 via-accent/20 to-muted">
                  {location.images[0] ? (
                    <Image
                      src={location.images[0]}
                      alt={location.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      style={{
                        objectPosition: `${location.imagePositionX}% ${location.imagePositionY}%`,
                      }}
                    />
                  ) : (
                    <MapPinIcon className="size-10 text-primary" aria-hidden="true" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <h3 className="line-clamp-2 font-semibold">{location.name}</h3>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={
                      location.shareSlug
                        ? getPublicLocationSharePath(location.shareSlug)
                        : getLocationSharePath(location.shareId)
                    }
                    className={`${buttonVariants()} min-h-11 w-full sm:flex-1`}
                  >
                    View location
                    <ArrowUpRightIcon />
                  </Link>
                  <a
                    href={getGoogleMapsUrl(location.mapsUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonVariants({ variant: "outline" })} min-h-11 w-full sm:w-auto`}
                  >
                    <MapPinIcon />
                    Maps
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}