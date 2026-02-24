import { Calendar, ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const news = [
  {
    category: "Olimpiade",
    icon: Award,
    date: "15 Ianuarie 2025",
    title: "5 Medalii de Aur la Olimpiada Internațională de Informatică",
    description: "Elevii noștri au obținut rezultate extraordinare la competiția din Japonia, aducând 5 medalii de aur pentru România.",
    featured: true,
  },
  {
    category: "Evenimente",
    icon: Users,
    date: "10 Ianuarie 2025",
    title: "Ziua Porților Deschise - Ediția de Primăvară",
    description: "Vino să descoperi campusul nostru și să întâlnești profesorii în data de 25 Februarie.",
    featured: false,
  },
  {
    category: "Academice",
    icon: BookOpen,
    date: "5 Ianuarie 2025",
    title: "Parteneriat cu Google pentru Laboratoare AI",
    description: "Colegiul nostru devine centru de excelență pentru inteligența artificială.",
    featured: false,
  },
];

export const NewsSection = () => {
  return (
    <section id="noutati" className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Decorative Bubbles */}
      <div className="absolute top-32 right-20 w-24 h-24 rounded-full bg-accent/10 animate-float-slow">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-20 left-[25%] w-16 h-16 rounded-full bg-sky-400/10 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/40 rounded-full blur-[1px]" />
      </div>
      
      {/* Glows */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-400/8 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
              <Calendar className="w-4 h-4" />
              Noutăți & Evenimente
            </span>
            <h2 className="text-display-sm lg:text-display-md text-foreground">
              Ce Se Întâmplă la{" "}
              <span className="text-gradient">Tudor Vianu</span>
            </h2>
          </div>
          <Button asChild className="aero-button group shrink-0 hover-glow" size="lg">
            <Link to="/noutati">
              Vezi Toate Noutățile
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* News Grid - Aero Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <article
              key={item.title}
              className={`group aero-glass overflow-hidden transition-all duration-300 hover-lift hover-glow soft-shadow
                ${item.featured ? "lg:col-span-2 lg:row-span-1" : ""}`}
            >
              <div className={`p-6 lg:p-8 h-full flex flex-col ${
                item.featured ? "lg:flex-row lg:items-center lg:gap-8" : ""
              }`}>
                {/* Icon Badge - Aero Bubble */}
                <div className={`mb-4 ${item.featured ? "lg:mb-0" : ""}`}>
                  <div className={`rounded-2xl flex items-center justify-center transition-all duration-300
                    bg-gradient-to-br from-accent/20 to-teal-500/20 group-hover:from-accent group-hover:to-teal-500
                    relative overflow-hidden
                    ${item.featured ? "w-20 h-20 lg:w-24 lg:h-24" : "w-16 h-16"}`}
                  >
                    <item.icon className={`text-accent group-hover:text-white transition-colors
                      ${item.featured ? "w-10 h-10" : "w-7 h-7"}`} 
                    />
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                
                <div className="flex-1">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full backdrop-blur-sm border border-accent/20">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {item.date}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`font-bold text-foreground mb-3 group-hover:text-accent transition-colors ${
                    item.featured ? "text-xl lg:text-2xl" : "text-lg"
                  }`}>
                    {item.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  
                  {/* Read More */}
                  <a 
                    href="#" 
                    className="inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all"
                  >
                    Citește mai mult
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
