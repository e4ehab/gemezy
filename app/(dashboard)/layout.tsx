// app/(dashboard)/layout.tsx
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardNavbar } from "@/components/navbar/app-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <SidebarProvider className="min-h-dvh bg-background md:h-svh md:overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-dvh overflow-x-clip bg-background md:min-h-0 md:overflow-hidden md:bg-accent/20">
        <Suspense fallback={<div className="h-14 border-b border-sidebar-border bg-sidebar" aria-label="Loading navigation" />}>
          <DashboardNavbar />
        </Suspense>
        <div className="flex-1 pb-[env(safe-area-inset-bottom)] md:min-h-0 md:overflow-y-auto md:overscroll-y-contain md:pb-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;