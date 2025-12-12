import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
            <div className="flex items-center gap-4 h-14 px-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-3 md:hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-violet-indigo flex items-center justify-center">
                  <span className="text-xs font-bold text-white">GW</span>
                </div>
              </div>
              {title && (
                <h1 className="text-lg font-semibold" data-testid="text-page-title">
                  {title}
                </h1>
              )}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hidden sm:block">
                  {user?.role === "admin" ? "관리자" : "교사"}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      <MobileTabBar />
    </SidebarProvider>
  );
}
