"use client";

import Link from "next/link";
import { useState } from "react";
import type { FallbackProps } from "react-error-boundary";
import {
  ArrowUpRightIcon,
  CheckIcon,
  EllipsisIcon,
  LoaderCircleIcon,
  UserRoundMinusIcon,
  UserRoundXIcon,
  UsersRoundIcon,
  XIcon,
  ShieldBanIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorState } from "@/components/states/error-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useBlockUser,
  useCancelFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
  useFriends,
} from "@/features/friends/hooks/use-friends";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FriendsViewError({ resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Could not load friends"
      description="Something went wrong while loading your friend list. Please try again."
      onRetry={resetErrorBoundary}
    />
  );
}

export function FriendsView() {
  const { data, isError, refetch } = useFriends();
  const cancelRequest = useCancelFriendRequest();
  const respondToRequest = useRespondToFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const [friendToRemove, setFriendToRemove] = useState<{
    publicId: string;
    name: string;
  } | null>(null);
  const [friendToBlock, setFriendToBlock] = useState<{
    publicId: string;
    name: string;
  } | null>(null);
  const respond = async (
    requestId: string,
    response: "ACCEPTED" | "DECLINED",
    name: string,
  ) => {
    try {
      await respondToRequest.mutateAsync({ requestId, response });
      toast.success(
        response === "ACCEPTED" ? "Friend added" : "Invitation declined",
        response === "ACCEPTED"
          ? { description: `${name} is now on your friends list.` }
          : undefined,
      );
    } catch (error) {
      toast.error("Could not update invitation", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const cancelOutgoingRequest = async (requestId: string, name: string) => {
    try {
      await cancelRequest.mutateAsync({ requestId });
      toast.success("Invitation cancelled", {
        description: `Your request to ${name} was cancelled.`,
      });
    } catch (error) {
      toast.error("Could not cancel invitation", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const confirmBlock = async () => {
    if (!friendToBlock) return;
    try {
      await blockUser.mutateAsync({ friendId: friendToBlock.publicId });
      toast.success("User blocked", {
        description: `${friendToBlock.name} can no longer send you friend requests or view your friend collection.`,
      });
      setFriendToBlock(null);
    } catch (error) {
      toast.error("Could not block user", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <main className="mx-auto w-full max-w-5xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      {isError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span>Could not refresh friend data. Your last loaded list is still shown.</span>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Friends</h1>
      </header>

      {data.incomingRequests.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Friend requests</h2>
            <p className="text-sm text-muted-foreground">
              Public locations are visible now. Accept to also see locations shared with friends.
            </p>
          </div>
          <ul className="space-y-3">
            {data.incomingRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-11 shrink-0">
                    <AvatarImage src={request.sender.image ?? undefined} alt="" />
                    <AvatarFallback>{initials(request.sender.name)}</AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/friends/${encodeURIComponent(request.sender.name)}`}
                    className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="truncate font-medium">{request.sender.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {request.sender.publicId}
                    </p>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    type="button"
                    className="min-h-11"
                    disabled={respondToRequest.isPending}
                    onClick={() => respond(request.id, "ACCEPTED", request.sender.name)}
                  >
                    {respondToRequest.isPending ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <CheckIcon />
                    )}
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={respondToRequest.isPending}
                    onClick={() => respond(request.id, "DECLINED", request.sender.name)}
                  >
                    <XIcon />
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.outgoingRequests.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Pending requests</h2>
            <p className="text-sm text-muted-foreground">
              These invitations are waiting for a response.
            </p>
          </div>
          <ul className="space-y-2">
            {data.outgoingRequests.map((request) => (
              <li
                key={request.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={request.recipient.image ?? undefined} alt="" />
                  <AvatarFallback>{initials(request.recipient.name)}</AvatarFallback>
                </Avatar>
                <Link
                  href={`/friends/${encodeURIComponent(request.recipient.name)}`}
                  className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="truncate text-sm font-medium">{request.recipient.name}</p>
                  <p className="text-xs text-muted-foreground">View public locations · Pending</p>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cancelRequest.isPending}
                  onClick={() =>
                    cancelOutgoingRequest(request.id, request.recipient.name)
                  }
                >
                  {cancelRequest.isPending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <UserRoundXIcon />
                  )}
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {data.friends.length === 1
              ? "1 friend"
              : `${data.friends.length} friends`}
          </p>
        </div>

        {data.friends.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-5 py-12 text-center">
            <UsersRoundIcon className="mb-3 size-10 text-primary/70" aria-hidden="true" />
            <h3 className="font-semibold">No friends found</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Search for someone to view their public locations. Send a friend
              request to unlock locations they share with friends.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {data.friends.map((friend) => (
              <li
                key={friend.publicId}
                className="group flex min-w-0 items-center gap-3 px-3 py-2 sm:px-4"
              >
                <Link
                  href={`/friends/${encodeURIComponent(friend.name)}`}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="size-11 shrink-0">
                    <AvatarImage src={friend.image ?? undefined} alt="" />
                    <AvatarFallback>{initials(friend.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{friend.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {friend.publicId}
                    </span>
                  </span>
                  <ArrowUpRightIcon className="mr-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted"
                    aria-label={`Actions for ${friend.name}`}
                    title={`Actions for ${friend.name}`}
                  >
                    <EllipsisIcon className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right">
                    <DropdownMenuItem
                      onClick={() =>
                        setFriendToBlock({
                          publicId: friend.publicId,
                          name: friend.name,
                        })
                      }
                    >
                      <ShieldBanIcon />
                      Block
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        setFriendToRemove({
                          publicId: friend.publicId,
                          name: friend.name,
                        })
                      }
                    >
                      <UserRoundMinusIcon />
                      Remove friend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </section>
      </main>

      <AlertDialog
        open={friendToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !removeFriend.isPending) setFriendToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {friendToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your friends list and revoke access to
              each other&apos;s public friend collections. You can send a new
              friend request later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeFriend.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeFriend.isPending || friendToRemove === null}
              onClick={async (event) => {
                event.preventDefault();
                if (!friendToRemove) return;
                try {
                  await removeFriend.mutateAsync({
                    friendId: friendToRemove.publicId,
                  });
                  toast.success("Friend removed", {
                    description: `${friendToRemove.name} was removed.`,
                  });
                  setFriendToRemove(null);
                } catch (error) {
                  toast.error("Could not remove friend", {
                    description:
                      error instanceof Error ? error.message : "Please try again.",
                  });
                }
              }}
            >
              {removeFriend.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Remove friend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={friendToBlock !== null}
        onOpenChange={(open) => {
          if (!open && !blockUser.isPending) setFriendToBlock(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {friendToBlock?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocking removes the friendship and pending invitations. They will not
              be able to invite you or view your friend collection. You can unblock
              them later from More &gt; Blocked users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={blockUser.isPending || friendToBlock === null}
              onClick={async (event) => {
                event.preventDefault();
                await confirmBlock();
              }}
            >
              {blockUser.isPending && <LoaderCircleIcon className="animate-spin" />}
              Block user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
