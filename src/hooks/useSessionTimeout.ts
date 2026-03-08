import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const useSessionTimeout = (isAuthenticated: boolean) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isAuthenticated) return;
    
    timerRef.current = setTimeout(async () => {
      toast.warning("Session expired due to inactivity. Please sign in again.");
      await supabase.auth.signOut();
      window.location.href = "/auth";
    }, TIMEOUT_MS);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    const handler = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, resetTimer]);
};
