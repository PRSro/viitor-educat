import { ArrowRight, Code2, Cpu, Database, Brain, Rocket, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import informaticsClass from "@/assets/informatics-class.jpg";

const programs = [
  {
    icon: Code2,
    title: "Informatică Intensiv",
    level: "Profil Principal",
    description: "Programul nostru de elită pentru viitorii ingineri software și cercetători în computer science.",
    features: ["Algoritmica avansată", "Pregătire olimpiade", "Proiecte practice", "Probleme de informatică"],
    color: "from-accent to-teal-500",
  },
  {
    icon: Brain,
    title: "Inginer de Inteligență Artificială",
    level: "Specializare",
    description: "Explorează machine learning, rețele neuronale și aplicații AI de ultimă generație.",
    features: ["Machine Learning", "Deep Learning", "Computer Vision", "AI"],
    color: "from-sky-400 to-cyan-500",
  },
  {
    icon: Database,
    title: "Statiscian de date",
    level: "Specializare",
    description: "Analizează date complexe și creează vizualizări care transformă informația în insight.",
    features: ["Big Data", "Statistică", "Vizualizare Date", "AI"],
    color: "from-teal-400 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Analist de securitate cibernetică și pentest.",
    level: "Specializare",
    description: "Protejează sistemele digitale și învață tehnici avansate de securitate informatică.",
    features: ["Ethical Hacking", "Criptografie", "Securitate Rețele", "Forensics"],
    color: "from-lime-400 to-green-500",
  },
];

export const ProgramsSection = () => {
  return (
    <section id="programe" className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Decorative Aero Elements */}
      <div className="absolute top-32 left-[5%] w-28 h-28 rounded-full bg-accent/12 animate-float-slow">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-40 right-[8%] w-20 h-20 rounded-full bg-sky-400/12 animate-float" style={{ animationDelay: '2s' }}>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/35 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-1/3 right-[15%] w-14 h-14 rounded-full bg-teal-400/10 animate-float-delayed" />
      
      {/* Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-400/8 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
              <Rocket className="w-4 h-4" />
              Programe de Studiu
            </span>
            <h2 className="text-display-sm lg:text-display-md text-foreground mb-4">
              Pregătire pentru{" "}
              <span className="text-gradient">Era Digitală</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Curriculum modern, actualizat constant pentru a reflecta cele mai 
              noi tendințe și tehnologii din industria IT:
              Algoritmică Avansată,
              Inteligență Artificială,
              și Securitate Cibernetică.
            </p>
          </div>
          <Button className="aero-button group shrink-0 hover-glow" size="lg">
            Vezi Toate Programele
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Programs Grid - Aero Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {programs.map((program) => (
            <div
              key={program.title}
              className="group aero-glass p-6 lg:p-8 hover-lift transition-all duration-300 hover:shadow-glow"
            >
              <div className="flex items-start gap-5">
                {/* Aero Bubble Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center shrink-0 relative overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <program.icon className="w-8 h-8 text-white" />
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold backdrop-blur-sm border border-accent/20">
                      {program.level}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {program.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-lg bg-muted/80 text-muted-foreground text-xs font-medium backdrop-blur-sm border border-border/50"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Image - Aero Frame */}
        <div className="relative">
          <div className="aero-glass p-3 rounded-3xl">
            <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl">
              <img
                src={informaticsClass}
                alt="Clasă de informatică"
                className="w-full h-64 lg:h-80 object-cover"
              />
              <div className="bg-gradient-to-br from-accent to-teal-500 p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                {/* Shine effect */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                
                {/* Decorative bubbles */}
                <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10">
                  <div className="absolute top-[15%] left-[20%] w-[35%] h-[20%] bg-white/30 rounded-full blur-[1px]" />
                </div>
                <div className="absolute bottom-12 right-20 w-10 h-10 rounded-full bg-white/10" />
                
                <div className="relative">
                  <Cpu className="w-12 h-12 text-white/90 mb-4" />
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                    Laboratoare de Ultimă Generație
                  </h3>
                  <p className="text-white/80 mb-6">
                    Investim constant în echipamente și software pentru a oferi 
                    elevilor experiențe de învățare la standarde internaționale.
                  </p>
                  <Button className="aero-button bg-white/20 hover:bg-white/30 text-white border-white/30" size="lg">
                    Fă un Tur Virtual
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating stat */}
          <div className="absolute -top-4 -right-4 aero-glass p-4 animate-float-slow">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">200+</div>
              <div className="text-xs text-muted-foreground">Calculatoare</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
