import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSchool: boolean;
  userRole: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSchool, setIsSchool] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data || []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsSchool(roles.includes("school"));
    // Set the primary role (first non-parent role, or fallback)
    const primaryRole = roles.find((r: string) => r !== "parent") || roles[0] || null;
    setUserRole(primaryRole);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // If token refresh failed, clear session gracefully instead of looping
      if (event === 'TOKEN_REFRESHED' && !session) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsSchool(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsSchool(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          if (mounted) checkRoles(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsSchool(false);
        setUserRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      // If session retrieval fails (e.g. 429), clear state and stop loading
      if (error || !session) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsSchool(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user);
      checkRoles(session.user.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto-logout after 15 minutes of inactivity
  useSessionTimeout(!!user);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsSchool(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isSchool, userRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
