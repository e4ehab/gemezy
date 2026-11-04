"use client";

import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { ShieldOffIcon, UsersRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useBlockedUsers, useUnblockUser } from "@/features/friends/hooks/use-friends";
import type { AppRouter } from "@/trpc/routers/_app";

type BlockedUsers = inferRouterOutputs<AppRouter>["friends"]["getBlocked"];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BlockedUsersView({
  initialData,
}: {
  initialData: BlockedUsers;
}) {
  const { data = initialData, isError, refetch } = useBlockedUsers(initialData);
  const unblockUser = useUnblockUser();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  if (isError) {
    return (
      <ErrorState
        title="Could not load blocked users"
        description="Please check your connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Privacy controls</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Blocked users
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Blocked users cannot send you friend requests or view your friend
          collection.
        </p>
        <p className="max-w-2xl text-muted-foreground">
        You can unblock someone here at any time.
      </p>
    </header>

      {
    data.length === 0 ? (
      <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-5 py-12 text-center">
        <UsersRoundIcon className="mb-3 size-10 text-primary/70" aria-hidden="true" />
        <h2 className="font-semibold">No blocked users</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Users you block will appear here.
        </p>
      </div>
    ) : (
    <ul className="space-y-3">
      {data.map(({ blocked }) => (
        <li
          key={blocked.publicId}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Avatar className="size-11 shrink-0">
            <AvatarImage src={blocked.image ?? undefined} alt="" />
            <AvatarFallback>{initials(blocked.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{blocked.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {blocked.publicId}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={unblockUser.isPending}
            onClick={async () => {
              setUnblockingId(blocked.publicId);
              try {
                await unblockUser.mutateAsync({ friendId: blocked.publicId });
                toast.success("User unblocked", {
                  description: `${blocked.name} may send you a friend request again.`,
                });
              } catch (error) {
                toast.error("Could not unblock user", {
                  description:
                    error instanceof Error ? error.message : "Please try again.",
                });
              } finally {
                setUnblockingId(null);
              }
            }}
          >
            <ShieldOffIcon />
            {unblockingId === blocked.publicId ? "Unblocking..." : "Unblock"}
          </Button>
        </li>
      ))}
    </ul>
  )
  }
    </main >
  );
}

export function BlockedUsersLoading() {
  return (
    <LoadingState
      title="Loading blocked users"
      description="Getting your privacy controls ready."
    />
  );
}
