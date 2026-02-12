import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Shield, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/nyunga-logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
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
              <Link to="/register">
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Apply Now</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={signOut} className="gap-1 text-muted-foreground hover:text-foreground">
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Register Online</Button>
              </Link>
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
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-secondary text-secondary-foreground">Apply Now</Button>
              </Link>
              <Button variant="ghost" onClick={() => { signOut(); setOpen(false); }} className="w-full justify-start gap-1">
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-secondary text-secondary-foreground">Register Online</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
