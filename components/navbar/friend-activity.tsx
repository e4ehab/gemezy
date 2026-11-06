"use client";

import { useState } from "react";
import {
  BellIcon,
  CheckIcon,
  LoaderCircleIcon,
  UserRoundPlusIcon,
  XIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useRespondToFriendRequest } from "@/features/friends/hooks/use-friends";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FriendActivity() {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const requestsQuery = useQuery({
    ...trpc.friends.getMany.queryOptions(),
    enabled: Boolean(session?.user),
    refetchInterval: 30_000,
  });
  const respondToRequest = useRespondToFriendRequest();
  const incomingRequests = requestsQuery.data?.incomingRequests ?? [];

  const respond = async (
    requestId: string,
    response: "ACCEPTED" | "DECLINED",
    name: string,
  ) => {
    try {
      await respondToRequest.mutateAsync({ requestId, response });
      setRequestsOpen(false);
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

  const iconButtonClass =
    "relative size-9 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  if (!session?.user) {
    return (
      <div
        className="h-9 w-19 shrink-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="flex h-9 w-19 shrink-0 items-center justify-end gap-0.5">
      <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconButtonClass}
              aria-label={
                incomingRequests.length
                  ? `Pending friend requests, ${incomingRequests.length}`
                  : "Pending friend requests"
              }
            />
          }
        >
          <BellIcon className="size-5" />
          {incomingRequests.length > 0 && (
            <span
              className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-sidebar"
              aria-hidden="true"
            />
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
        >
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle>Pending requests</PopoverTitle>
          </PopoverHeader>
          {requestsQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Loading notifications...
            </div>
          ) : requestsQuery.isError ? (
            <p className="px-4 py-6 text-sm text-destructive" role="alert">
              Could not load notifications. Please try again.
            </p>
          ) : incomingRequests.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              All caught up
            </p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {incomingRequests.map((request) => (
                <li key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={request.sender.image ?? undefined} alt="" />
                    <AvatarFallback>{getInitials(request.sender.name)}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 text-sm">
                    <span className="font-medium">{request.sender.name}</span>{" "}
                    sent you a friend request
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      <Popover open={requestsOpen} onOpenChange={setRequestsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconButtonClass}
              aria-label={
                incomingRequests.length
                  ? `Friend requests, ${incomingRequests.length} pending`
                  : "Friend requests"
              }
            />
          }
        >
          <UserRoundPlusIcon className="size-5" />
          {incomingRequests.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {incomingRequests.length > 9 ? "9+" : incomingRequests.length}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(24rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
        >
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle>
              Friend requests
              {incomingRequests.length > 0 && ` (${incomingRequests.length})`}
            </PopoverTitle>
          </PopoverHeader>
          {requestsQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Loading requests...
            </div>
          ) : requestsQuery.isError ? (
            <p className="px-4 py-6 text-sm text-destructive" role="alert">
              Could not load friend requests. Please try again.
            </p>
          ) : incomingRequests.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No new friend requests
            </p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {incomingRequests.map((request) => (
                <li key={request.id} className="space-y-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={request.sender.image ?? undefined} alt="" />
                      <AvatarFallback>{getInitials(request.sender.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{request.sender.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {request.sender.publicId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-12">
                    <Button
                      type="button"
                      size="sm"
                      disabled={respondToRequest.isPending}
                      onClick={() =>
                        respond(request.id, "ACCEPTED", request.sender.name)
                      }
                    >
                      {respondToRequest.isPending ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : (
                        <CheckIcon />
                      )}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={respondToRequest.isPending}
                      onClick={() =>
                        respond(request.id, "DECLINED", request.sender.name)
                      }
                    >
                      <XIcon />
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
