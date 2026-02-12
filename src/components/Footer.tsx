import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground py-10">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-xl font-bold mb-3">Nyunga Foundation</h3>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Empowering students across Uganda through bursaries and scholarships at every education level.
          </p>
          <p className="text-primary-foreground/60 text-sm italic mt-2">"Still there's Hope"</p>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><a href="/" className="hover:text-primary-foreground transition-colors">Home</a></li>
            <li><a href="/about" className="hover:text-primary-foreground transition-colors">About Us</a></li>
            <li><a href="/register" className="hover:text-primary-foreground transition-colors">Apply for Scholarship</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li>Kampala, Uganda</li>
            <li>info@nyungafoundation.org</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm text-primary-foreground/60 flex items-center justify-center gap-1">
        Made with <Heart size={14} className="text-secondary" /> for the children of Uganda &copy; {new Date().getFullYear()}
      </div>
    </div>
  </footer>
);

export default Footer;
