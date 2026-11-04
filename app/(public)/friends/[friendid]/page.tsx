import { notFound, redirect } from "next/navigation";
import {
  FriendIdView,
} from "@/features/friends/views/friend-id-view";
import { prefetchFriend } from "@/features/friends/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { FRIEND_PUBLIC_ID_PATTERN } from "@/features/friends/constants";
import { USERNAME_PATTERN } from "@/features/auth/username";

export default async function FriendDetailsPage({
  params,
}: {
  params: Promise<{ friendid: string }>;
}) {
  const session = await requireAuth();
  const { friendid: rawUsername } = await params;
  const username = rawUsername.toLowerCase();
  if (!USERNAME_PATTERN.test(username) && !FRIEND_PUBLIC_ID_PATTERN.test(username)) {
    notFound();
  }

  const initialData = await prefetchFriend(username, session);

  if (FRIEND_PUBLIC_ID_PATTERN.test(username)) {
    redirect(`/friends/${encodeURIComponent(initialData.friend.name)}`);
  }

  return (
    <HydrateClient>
      <FriendIdView username={username} initialData={initialData} />
    </HydrateClient>
  );
}