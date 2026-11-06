"use client";

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { themes } from "@/app/themes";
import { PaletteIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeSwitcher({ isMobile = false }: { isMobile?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="h-10 gap-3 text-base">
        <PaletteIcon className="size-5" />
        Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        positionerClassName={isMobile ? "z-[60]" : undefined}
      >
        <DropdownMenuRadioGroup
          value={resolvedTheme ?? "light"}
          onValueChange={setTheme}
        >
          {themes.map((theme) => {
            const ThemeIcon = theme.icon;

            return (
              <DropdownMenuRadioItem
                key={theme.id}
                value={theme.id}
                className="h-10 gap-3 text-base"
              >
                <ThemeIcon className="size-5" />
                {theme.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}