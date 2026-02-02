import { CheckCircle2, Sparkles, Target, Heart, Lightbulb } from "lucide-react";
import studentsLibrary from "@/assets/students-library.jpg";

const values = [
  {
    icon: Target,
    title: "Excelență Academică",
    description: "Standarde înalte și pregătire de top pentru competiții internaționale.",
  },
  {
    icon: Lightbulb,
    title: "Inovație",
    description: "Încurajăm gândirea creativă și soluțiile originale.",
  },
  {
    icon: Heart,
    title: "Comunitate",
    description: "O familie de elevi, profesori și absolvenți dedicați.",
  },
];

const highlights = [
  "Cel mai mare număr de medalii la olimpiadele internaționale",
  "Parteneriate cu Google, Microsoft și Amazon",
  "Absolvenți la MIT, Stanford, Oxford și Cambridge",
  "Laboratoare de ultimă generație pentru AI și robotică",
];

export const AboutSection = () => {
  return (
    <section id="despre" className="py-24 lg:py-32 section-gradient relative overflow-hidden">
      {/* Decorative Aero Bubbles */}
      <div className="absolute top-20 right-[10%] w-24 h-24 rounded-full bg-accent/15 blur-[2px] animate-float-slow">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-32 left-[8%] w-16 h-16 rounded-full bg-sky-400/15 blur-[1px] animate-float" 
           style={{ animationDelay: '1.5s' }}>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/40 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-1/2 right-[5%] w-20 h-20 rounded-full bg-teal-400/10 animate-float-delayed" />
      
      {/* Large Glow */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-sky-400/8 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Despre Noi
          </span>
          <h2 className="text-display-sm lg:text-display-md text-foreground mb-6">
            Unde Tradiția Întâlnește{" "}
            <span className="text-gradient">Viitorul</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Din 1969, Colegiul Național de Informatică Tudor Vianu este un far al 
            excelenței în educația românească, formând generații de lideri în tehnologie.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Image with Aero Glass Overlays */}
          <div className="relative">
            <div className="aero-glass p-2 rounded-3xl">
              <img
                src={studentsLibrary}
                alt="Elevi în biblioteca colegiului"
                className="w-full aspect-[4/3] object-cover rounded-2xl"
              />
            </div>
            
            {/* Floating Glass Cards */}
            <div className="absolute -top-6 -right-6 aero-glass p-4 animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center text-white relative overflow-hidden">
                  <span className="text-lg font-bold">50+</span>
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Ani de Excelență</div>
                  <div className="text-sm text-muted-foreground">Din 1969</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 aero-glass p-4 animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white relative overflow-hidden">
                  <span className="text-lg font-bold">#1</span>
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">În România</div>
                  <div className="text-sm text-muted-foreground">La Informatică</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
              Formăm Viitorii Inovatori
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Cu o istorie bogată și o viziune orientată spre viitor, oferim elevilor 
              noștri cele mai bune resurse și oportunități pentru a excela în domeniile 
              STEM. Programele noastre sunt concepute să inspire, să provoace și să 
              pregătească tinerii pentru succesul în era digitală.
            </p>

            {/* Highlights - Aero Cards */}
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 aero-glass p-3 hover-lift hover-glow cursor-default"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center shrink-0 mt-0.5 relative overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                  </div>
                  <span className="text-foreground font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values - Aero Glass Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="aero-glass p-8 text-center group hover-lift hover-glow cursor-default"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent/20 to-teal-500/20 flex items-center justify-center group-hover:from-accent group-hover:to-teal-500 transition-all duration-300 relative overflow-hidden">
                <value.icon className="w-8 h-8 text-accent group-hover:text-white transition-colors" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3">{value.title}</h4>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
