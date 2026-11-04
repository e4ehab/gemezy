export const LOCATION_PUBLIC_ID_PATTERN = /^LOC@\d{8}$/i;

export const MAX_LOCATION_IMAGES = 5;
export const MAX_LOCATION_IMAGE_SIZE = 5 * 1024 * 1024;
export const LOCATION_IMAGE_ACCEPT = "image/avif,image/jpeg,image/png,image/webp";
export const LOCATION_IMAGE_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const LOCATION_VISIBILITIES = ["PRIVATE", "PUBLIC", "FRIENDS_ONLY"] as const;
export type LocationVisibility = (typeof LOCATION_VISIBILITIES)[number];