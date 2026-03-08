import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Fingerprint, Mail } from "lucide-react";
import dataCentreBg from "@/assets/data-centre-bg.png";
import FakeErrorPage from "@/components/FakeErrorPage";

const Auth = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [authMethod, setAuthMethod] = useState<"passkey" | "email">("passkey");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handlePasskeyLogin = async () => {
    if (!window.PublicKeyCredential) {
      toast.error("Passkeys are not supported on this device. Please use email sign-in.");
      setAuthMethod("email");
      return;
    }
    toast.info("Passkey authentication requires additional backend setup. Using email sign-in for now.");
    setAuthMethod("email");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  if (!unlocked) {
    return <FakeErrorPage onUnlock={() => setUnlocked(true)} />;
  }

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
          {authMethod === "passkey" ? (
            <div className="space-y-4">
              <Button
                onClick={handlePasskeyLogin}
                className="w-full h-14 bg-primary text-primary-foreground text-base gap-3"
                size="lg"
              >
                <Fingerprint size={24} />
                Sign in with Passkey
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginForm.email} onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" required value={loginForm.password} onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-4 text-center">
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
