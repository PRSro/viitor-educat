import { Calendar, FileText, CheckCircle2, ArrowRight, Clock, Users, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParallax } from "@/hooks/use-parallax";
import { useEffect, useRef } from "react";

const steps = [
  {
    step: "01",
    title: "Online Registration",
    description: "Complete the enrollment form on our platform.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Required Documents",
    description: "Upload the requested documents and transcripts.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Assessment",
    description: "Complete our technical evaluation and interview.",
    icon: Clock,
  },
  {
    step: "04",
    title: "Confirmation",
    description: "Receive your acceptance and confirm your spot at Obscuron.",
    icon: CheckCircle2,
  },
];

const requirements = [
  "Strong foundation in mathematics and logic",
  "Problem-solving abilities",
  "Interest in cybersecurity or computer science",
  "Motivation letter",
];

export const AdmissionsSection = () => {
  const { registerElement, unregisterElement, isMobile } = useParallax();
  
  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);
  const bubble4Ref = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    
    registerElement(bubble1Ref.current, 0.2, 12, { depth: 1 });
    registerElement(bubble2Ref.current, 0.25, 15, { depth: 1 });
    registerElement(bubble3Ref.current, 0.22, 10, { depth: 0.9 });
    registerElement(bubble4Ref.current, 0.15, 8, { depth: 1.1 });
    registerElement(glow1Ref.current, 0.08, 5, { depth: 0.5 });
    registerElement(glow2Ref.current, 0.1, 4, { depth: 0.4 });

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
    <section id="admissions" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-950 dark:via-background dark:to-background" />
      <div className="absolute inset-0 pattern-grid opacity-15 dark:opacity-10" />
      
      <div 
        ref={bubble1Ref}
        className="absolute top-[15%] left-[10%] w-28 h-28 rounded-full bg-white/10 dark:bg-white/5 animate-float-slow will-change-transform"
      >
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div 
        ref={bubble2Ref}
        className="absolute top-[40%] right-[8%] w-20 h-20 rounded-full bg-white/8 dark:bg-white/5 animate-float will-change-transform" 
        style={{ animationDelay: '1.5s' }}
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/30 dark:bg-white/20 blur-[1px]" />
      </div>
      <div 
        ref={bubble3Ref}
        className="absolute bottom-[25%] left-[5%] w-16 h-16 rounded-full bg-white/8 dark:bg-white/5 animate-float-delayed will-change-transform" 
      />
      <div 
        ref={bubble4Ref}
        className="absolute bottom-[35%] right-[15%] w-12 h-12 rounded-full bg-white/6 dark:bg-white/4 animate-float-slow will-change-transform" 
        style={{ animationDelay: '2s' }} 
      />
      
      <div 
        ref={glow1Ref}
        className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-white/10 dark:bg-white/5 rounded-full blur-[150px] will-change-transform" 
      />
      <div 
        ref={glow2Ref}
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/15 dark:bg-accent/10 rounded-full blur-[120px] will-change-transform" 
      />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 text-white dark:text-white/90 text-sm font-medium mb-6 relative overflow-hidden">
            <Users className="w-4 h-4" />
            Enroll Now
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
          </span>
          <h2 className="text-display-sm lg:text-display-md text-white dark:text-white mb-6 text-glow-white">
            Begin Your Journey to{" "}
            <span className="text-gradient">Excellence</span>
          </h2>
          <p className="text-lg text-white/75 dark:text-white/70">
            Our admissions process is transparent and accessible. 
            Follow the steps below to secure your spot at Obscuron HQ.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-white/30 to-transparent dark:from-white/20 to-transparent z-0" />
              )}
              
              <div className="relative bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/25 dark:border-white/10 rounded-2xl p-6 hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 group-hover:shadow-glow overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-2xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/25 to-white/10 dark:from-white/15 dark:to-white/5 flex items-center justify-center group-hover:from-accent group-hover:to-teal-500 transition-all duration-300 relative overflow-hidden">
                      <step.icon className="w-6 h-6 text-white" />
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                    </div>
                    <span className="text-3xl font-bold text-white/25 dark:text-white/30 group-hover:text-white/40 transition-colors duration-300">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/65 dark:text-white/60">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="aero-panel bg-white/95 dark:bg-card/95 p-8 lg:p-10">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Admission Requirements
            </h3>
            <ul className="space-y-4 mb-8">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center shrink-0 mt-0.5 relative overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                  </div>
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Button className="aero-button-accent group" size="lg">
                Apply Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button className="aero-button" size="lg">
                Download Guide
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/25 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl" />
              <div className="relative">
                <h4 className="font-semibold text-lg text-white dark:text-white mb-3">Important Dates</h4>
                <ul className="space-y-2 text-white/75 dark:text-white/70">
                  <li>• <strong className="text-white dark:text-white">March 1:</strong> Online registration opens</li>
                  <li>• <strong className="text-white dark:text-white">April 30:</strong> Registration deadline</li>
                  <li>• <strong className="text-white dark:text-white">June 15:</strong> Technical assessment</li>
                  <li>• <strong className="text-white dark:text-white">July 1:</strong> Results announcement</li>
                </ul>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent/30 to-teal-500/30 dark:from-accent/20 dark:to-teal-500/20 backdrop-blur-md border border-white/25 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 dark:bg-white/5">
                <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/30 dark:bg-white/20 rounded-full blur-[1px]" />
              </div>
              <div className="relative">
                <h4 className="font-semibold text-lg text-white dark:text-white mb-3">Pro Tip</h4>
                <p className="text-white/75 dark:text-white/70">
                  Participation in programming competitions and CTF events can 
                  significantly boost your application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
