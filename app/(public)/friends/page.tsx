import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import {
  FriendsView,
  FriendsViewError,
} from "@/features/friends/views/friends-view";
import { FriendsViewLoading } from "@/features/friends/views/friendsviewloading";
import { prefetchFriends } from "@/features/friends/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";

export default async function FriendsPage() {
  await requireAuth();
  prefetchFriends();

  return (
    <HydrateClient>
      <Suspense fallback={<FriendsViewLoading />}>
        <ErrorBoundary FallbackComponent={FriendsViewError}>
          <FriendsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
