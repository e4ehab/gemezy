"use client";

import { Button } from "@/components/ui/button";
import { PanelLeftCloseIcon, SearchIcon, PanelRightCloseIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { DashboardCommand } from "@/components/navbar/app-command";
import { useEffect, useState } from "react";
import { FriendActivity } from "@/components/navbar/friend-activity";
import { SearchHelp } from "@/components/navbar/search-help";

export const DashboardNavbar = () => {
  const { toggleSidebar, state, openMobile } = useSidebar();

  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      // Escape clears mobile search when focused, handled natively by input anyway
      if (isTyping) return;
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />

      <nav
        className="sticky top-0 z-50 flex shrink-0 items-center gap-1 border-b border-sidebar-border bg-sidebar px-2 py-2 text-sidebar-foreground md:gap-0 md:px-4 md:py-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 md:hidden">
          <Button
            className="size-9 shrink-0 transition-colors aria-expanded:bg-accent aria-expanded:text-accent-foreground"
            variant="outline"
            onClick={toggleSidebar}
            aria-label={openMobile ? "Close navigation" : "Open navigation"}
            aria-expanded={openMobile}
            title={openMobile ? "Close navigation" : "Open navigation"}
          >
            {openMobile ? (
              <PanelLeftCloseIcon className="size-5" />
            ) : (
              <PanelRightCloseIcon className="size-5" />
            )}
          </Button>
          <SearchHelp />
          <Button
            className="h-10 min-w-0 flex-1 justify-start gap-1.5 px-2 font-medium text-primary"
            variant="outline"
            size="sm"
            onClick={() => setCommandOpen(true)}
            aria-label="Search friends or locations"
            aria-haspopup="dialog"
            aria-expanded={commandOpen}
          >
            <SearchIcon className="size-4 shrink-0 text-primary" />
            <span className="truncate">Search friends & locations</span>
          </Button>
        </div>
        <div className="hidden min-w-0 flex-1 items-center md:flex">
          <Button
            className="h-9 w-9 shrink-0 transition-colors aria-expanded:bg-accent aria-expanded:text-accent-foreground"
            variant="outline"
            onClick={toggleSidebar}
            aria-label={state === "expanded" ? "Close navigation" : "Open navigation"}
            aria-expanded={state === "expanded"}
            title={state === "expanded" ? "Close navigation" : "Open navigation"}
          >
            {state === "expanded" ? (
              <PanelLeftCloseIcon className="size-5" />
            ) : (
              <PanelRightCloseIcon className="size-5" />
            )}
          </Button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <SearchHelp />
            <Button
              className="h-9 w-170 justify-start font-normal text-muted-foreground hover:text-muted-foreground"
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen((open) => !open)}
              aria-haspopup="dialog"
              aria-expanded={commandOpen}
            >
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm">
                <SearchIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">
                  Search friends or locations...
                </span>
              </div>

              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">Ctrl/&#8984;</span>K
              </kbd>
            </Button>
          </div>
        </div>
        <FriendActivity />
      </nav>
    </>
  );
};