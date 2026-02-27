import { useEffect, useRef } from "react";
import { ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParallax } from "@/hooks/use-parallax";
import heroCampus from "@/assets/hero-campus.jpg";

const stats = [
  { icon: Award, value: "50+", label: "Ani de Excelență" },
  { icon: Users, value: "1200+", label: "Elevi" },
  { icon: BookOpen, value: "100%", label: "Promovabilitate" },
];

export const HeroSection = () => {
  const { registerElement, unregisterElement, isMobile } = useParallax();
  
  // Refs for parallax elements (only decorative, not the background image)
  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);
  const bubble4Ref = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  // NOTE: The isMobile dependency is critical here.
  // When viewport crosses 768px, useParallax's registerElement gets a new reference
  // (due to its [isMobile] useCallback dep). This causes this effect to re-run,
  // properly re-registering elements for the new viewport state.
  useEffect(() => {
    if (isMobile) return;
    
    // Floating bubbles - very subtle movement only (no rotation, no scale)
    registerElement(bubble1Ref.current, 0.15, 12, { depth: 1 });
    registerElement(bubble2Ref.current, 0.2, 15, { depth: 1 });
    registerElement(bubble3Ref.current, 0.18, 10, { depth: 0.8 });
    registerElement(bubble4Ref.current, 0.12, 18, { depth: 1.1 });
    
    // Glows - very subtle movement
    registerElement(glow1Ref.current, 0.03, 5, { depth: 0.3 });
    registerElement(glow2Ref.current, 0.02, 4, { depth: 0.4 });

    return () => {
      unregisterElement(bubble1Ref.current);
      unregisterElement(bubble2Ref.current);
      unregisterElement(bubble3Ref.current);
      unregisterElement(bubble4Ref.current);
      unregisterElement(glow1Ref.current);
      unregisterElement(glow2Ref.current);
    };
  }, [registerElement, unregisterElement, isMobile]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - NO parallax, stays fixed */}
      <div className="absolute inset-0 will-change-transform">
        <img
          src={heroCampus}
          alt="Campus Colegiul Național de Informatică Tudor Vianu"
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 hero-gradient opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      </div>

      {/* Floating Aero Bubbles */}
      <div 
        ref={bubble1Ref}
        className="absolute top-[15%] left-[8%] w-32 h-32 rounded-full bg-white/15 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
      >
        <div className="absolute top-[15%] left-[20%] w-[40%] h-[25%] bg-white/50 rounded-full blur-[3px] rotate-[-20deg]" />
      </div>
      
      <div 
        ref={bubble2Ref}
        className="absolute top-[25%] right-[12%] w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm animate-float pointer-events-none will-change-transform"
        style={{ animationDelay: '1s' }}
      >
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-25deg]" />
      </div>
      
      <div 
        ref={bubble3Ref}
        className="absolute bottom-[30%] left-[15%] w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm animate-float-delayed pointer-events-none will-change-transform"
      />
      
      <div 
        ref={bubble4Ref}
        className="absolute top-[40%] right-[5%] w-24 h-24 rounded-full bg-accent/20 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
        style={{ animationDelay: '2s' }}
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/40 rounded-full blur-[2px]" />
      </div>
      
      {/* Large Glow Effects */}
      <div 
        ref={glow1Ref}
        className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-accent/25 rounded-full blur-[150px] pointer-events-none will-change-transform"
      />
      <div 
        ref={glow2Ref}
        className="absolute bottom-1/4 right-10 w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[180px] pointer-events-none will-change-transform"
      />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 pattern-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white text-sm font-medium mb-8 animate-fade-up shadow-lg relative">
            <Award className="w-4 h-4 text-white" />
            <span>Colegiul #1 de Informatică din România</span>
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-display-lg md:text-display-xl hero-text mb-6 animate-fade-up-delay-1">
            Pregătim Viitorii
            <span className="block text-gradient text-glow">Lideri în Tehnologie</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl hero-text-muted max-w-2xl mb-10 leading-relaxed animate-fade-up-delay-2">
            La Colegiul Național de Informatică Tudor Vianu, transformăm pasiunea 
            pentru știință și tehnologie în cariere de succes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-16 animate-fade-up-delay-3">
            <Button 
              variant="hero" 
              size="lg" 
              className="group aero-button-accent"
            >
              Descoperă Programele
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="heroOutline" 
              size="lg"
              className="aero-button bg-white/15 hover:bg-white/25 text-foreground dark:text-white border-white/40 dark:border-white/40"
            >
              Vizitează Campusul
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="stat-card animate-fade-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <stat.icon className="w-6 h-6 text-white mb-3" />
                <div className="text-3xl font-bold text-white mb-1 text-glow-white">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
      
      {/* Wave Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30 pattern-waves pointer-events-none" />
    </section>
  );
};
