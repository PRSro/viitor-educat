import { useEffect, useRef } from "react";
import { ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParallax } from "@/hooks/use-parallax";

const stats = [
  { icon: Award, value: "500+", label: "CTF Challenges" },
  { icon: Users, value: "10K+", label: "Active Learners" },
  { icon: BookOpen, value: "50+", label: "Courses" },
];

export const HeroSection = () => {
  const { registerElement, unregisterElement, isMobile } = useParallax();
  
  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);
  const bubble4Ref = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    
    registerElement(bubble1Ref.current, 0.15, 12, { depth: 1 });
    registerElement(bubble2Ref.current, 0.2, 15, { depth: 1 });
    registerElement(bubble3Ref.current, 0.18, 10, { depth: 0.8 });
    registerElement(bubble4Ref.current, 0.12, 18, { depth: 1.1 });
    
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
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-background to-background">
        <div className="absolute inset-0 pattern-grid opacity-10" />
      </div>

      {/* Floating Aero Bubbles */}
      <div 
        ref={bubble1Ref}
        className="absolute top-[15%] left-[8%] w-32 h-32 rounded-full bg-violet-500/10 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
      >
        <div className="absolute top-[15%] left-[20%] w-[40%] h-[25%] bg-violet-400/30 rounded-full blur-[3px] rotate-[-20deg]" />
      </div>
      
      <div 
        ref={bubble2Ref}
        className="absolute top-[25%] right-[12%] w-20 h-20 rounded-full bg-purple-500/10 backdrop-blur-sm animate-float pointer-events-none will-change-transform"
        style={{ animationDelay: '1s' }}
      >
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-purple-400/30 rounded-full blur-[2px] rotate-[-25deg]" />
      </div>
      
      <div 
        ref={bubble3Ref}
        className="absolute bottom-[30%] left-[15%] w-16 h-16 rounded-full bg-violet-400/10 backdrop-blur-sm animate-float-delayed pointer-events-none will-change-transform"
      />
      
      <div 
        ref={bubble4Ref}
        className="absolute top-[40%] right-[5%] w-24 h-24 rounded-full bg-violet-500/10 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
        style={{ animationDelay: '2s' }}
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-violet-400/30 rounded-full blur-[2px]" />
      </div>
      
      {/* Large Glow Effects */}
      <div 
        ref={glow1Ref}
        className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none will-change-transform"
      />
      <div 
        ref={glow2Ref}
        className="absolute bottom-1/4 right-10 w-[600px] h-[600px] bg-violet-500/15 rounded-full blur-[180px] pointer-events-none will-change-transform"
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500/20 backdrop-blur-md border border-violet-500/40 text-violet-300 text-sm font-medium mb-8 animate-fade-up shadow-lg relative">
            <Award className="w-4 h-4 text-violet-400" />
            <span>Learn Cybersecurity Through CTF Challenges</span>
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-display-lg md:text-display-xl mb-6 animate-fade-up-delay-1">
            Master the Art of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">Cybersecurity</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-fade-up-delay-2">
            Join Obscuron HQ and learn ethical hacking, web security, and computer science through hands-on challenges and interactive lessons.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-16 animate-fade-up-delay-3">
            <Button 
              variant="hero" 
              size="lg" 
              className="group bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
              onClick={() => {
                window.location.href = '/student/cyberlab_challenges';
              }}
            >
              Start CyberLab
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="heroOutline" 
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-foreground dark:text-white border-white/30"
              onClick={() => {
                const programsSection = document.getElementById('programs');
                if (programsSection) {
                  programsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Explore Courses
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="stat-card animate-fade-up backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <stat.icon className="w-6 h-6 text-violet-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </section>
  );
};
