export const LOCATION_REPORT_REASONS = [
  "INAPPROPRIATE",
  "MISLEADING",
  "PRIVACY",
  "OTHER",
] as const;
export type LocationReportReason = (typeof LOCATION_REPORT_REASONS)[number];

export const LOCATION_REPORT_REASON_LABELS: Record<LocationReportReason, string> = {
  INAPPROPRIATE: "Inappropriate content",
  MISLEADING: "Misleading information",
  PRIVACY: "Privacy concern",
  OTHER: "Other",
};

export const EXPLORE_PAGE_SIZE = 10;
