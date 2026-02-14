import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Target, Eye, ArrowRight } from "lucide-react";

const About = () => (
  <div className="bg-background">
    {/* Header */}
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">About Nyunga Foundation</h1>
        <p className="text-primary-foreground/80 text-lg">"Still there's Hope" — empowering Uganda's youth through education since day one.</p>
      </div>
    </section>

    {/* Values */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Target, title: "Our Mission", desc: "To identify and sponsor academically bright but financially needy students across Uganda, from nursery to university level." },
            { icon: Eye, title: "Our Vision", desc: "A Uganda where no child is denied education due to poverty — where every learner has the chance to reach their full potential." },
            { icon: Heart, title: "Our Values", desc: "Transparency, compassion, and accountability guide everything we do. Every shilling is tracked and accounted for." },
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-lg p-8 text-center">
              <item.icon size={40} className="text-secondary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-primary mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* What we cover */}
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-primary text-center mb-10">What We Cover</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {["Tuition fees", "Scholastic materials", "School uniforms", "Boarding fees", "Examination fees", "Mentorship programs"].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-card border border-border rounded-lg p-4">
              <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
              <span className="text-foreground font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Application Process */}
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-primary text-center mb-10">Application Process</h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Submit a Bursary Request Online", desc: "Fill out the online request form from the comfort of your home." },
            { step: "2", title: "Await Review & Approval", desc: "Our team carefully reviews every request and contacts approved applicants." },
            { step: "3", title: "Visit Our Office", desc: "Approved applicants visit our office to complete application forms, pay the required fees, and sign lawyer forms and school-specific admission documents." },
            { step: "4", title: "Student Receives Support", desc: "Once everything is processed, the student begins receiving bursary support." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start bg-card border border-border rounded-lg p-5">
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-display text-lg font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-primary">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl font-bold text-primary mb-4">Ready to Apply?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Submit your bursary request online. If approved, you'll visit our office to complete the full application.</p>
        <Link to="/register">
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2">
            Apply Now <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </section>
  </div>
);

export default About;
