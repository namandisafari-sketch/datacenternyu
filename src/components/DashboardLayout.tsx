import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import dataCentreBg from "@/assets/data-centre-bg.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        {/* Background watermark */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url(${dataCentreBg})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "40%",
          }}
        />
        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-[1] min-w-0">
          <header className="h-14 border-b border-border flex items-center px-3 sm:px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10 gap-2">
            <SidebarTrigger className="shrink-0" />
            <h2 className="font-sans text-xs sm:text-sm font-medium text-muted-foreground truncate flex-1">
              Kabejja V1.00 — Data Management System
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="shrink-0 h-8 w-8"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
