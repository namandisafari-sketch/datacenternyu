import { Shield } from "lucide-react";
import kabejjaLogo from "@/assets/kabejja-logo.png";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground py-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary-foreground/20 flex items-center justify-center">
            <span className="font-display text-sm font-bold">GW</span>
          </div>
          <span className="font-display text-lg font-bold">God's Will</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-primary-foreground/60">
          <Shield size={14} />
          <span>Scholarship Management System &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-primary-foreground/50">
        <img src={kabejjaLogo} alt="Kabejja Systems" className="h-8 w-8 rounded object-contain" />
        <span className="text-center">
          This system developed &amp; protected by <strong className="text-primary-foreground/70">Kabejja Systems</strong>. For quality custom systems development contact{" "}
          <a href="tel:+256745368426" className="text-primary-foreground/70 underline">+256745368426</a> or visit{" "}
          <a href="https://www.kabejjasystems.store" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 underline">www.kabejjasystems.store</a>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
