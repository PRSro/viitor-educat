import { Music, Trophy, Globe, Palette, Microscope, Code2 } from "lucide-react";
import scienceLab from "@/assets/science-lab.jpg";

const activities = [
  { icon: Code2, name: "Cluburi de Informatică", membri: "120+" },
  { icon: Trophy, name: "Echipe Olimpiade", membri: "80+" },
  { icon: Globe, name: "Model ONU", membri: "60+" },
  { icon: Music, name: "Teatru", membri: "40+" },
  { icon: Microscope, name: "Club Știință", membri: "50+" },
  { icon: Palette, name: "Atelier Artă", membri: "25+" },
];

const achievements = [
  { number: "150+", label: "Medalii Internaționale" },
  { number: "25", label: "Campioni Naționali 2024" },
  { number: "95%", label: "Absolvenți la Universități de Top" },
];

export const StudentLifeSection = () => {
  return (
    <section id="viata" className="py-24 lg:py-32 relative overflow-hidden section-gradient">
      {/* Decorative Bubbles */}
      <div className="absolute top-[10%] right-[12%] w-24 h-24 rounded-full bg-accent/12 animate-float-slow">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-[20%] left-[8%] w-18 h-18 rounded-full bg-sky-400/12 animate-float" style={{ animationDelay: '1s' }}>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/40 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-[40%] left-[5%] w-14 h-14 rounded-full bg-teal-400/10 animate-float-delayed" />
      
      {/* Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-400/8 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <Music className="w-4 h-4" />
            Viața Școlară
          </span>
          <h2 className="text-display-sm lg:text-display-md text-foreground mb-6">
            Mai Mult Decât{" "}
            <span className="text-gradient">Educație</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            La Tudor Vianu, credem în dezvoltarea completă a elevilor. 
            Oferim oportunități diverse pentru explorare, creativitate și leadership.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Activities Grid - Aero Cards */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-8">
              Cluburi și Activități
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <div
                  key={activity.name}
                  className="group aero-glass p-5 flex items-center gap-4 hover-lift hover-glow cursor-default soft-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-teal-500/20 flex items-center justify-center group-hover:from-accent group-hover:to-teal-500 transition-all duration-300 relative overflow-hidden">
                    <activity.icon className="w-5 h-5 text-accent group-hover:text-white transition-colors" />
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{activity.name}</h4>
                    <p className="text-sm text-muted-foreground">{activity.membri} membri</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image - Aero Frame */}
          <div className="relative">
            <div className="aero-glass aero-glass-img p-2 rounded-3xl">
              <img
                src={scienceLab}
                alt="Elevi în laboratorul de științe"
                className="w-full aspect-[4/3] object-cover rounded-2xl"
              />
            </div>
            {/* Floating Achievement */}
            <div className="absolute -top-6 -left-6 aero-glass p-4 animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center relative overflow-hidden">
                  <Trophy className="w-5 h-5 text-white" />
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">Top 10</div>
                  <div className="text-xs text-muted-foreground">Licee din Europa</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Banner - Aero Glass Green */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-teal-500 to-sky-500" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />
          
          {/* Floating bubbles inside */}
          <div className="absolute top-6 right-12 w-20 h-20 rounded-full bg-white/10">
            <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-20deg]" />
          </div>
          <div className="absolute bottom-8 left-16 w-14 h-14 rounded-full bg-white/8">
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/30 rounded-full blur-[1px]" />
          </div>
          <div className="absolute top-1/2 right-[30%] w-10 h-10 rounded-full bg-white/6" />
          
          <div className="relative p-8 lg:p-12">
            <div className="text-center mb-10">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 text-glow-white">
                Realizările Noastre
              </h3>
              <p className="text-white/75">
                Rezultate care vorbesc de la sine despre excelența comunității Tudor Vianu.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {achievements.map((achievement) => (
                <div key={achievement.label} className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2 text-glow-white">
                    {achievement.number}
                  </div>
                  <div className="text-white/75">{achievement.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
