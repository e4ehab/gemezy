import { FRIEND_PUBLIC_ID_PATTERN } from "@/features/friends/constants";

export function normalizeFriendPublicId(value: string) {
  const publicId = value.trim().toUpperCase();
  return FRIEND_PUBLIC_ID_PATTERN.test(publicId) ? publicId : null;
}