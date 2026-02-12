import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/nyunga-logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/register", label: "Apply Now" },
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
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-secondary ${
                isActive(l.to) ? "text-secondary font-semibold" : "text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/register">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
              Register Online
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2 text-sm font-medium ${
                isActive(l.to) ? "text-secondary" : "text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/register" onClick={() => setOpen(false)}>
            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Register Online
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
