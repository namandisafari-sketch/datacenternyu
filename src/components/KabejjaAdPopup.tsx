import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import kabejjaLogo from "@/assets/kabejja-logo.png";

const KabejjaAdPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show on every fresh page load after a short delay
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center text-center p-8 space-y-5">
          {/* Logo */}
          <img
            src={kabejjaLogo}
            alt="Kabejja Systems"
            className="h-24 w-24 rounded-xl object-contain"
          />

          {/* Title */}
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold tracking-wide text-foreground">
              KABEJJA SYSTEMS
            </h3>
            <p className="text-sm text-muted-foreground">Business Management Systems</p>
          </div>

          {/* Message */}
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-foreground leading-relaxed">
            This system is developed &amp; protected by{" "}
            <strong className="text-primary">Kabejja Systems</strong>. For quality custom
            systems development, get in touch today.
          </div>

          {/* Contact info */}
          <div className="space-y-2 w-full">
            <a
              href="tel:+256745368426"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 px-4 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              📞 Call +256 745 368 426
            </a>
            <a
              href="https://www.kabejjasystems.store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-3 px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              🌐 Visit www.kabejjasystems.store
            </a>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default KabejjaAdPopup;
