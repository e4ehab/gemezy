"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { MapPinIcon, UsersRoundIcon } from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandResponsiveDialog,
} from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";
import { FRIEND_PUBLIC_ID_PATTERN } from "@/features/friends/constants";
import { LOCATION_PUBLIC_ID_PATTERN } from "@/features/locations/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function matchesSearch(value: string | null | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query));
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const locationsQuery = useQuery({
    ...trpc.locations.getMany.queryOptions(),
    enabled: open,
  });
  const friendsQuery = useQuery({
    ...trpc.friends.getMany.queryOptions(),
    enabled: open,
  });
  const locations = locationsQuery.data ?? [];
  const friends = friendsQuery.data?.friends ?? [];
  const normalizedSearch = search.trim().toLowerCase().replace(/^#/, "");
  const canonicalId = search.trim().toUpperCase();
  const isFriendId = FRIEND_PUBLIC_ID_PATTERN.test(search.trim());
  const isLocationId = LOCATION_PUBLIC_ID_PATTERN.test(search.trim());
  const matchingLocations = locations.filter((location) => {
    if (!normalizedSearch) return true;
    return [
      location.name,
      location.locationName,
      location.publicId,
      ...location.tags,
    ].some((value) => matchesSearch(value, normalizedSearch));
  });
  const matchingFriends = normalizedSearch
    ? friends.filter(
        (friend) =>
          matchesSearch(friend.name, normalizedSearch) ||
          matchesSearch(friend.publicId, normalizedSearch),
      )
    : [];
  const friendWithId = friends.find(
    (friend) => friend.publicId.toUpperCase() === canonicalId,
  );
  const friendProfileQuery = useQuery({
    ...trpc.friends.getByUsername.queryOptions({ username: canonicalId }),
    enabled: open && isFriendId && !friendWithId,
    retry: false,
  });
  const friendUsername = friendWithId?.name ?? friendProfileQuery.data?.friend.name;
  const isFriendProfilePending =
    isFriendId && !friendWithId && friendProfileQuery.isPending;
  const isPending =
    locationsQuery.isPending || friendsQuery.isPending || isFriendProfilePending;
  const isError = locationsQuery.isError || friendsQuery.isError;
  const hasResults =
    matchingLocations.length > 0 ||
    matchingFriends.length > 0 ||
    (isFriendId && Boolean(friendUsername));

  return (
    <CommandResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      title="Search friends and locations"
      description="Search a GEM@ ID to open a user's profile and view their public locations. Send a friend request from their profile to access friends-only locations."
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search GEM@ users or LOC@ locations..."
      />
      <CommandList>
        {isPending && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Searching your collection...
          </div>
        )}
        {isError && (
          <div className="px-4 py-6 text-center text-sm text-destructive">
            Could not load search results. Close this and try again.
          </div>
        )}
        {!isPending && !isError && (
          <>
            {(isFriendId && Boolean(friendUsername) || matchingFriends.length > 0) && (
              <CommandGroup heading="Users">
                {isFriendId && friendUsername && (
                  <CommandItem
                    value={`profile ${friendUsername} ${canonicalId}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/friends/${encodeURIComponent(friendUsername)}`);
                    }}
                    className="items-start gap-3 px-3 py-3"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UsersRoundIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">View profile</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {friendUsername} · {canonicalId}
                      </span>
                    </span>
                  </CommandItem>
                )}
                {matchingFriends.map((friend) => (
                  <CommandItem
                    key={friend.publicId}
                    value={`${friend.name} ${friend.publicId}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/friends/${encodeURIComponent(friend.name)}`);
                    }}
                    className="items-start gap-3 px-3 py-3"
                  >
                    <Avatar className="mt-0.5 size-9">
                      <AvatarImage src={friend.image ?? undefined} alt="" />
                      <AvatarFallback>
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{friend.name}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                        {friend.publicId}
                      </span>
                    </span>
                    <UsersRoundIcon className="size-4 shrink-0 self-center text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchingLocations.length > 0 && (
              <CommandGroup heading="Locations">
                {matchingLocations.map((location) => (
                  <CommandItem
                    key={location.publicId}
                    value={`${location.name} ${location.locationName} ${location.publicId} ${location.tags.join(" ")}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/locations/${encodeURIComponent(location.slug)}`);
                    }}
                    className="items-start gap-3 px-3 py-3"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPinIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{location.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {location.locationName} · {location.publicId}
                      </span>
                      {location.tags.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {location.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 self-center font-mono text-[10px] text-muted-foreground">
                      {location.publicId}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!hasResults && (
              <CommandEmpty>
                {isFriendId
                  ? friendProfileQuery.isError
                    ? "Could not find this user profile."
                    : "Finding user profile..."
                  : isLocationId
                    ? "No location matches this ID."
                    : locations.length === 0 && friends.length === 0
                      ? "No saved locations or friends yet."
                      : "No matching users or locations. Try GEM@ or LOC@ in any letter case."}
              </CommandEmpty>
            )}
          </>
        )}
      </CommandList>
    </CommandResponsiveDialog>
  );
};
