import { LoadingState } from "@/components/states/loading-state";

export function FriendsViewLoading() {
  return (
    <LoadingState
      title="Loading friends"
      description="Getting your friend list and invitations ready."
    />
  );
}
