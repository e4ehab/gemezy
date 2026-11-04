import { BlockedUsersView } from "@/features/friends/views/blocked-users-view";
import { prefetchBlockedUsers } from "@/features/friends/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";

export default async function BlockedUsersPage() {
  const session = await requireAuth();
  const initialData = await prefetchBlockedUsers(session);

  return (
    <HydrateClient>
      <BlockedUsersView initialData={initialData} />
    </HydrateClient>
  );
}
