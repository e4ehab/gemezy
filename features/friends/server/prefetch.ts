import { getQueryClient, prefetch, trpc } from "@/trpc/server";
import { appRouter } from "@/trpc/routers/_app";
import type { requireAuth } from "@/lib/auth-utils";

type AuthenticatedSession = Awaited<ReturnType<typeof requireAuth>>;

export const prefetchFriends = () => {
  prefetch(trpc.friends.getMany.queryOptions());
};

export const prefetchFriend = async (
  username: string,
  session: AuthenticatedSession,
) => {
  const caller = appRouter.createCaller({ session });
  const queryOptions = trpc.friends.getByUsername.queryOptions({ username });
  const data = await caller.friends.getByUsername({ username });
  getQueryClient().setQueryData(queryOptions.queryKey, data);
  return data;
};

export const prefetchBlockedUsers = async (
  session: AuthenticatedSession,
) => {
  const caller = appRouter.createCaller({ session });
  const queryOptions = trpc.friends.getBlocked.queryOptions();
  const data = await caller.friends.getBlocked();
  getQueryClient().setQueryData(queryOptions.queryKey, data);
  return data;
};
