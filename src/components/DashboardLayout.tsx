import { useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun, Maximize, Minimize, Search, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import dataCentreBg from "@/assets/data-centre-bg.png";
import GlobalSearch from "@/components/GlobalSearch";
import ShortcutsHelp from "@/components/ShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Fullscreen listeners
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const shortcuts = useKeyboardShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onToggleDarkMode: () => setDark((d) => !d),
    onToggleSidebar: toggleSidebar,
    onOpenSearch: () => setSearchOpen(true),
    onRefreshData: refreshData,
  });

  // Handle Shift+? for shortcuts help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
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

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex-1 max-w-sm mx-2 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">Search pages, students...</span>
            <Badge variant="outline" className="text-[9px] font-mono ml-auto shrink-0">
              Ctrl+K
            </Badge>
          </button>

          <h2 className="font-sans text-xs font-medium text-muted-foreground truncate hidden lg:block flex-1">
            Kabejja V1.00
          </h2>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShortcutsOpen(true)}
              className="shrink-0 h-8 w-8"
              title="Keyboard shortcuts (Shift+?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="shrink-0 h-8 w-8"
              title={isFullscreen ? "Exit fullscreen (F11)" : "Fullscreen (F11)"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="shrink-0 h-8 w-8"
              title={dark ? "Light mode (Ctrl+Shift+D)" : "Dark mode (Ctrl+Shift+D)"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcuts} />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
