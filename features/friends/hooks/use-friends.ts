"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";

type FriendData = inferRouterOutputs<AppRouter>["friends"]["getByUsername"];
type BlockedData = inferRouterOutputs<AppRouter>["friends"]["getBlocked"];

export function useFriends() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.friends.getMany.queryOptions());
}

export function useFriend(username: string, initialData: FriendData) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.friends.getByUsername.queryOptions({ username }),
    initialData,
  });
}

export function useBlockedUsers(initialData: BlockedData) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.friends.getBlocked.queryOptions(),
    initialData,
  });
}

export function useSendFriendRequest() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.sendRequest.mutationOptions({
      onSuccess: async () =>
        Promise.all([
          queryClient.invalidateQueries(trpc.friends.getMany.queryFilter()),
          queryClient.invalidateQueries(trpc.friends.getByUsername.queryFilter()),
        ]),
    }),
  );
}

export function useCancelFriendRequest() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.cancelRequest.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.friends.getMany.queryFilter()),
    }),
  );
}

export function useRespondToFriendRequest() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.respondToRequest.mutationOptions({
      onSuccess: async () =>
        Promise.all([
          queryClient.invalidateQueries(trpc.friends.getMany.queryFilter()),
          queryClient.invalidateQueries(trpc.friends.getByUsername.queryFilter()),
        ]),
    }),
  );
}

export function useBlockUser() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.blockUser.mutationOptions({
      onSuccess: async () =>
        Promise.all([
          queryClient.invalidateQueries(trpc.friends.getMany.queryFilter()),
          queryClient.invalidateQueries(trpc.friends.getBlocked.queryFilter()),
          queryClient.invalidateQueries(trpc.friends.getByUsername.queryFilter()),
        ]),
    }),
  );
}

export function useUnblockUser() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.unblockUser.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.friends.getBlocked.queryFilter()),
    }),
  );
}

export function useRemoveFriend() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.friends.removeFriend.mutationOptions({
      onSuccess: async () =>
        Promise.all([
          queryClient.invalidateQueries(trpc.friends.getMany.queryFilter()),
          queryClient.invalidateQueries(trpc.friends.getByUsername.queryFilter()),
        ]),
    }),
  );
}
