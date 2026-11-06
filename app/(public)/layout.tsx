import { Suspense, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardNavbar } from "@/components/navbar/app-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden bg-accent/20">
        <Suspense
          fallback={
            <div
              className="h-14 border-b border-sidebar-border bg-sidebar"
              aria-label="Loading navigation"
            />
          }
        >
          <DashboardNavbar />
        </Suspense>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}