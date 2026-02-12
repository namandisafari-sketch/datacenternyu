import { Link } from "react-router-dom";
import { GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-students.jpg";

const stats = [
  { icon: GraduationCap, value: "500+", label: "Scholarships Awarded" },
  { icon: Users, value: "1,200+", label: "Students Supported" },
  { icon: BookOpen, value: "50+", label: "Partner Schools" },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Students in classroom" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-gradient)", opacity: 0.85 }} />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl animate-fade-in-up">
            <p className="text-gold font-semibold tracking-wide uppercase text-sm mb-4">Nyunga Foundation</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Still There's <span className="text-gold">Hope</span>
            </h1>
            <p className="text-primary-foreground/90 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Transforming lives in Uganda through education. We provide bursaries and scholarships to students at every level — because every child deserves a chance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-base px-8 gap-2">
                  Apply for Scholarship <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center p-8 rounded-lg bg-muted/50 animate-count-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <stat.icon size={40} className="text-secondary mb-4" />
                <span className="font-display text-4xl font-bold text-primary">{stat.value}</span>
                <span className="text-muted-foreground mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            The Nyunga Foundation is dedicated to identifying and supporting bright but financially disadvantaged students 
            across Uganda. We cover tuition fees, scholastic materials, and essential needs — ensuring no child is left behind 
            due to poverty.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2">
              Register Your Child <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Register Online", desc: "Parents or guardians fill out the simple online application form." },
              { step: "2", title: "Review & Approval", desc: "Our team reviews applications and selects deserving candidates." },
              { step: "3", title: "Receive Support", desc: "Approved students get bursaries covering tuition and scholastic materials." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-display text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
