export type FriendRequestRecord = {
  id: string;
  senderId: string;
  recipientId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
};

export const FRIEND_LOCATION_VISIBILITIES: Array<"PUBLIC" | "FRIENDS_ONLY"> = [
  "PUBLIC",
  "FRIENDS_ONLY",
];
export const ACCEPTED_FRIENDSHIP_STATUS = "ACCEPTED" as const;

export function isLocationVisibleToFriend(visibility: string) {
  return FRIEND_LOCATION_VISIBILITIES.some((value) => value === visibility);
}

export function getFriendVisibleLocationVisibilities(isAcceptedFriend: boolean) {
  return isAcceptedFriend ? FRIEND_LOCATION_VISIBILITIES : ["PUBLIC" as const];
}

export function canViewPublicLocations(isBlocked: boolean) {
  return !isBlocked;
}

export function canViewFriendsOnlyLocations(isAcceptedFriend: boolean) {
  return isAcceptedFriend;
}

export function canSendFriendRequest(isBlocked: boolean) {
  return !isBlocked;
}

export function canRemoveFriendship(status: FriendRequestRecord["status"]) {
  return status === ACCEPTED_FRIENDSHIP_STATUS;
}

export function classifyRequestPair(
  currentUserId: string,
  requests: FriendRequestRecord[],
):
  | { kind: "accepted" }
  | { kind: "pending-outgoing" | "pending-incoming" }
  | { kind: "retry-outgoing"; requestId: string }
  | { kind: "new" } {
  const accepted = requests.some((request) => request.status === "ACCEPTED");
  if (accepted) return { kind: "accepted" };

  const pending = requests.find((request) => request.status === "PENDING");
  if (pending) {
    return {
      kind: pending.senderId === currentUserId ? "pending-outgoing" : "pending-incoming",
    };
  }

  const declinedOutgoing = requests.find(
    (request) =>
      request.status === "DECLINED" && request.senderId === currentUserId,
  );
  return declinedOutgoing
    ? { kind: "retry-outgoing", requestId: declinedOutgoing.id }
    : { kind: "new" };
}

export function canRespondToFriendRequest(
  request: Pick<FriendRequestRecord, "recipientId" | "status">,
  currentUserId: string,
) {
  return request.status === "PENDING" && request.recipientId === currentUserId;
}

export function getFriendRequestResponseStatus(
  status: FriendRequestRecord["status"],
  isRecipient: boolean,
  response: "ACCEPTED" | "DECLINED",
) {
  if (status !== "PENDING" || !isRecipient) return null;
  return response;
}

export function canCancelFriendRequest(
  request: Pick<FriendRequestRecord, "senderId" | "status">,
  currentUserId: string,
) {
  return request.status === "PENDING" && request.senderId === currentUserId;
}
