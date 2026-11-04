
"use client";

import { CircleAlertIcon, MapPinIcon, UserRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function SearchHelp() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground sm:size-7"
            aria-label="How search works"
          />
        }
      >
        <CircleAlertIcon className="size-4" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-72"
      >
        <PopoverHeader>
          <PopoverTitle>Find anything on GemEzy</PopoverTitle>
          <PopoverDescription>
            Search locations by their public name, unique LocationName, ID, or tags.
          </PopoverDescription>
        </PopoverHeader>

        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-3">
            <UserRoundIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">People</p>
              <p className="text-xs text-muted-foreground">
                Use id:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                  GEM@35914663
                </code>
                {" "}to view public locations or send a friend request. Accepted friends can see friends-only locations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Locations</p>
              <p className="text-xs text-muted-foreground">
                Use Name:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                  cafe
                </code>
                {" "}or id:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                  LOC@48271635
                </code>
              </p>
            </div>
          </div>

          <p className="border-t pt-3 text-xs text-muted-foreground">
            IDs aren&apos;t case-sensitive. You can type uppercase or lowercase.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
