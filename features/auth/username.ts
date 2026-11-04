export const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 100;
export const USERNAME_LENGTH_ERROR =
  `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`;
export const USERNAME_FORMAT_ERROR =
  "Use only letters, numbers, periods, and underscores. Spaces aren't allowed.";

export function normalizeUsername(username: string) {
  return username.toLowerCase();
}
