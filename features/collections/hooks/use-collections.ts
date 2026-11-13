"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";

export function useSetCollectionSaved() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collections.setSaved.mutationOptions({
      onSuccess: async (_result, input) => {
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.collections.getSavedIds.queryFilter(),
          ),
          queryClient.invalidateQueries(trpc.collections.getMany.queryFilter()),
        ]);
        toast.success(
          input.isSaved
            ? "Added to saved collections"
            : "Removed from saved collections",
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
