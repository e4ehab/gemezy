"use client";

import { EyeOffIcon, Globe2Icon, UsersIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocationVisibility } from "@/features/locations/constants";

const descriptions: Record<LocationVisibility, string> = {
  PRIVATE: "Only you can view this location.",
  FRIENDS_ONLY: "Only you and your accepted friends can view this location.",
  PUBLIC: "Anyone can view it, and it may appear in Explore.",
};

const icons = {
  PRIVATE: EyeOffIcon,
  FRIENDS_ONLY: UsersIcon,
  PUBLIC: Globe2Icon,
};

export function LocationVisibilityField({
  value,
  onChange,
  disabled = false,
}: {
  value: LocationVisibility;
  onChange: (value: LocationVisibility) => void;
  disabled?: boolean;
}) {
  const Icon = icons[value];
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="font-semibold">Location visibility</h2>
            <p className="text-sm text-muted-foreground">{descriptions[value]}</p>
          </div>
        </div>
        <Select
          value={value}
          onValueChange={(nextValue) => {
            if (
              nextValue === "PRIVATE" ||
              nextValue === "PUBLIC" ||
              nextValue === "FRIENDS_ONLY"
            ) {
              onChange(nextValue);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="min-h-11 w-full sm:w-36" aria-label="Location visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="FRIENDS_ONLY">Friends only</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
