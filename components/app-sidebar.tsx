"use client";

import { useState } from "react";
import {
  BirdhouseIcon,
  BookmarkIcon,
  CirclePlusIcon,
  EllipsisIcon,
  LoaderCircleIcon,
  LogOutIcon,
  TelescopeIcon,
  UsersRoundIcon,
  ShieldBanIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "My Locations", icon: BirdhouseIcon, url: "/locations" },
  { title: "Explore", icon: TelescopeIcon, url: "/explore" },
  { title: "Collections", icon: BookmarkIcon, url: "/collections" },
  { title: "Friends", icon: UsersRoundIcon, url: "/friends" },
  { title: "Add New", icon: CirclePlusIcon, url: "/locations/new" },
];

function isPathActive(pathname: string, url: string) {
  if (pathname === url) return true;
  const coveredByMoreSpecificItem = menuItems.some(
    (item) =>
      item.url !== url &&
      item.url.startsWith(`${url}/`) &&
      (pathname === item.url || pathname.startsWith(`${item.url}/`)),
  );
  if (coveredByMoreSpecificItem) return false;
  return pathname.startsWith(`${url}/`);
}

const collapsedIconButton =
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:[&_svg]:size-5";

export const AppSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session } = authClient.useSession();
  const profileName = session?.user.name || "Profile";
  const profileInitial = profileName.charAt(0).toUpperCase();
  const isCollapsed = state === "collapsed";
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => router.replace("/login"),
          onError: () => setIsSigningOut(false),
        },
      });
    } catch {
      setIsSigningOut(false);
    }
  };

  const navButtonClass = cn(
    "h-12 rounded-xl px-3 text-lg font-medium text-sidebar-foreground/90 transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-6",
    "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground",
    collapsedIconButton,
    "group-data-[collapsible=icon]:text-sidebar-foreground/75",
    "group-data-[collapsible=icon]:hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:hover:text-sidebar-accent-foreground",
    "group-data-[collapsible=icon]:data-active:bg-sidebar-accent group-data-[collapsible=icon]:data-active:text-sidebar-accent-foreground",
    "group-data-[collapsible=icon]:data-active:ring-1 group-data-[collapsible=icon]:data-active:ring-sidebar-border",
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pb-3 pt-5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Gemezy"
              isActive={false}
              render={<Link href="/locations" prefetch />}
              onClick={closeMobileSidebar}
              className={cn(
                "h-14 rounded-xl px-3 text-sidebar-foreground hover:bg-sidebar-accent",
                collapsedIconButton,
                "group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-transparent group-data-[collapsible=icon]:shadow-none",
              )}
            >
              <Image
                src="/logos/logo.svg"
                alt="Gemezy"
                width={36}
                height={36}
                priority
                className="size-9 object-contain group-data-[collapsible=icon]:size-8!"
              />
              <span className="text-lg font-semibold group-data-[collapsible=icon]:sr-only">
                Gemezy
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div className="px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
        <div className="h-px w-full bg-sidebar-border group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8" />
      </div>

      <SidebarContent className="px-2 pt-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isPathActive(pathname, item.url)}
                    render={<Link href={item.url} prefetch />}
                    onClick={closeMobileSidebar}
                    className={navButtonClass}
                  >
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:sr-only">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-1.5 p-3 pb-[max(env(safe-area-inset-bottom),1rem)] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
        <div className="px-1 pb-1 group-data-[collapsible=icon]:px-0">
          <Separator className="bg-sidebar-border group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8" />
        </div>
        <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={profileName}
              isActive={isPathActive(pathname, "/profile")}
              render={<Link href="/profile" prefetch />}
              onClick={closeMobileSidebar}
              className={cn(
                navButtonClass,
                "group-data-[collapsible=icon]:rounded-full",
              )}
            >
              <Avatar className="size-7 border border-sidebar-border group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:border-0">
                <AvatarImage src={session?.user.image ?? undefined} alt="" />
                <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
                  {profileInitial}
                </AvatarFallback>
              </Avatar>
              <span className="group-data-[collapsible=icon]:sr-only">
                Profile & Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    tooltip="More"
                    className={navButtonClass}
                  />
                }
              >
                <EllipsisIcon />
                <span className="group-data-[collapsible=icon]:sr-only">
                  More
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "top" : isCollapsed ? "right" : "top"}
                align="end"
                sideOffset={isMobile ? 8 : isCollapsed ? 10 : 4}
                positionerClassName={isMobile ? "z-[60]" : undefined}
                className="w-56 border-border bg-popover text-popover-foreground"
              >
                <DropdownMenuItem
                  render={<Link href="/blocks" prefetch />}
                  onClick={closeMobileSidebar}
                  className="h-10 gap-3 text-base"
                >
                  <ShieldBanIcon className="size-5" />
                  Blocked users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ThemeSwitcher isMobile={isMobile} />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="h-10 gap-3 text-base"
                >
                  {isSigningOut ? (
                    <LoaderCircleIcon className="size-5 animate-spin" />
                  ) : (
                    <LogOutIcon className="size-5" />
                  )}
                  {isSigningOut ? "Signing out..." : "log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
