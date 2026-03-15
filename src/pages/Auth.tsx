import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Fingerprint, Mail, ShieldAlert, Loader2 } from "lucide-react";
import dataCentreBg from "@/assets/data-centre-bg.png";
import { generateDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { supabase } from "@/integrations/supabase/client";
import { loginWithPasskey, isWebAuthnSupported } from "@/lib/webauthn";

const logAccess = async (params: {
  email: string;
  user_id?: string;
  success: boolean;
  failure_reason?: string;
  device_fingerprint: string;
}): Promise<{ device_trusted: boolean } | null> => {
  try {
    const { data } = await supabase.functions.invoke("log-access", { body: params });
    return data as { device_trusted: boolean };
  } catch {
    return null;
  }
};

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"passkey" | "email">("passkey");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", fullName: "" });
  const [deviceBlocked, setDeviceBlocked] = useState(false);

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const handlePasskeyLogin = async () => {
    if (!isWebAuthnSupported()) {
      toast.error("Passkeys are not supported on this device. Please use email sign-in.");
      setAuthMethod("email");
      return;
    }

    if (isInIframe) {
      toast.error("Passkey sign-in is blocked in preview mode. Please use the published URL or email sign-in.");
      setAuthMethod("email");
      return;
    }

    setLoading(true);
    sessionStorage.setItem("device_check_pending", "1");
    try {
      // Trigger fingerprint prompt — browser shows stored passkeys for this domain
      const result = await loginWithPasskey();

      // Send credential to backend to identify user and get login link
      const { data, error } = await supabase.functions.invoke("passkey-login", {
        body: { credential_id: result.credentialId },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Passkey login failed");
      }

      if (!data?.action_link) {
        throw new Error("No login session returned");
      }

      // Extract the token from the magic link and verify it
      const url = new URL(data.action_link);
      const token_hash = url.searchParams.get("token") || url.hash?.split("token=")[1]?.split("&")[0];
      const type = url.searchParams.get("type") || "magiclink";

      // Verify the OTP/magic link token to get a real session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token_hash || "",
        type: type as any,
      });

      if (verifyError) {
        throw new Error("Failed to establish session: " + verifyError.message);
      }

      // Check device trust
      const fingerprint = await generateDeviceFingerprint();
      const trustResult = await logAccess({
        email: data.email || "",
        user_id: data.user_id,
        success: true,
        device_fingerprint: fingerprint,
      });

      sessionStorage.removeItem("device_check_pending");

      if (trustResult && !trustResult.device_trusted) {
        await supabase.auth.signOut();
        setDeviceBlocked(true);
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      navigate("/admin");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Fingerprint verification cancelled");
      } else {
        toast.error(err.message || "Passkey login failed");
      }
    } finally {
      sessionStorage.removeItem("device_check_pending");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(loginForm.email, loginForm.password, loginForm.fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! You can now sign in.");
      setIsSignUp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDeviceBlocked(false);

    // Block auto-redirect while we check device trust
    sessionStorage.setItem("device_check_pending", "1");

    const fingerprint = await generateDeviceFingerprint();
    const { error, data } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      sessionStorage.removeItem("device_check_pending");
      await logAccess({
        email: loginForm.email,
        success: false,
        failure_reason: error.message,
        device_fingerprint: fingerprint,
      });
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Log successful access and check device trust
    const userId = data?.user?.id;
    const result = await logAccess({
      email: loginForm.email,
      user_id: userId,
      success: true,
      device_fingerprint: fingerprint,
    });

    sessionStorage.removeItem("device_check_pending");

    if (result && !(result as any)?.device_trusted) {
      // Untrusted device — sign out immediately
      await supabase.auth.signOut();
      setDeviceBlocked(true);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success("Welcome back!");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/30 relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url(${dataCentreBg})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "clamp(280px, 50%, 500px)",
        }}
      />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <img src={dataCentreBg} alt="Kabejja Logo" className="w-20 h-20 object-contain mx-auto mb-2" />
          <CardTitle className="font-display text-2xl">Kabejja V1.00</CardTitle>
          <CardDescription>Data Management System</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceBlocked ? (
            <div className="text-center space-y-4 py-4">
              <ShieldAlert className="mx-auto text-destructive" size={48} />
              <h3 className="font-semibold text-lg text-destructive">Unrecognized Device</h3>
              <p className="text-sm text-muted-foreground">
                This device is not authorized to access the system. Contact your administrator to approve this device.
              </p>
              <Button variant="outline" onClick={() => setDeviceBlocked(false)} className="w-full">
                Try Again
              </Button>
            </div>
          ) : authMethod === "passkey" ? (
            <div className="space-y-4">
              <Button
                onClick={handlePasskeyLogin}
                disabled={loading}
                className="w-full h-14 bg-primary text-primary-foreground text-base gap-3"
                size="lg"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Fingerprint size={24} />
                )}
                {loading ? "Verifying..." : "Sign in with Passkey"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setAuthMethod("email")}
                className="w-full gap-2"
              >
                <Mail size={16} />
                Use Email &amp; Password
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" type="text" required value={loginForm.fullName} onChange={(e) => setLoginForm((p) => ({ ...p, fullName: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginForm.email} onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" required minLength={6} value={loginForm.password} onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
                  {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
                </Button>
              </form>
              <div className="mt-4 text-center space-y-2">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline">
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
                <button onClick={() => setAuthMethod("passkey")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
                  <Fingerprint size={14} /> Use Passkey instead
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
