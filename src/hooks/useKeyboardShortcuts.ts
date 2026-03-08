import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  category: "Navigation" | "Actions" | "UI Controls" | "Data Operations";
  action: () => void;
}

export function useKeyboardShortcuts({
  onToggleFullscreen,
  onToggleDarkMode,
  onToggleSidebar,
  onOpenSearch,
  onRefreshData,
}: {
  onToggleFullscreen: () => void;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onRefreshData: () => void;
}) {
  const navigate = useNavigate();

  const shortcuts: ShortcutAction[] = [
    // Navigation (10)
    { key: "h", alt: true, label: "Go to Dashboard", category: "Navigation", action: () => navigate("/admin") },
    { key: "a", alt: true, label: "Go to Applications", category: "Navigation", action: () => navigate("/admin/applications") },
    { key: "s", alt: true, label: "Go to Students", category: "Navigation", action: () => navigate("/admin/students") },
    { key: "c", alt: true, label: "Go to Schools", category: "Navigation", action: () => navigate("/admin/schools") },
    { key: "p", alt: true, label: "Go to Payments", category: "Navigation", action: () => navigate("/admin/payment-history") },
    { key: "m", alt: true, label: "Go to Materials", category: "Navigation", action: () => navigate("/admin/materials") },
    { key: "t", alt: true, label: "Go to Accounting", category: "Navigation", action: () => navigate("/admin/accounting") },
    { key: "b", alt: true, label: "Go to Bursary Requests", category: "Navigation", action: () => navigate("/admin/bursary-requests") },
    { key: "i", alt: true, label: "Go to ID Cards", category: "Navigation", action: () => navigate("/admin/id-cards") },
    { key: "l", alt: true, label: "Go to Audit Logs", category: "Navigation", action: () => navigate("/admin/audit-logs") },

    // Actions (8)
    { key: "n", ctrl: true, shift: true, label: "New Application", category: "Actions", action: () => navigate("/register") },
    { key: "k", ctrl: true, label: "Search / Command", category: "Actions", action: () => onOpenSearch() },
    { key: "/", ctrl: false, label: "Quick Search", category: "Actions", action: () => onOpenSearch() },
    { key: "f", ctrl: true, shift: true, label: "Find Student", category: "Actions", action: () => navigate("/admin/student-search") },
    { key: "r", alt: true, label: "Go to Receipts", category: "Actions", action: () => navigate("/admin/receipts") },
    { key: "o", alt: true, label: "Go to Appointments", category: "Actions", action: () => navigate("/admin/appointments") },
    { key: "w", alt: true, label: "Go to Staff", category: "Actions", action: () => navigate("/admin/staff") },
    { key: "e", alt: true, label: "Go to Settings", category: "Actions", action: () => navigate("/admin/settings") },

    // UI Controls (7)
    { key: "F11", label: "Toggle Fullscreen", category: "UI Controls", action: onToggleFullscreen },
    { key: "f", ctrl: true, shift: false, alt: true, label: "Toggle Fullscreen", category: "UI Controls", action: onToggleFullscreen },
    { key: "d", ctrl: true, shift: true, label: "Toggle Dark Mode", category: "UI Controls", action: onToggleDarkMode },
    { key: "[", ctrl: true, label: "Toggle Sidebar", category: "UI Controls", action: onToggleSidebar },
    { key: "?", shift: true, label: "Show Shortcuts Help", category: "UI Controls", action: () => {} }, // handled separately
    { key: "Escape", label: "Close Dialog / Cancel", category: "UI Controls", action: () => {} },
    { key: "1", alt: true, label: "Go to Security", category: "UI Controls", action: () => navigate("/admin/security") },

    // Data Operations (5)
    { key: "r", ctrl: true, shift: true, label: "Refresh Data", category: "Data Operations", action: onRefreshData },
    { key: "e", ctrl: true, shift: true, label: "Export Page Data", category: "Data Operations", action: () => window.print() },
    { key: "g", alt: true, label: "Go to Payments Analytics", category: "Data Operations", action: () => navigate("/admin/payments-dashboard") },
    { key: "j", alt: true, label: "Go to Attendance", category: "Data Operations", action: () => navigate("/admin/attendance") },
    { key: "u", alt: true, label: "Go to Payment Codes", category: "Data Operations", action: () => navigate("/admin/payments") },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // Allow Ctrl+K and Escape in inputs
        if (!(e.key === "k" && (e.ctrlKey || e.metaKey)) && e.key !== "Escape") {
          return;
        }
      }

      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;

        // Special keys like F11, Escape, /
        const keyMatch = e.key === s.key || e.key.toLowerCase() === s.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
