import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Shield, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/nyunga-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isSchool, signOut } = useAuth();

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Nyunga Foundation" className="h-12 w-auto" />
          <div className="hidden sm:block leading-tight">
            <span className="font-display text-lg font-bold text-primary block">Nyunga Foundation</span>
            <span className="text-xs text-muted-foreground italic">"Still there's Hope"</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors hover:text-secondary ${isActive(l.to) ? "text-secondary font-semibold" : "text-foreground"}`}>
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link to="/dashboard" className={`text-sm font-medium transition-colors hover:text-secondary flex items-center gap-1 ${isActive("/dashboard") ? "text-secondary" : "text-foreground"}`}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`text-sm font-medium transition-colors hover:text-secondary flex items-center gap-1 ${isActive("/admin") ? "text-secondary" : "text-foreground"}`}>
                  <Shield size={16} /> Admin
                </Link>
              )}
              {isSchool && (
                <Link to="/school" className={`text-sm font-medium transition-colors hover:text-secondary flex items-center gap-1 ${isActive("/school") ? "text-secondary" : "text-foreground"}`}>
                  <School size={16} /> School Portal
                </Link>
              )}
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setShowRequirements(true)}>Apply Now</Button>
              <Button size="sm" variant="ghost" onClick={signOut} className="gap-1 text-muted-foreground hover:text-foreground">
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setShowRequirements(true)}>Register Online</Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`block py-2 text-sm font-medium ${isActive(l.to) ? "text-secondary" : "text-foreground"}`}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">Dashboard</Link>
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">Admin</Link>}
              {isSchool && <Link to="/school" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">School Portal</Link>}
              <Button className="w-full bg-secondary text-secondary-foreground" onClick={() => { setShowRequirements(true); setOpen(false); }}>Apply Now</Button>
              <Button variant="ghost" onClick={() => { signOut(); setOpen(false); }} className="w-full justify-start gap-1">
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Button className="w-full bg-secondary text-secondary-foreground" onClick={() => { setShowRequirements(true); setOpen(false); }}>Register Online</Button>
            </>
          )}
        </div>
      )}

      <AlertDialog open={showRequirements} onOpenChange={setShowRequirements}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-display text-xl">
              📋 Prepare Your Documents
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-medium text-foreground">
                  Nyunga Foundation informs you to prepare these requirements as they will be essential throughout the registration process:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Passport-size photograph of the student</li>
                  <li>Student's birth certificate</li>
                  <li>National Identification Number (NIN) — if available</li>
                  <li>Parent/Guardian's National ID</li>
                  <li>Latest school report card</li>
                  <li>UNEB index number (for S.4 / S.6 leavers)</li>
                  <li>Admission letter (for university/vocational applicants)</li>
                  <li>Academic transcripts (for continuing students)</li>
                  <li>Proof of financial need (e.g. LC1 letter, pay slips)</li>
                  <li>Parent/Guardian contact details &amp; occupation info</li>
                  <li>A personal statement explaining why you need the scholarship</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => navigate("/register")}
            >
              Proceed to Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default Navbar;
