import { useState, useEffect } from "react";
import { ArrowRight, Code2, Cpu, Database, Brain, Rocket, Shield, Globe, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

const clubs = [
  {
    icon: Code2,
    name: "InfoClub Vianu",
    schedule: "Joi, 16:00–18:00",
    description: "Pregătire pentru olimpiade și concursuri de informatică. Rezolvare probleme din arhiva InfoArena și Codeforces.",
    tags: ["Olimpiade", "C++", "Algoritmi"],
    color: "from-accent to-teal-500"
  },
  {
    icon: Brain,
    name: "AI Lab",
    schedule: "Marți, 15:00–17:00",
    description: "Experimente cu machine learning, antrenare modele, și proiecte de computer vision. Folosim Google Colab și Kaggle.",
    tags: ["Python", "TensorFlow", "Kaggle"],
    color: "from-sky-400 to-cyan-500"
  },
  {
    icon: Shield,
    name: "CyberSec Club",
    schedule: "Miercuri, 16:00–18:00",
    description: "Competiții CTF (Capture The Flag), ethical hacking în mediu controlat, și pregătire pentru RoCSC.",
    tags: ["CTF", "Kali Linux", "Networking"],
    color: "from-lime-400 to-green-500"
  },
  {
    icon: Globe,
    name: "Web Dev Society",
    schedule: "Luni, 15:30–17:30",
    description: "Proiecte web full-stack: React, Node.js, baze de date. Portofolii reale publicate pe GitHub.",
    tags: ["React", "Node.js", "Portfolio"],
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: Rocket,
    name: "Robotics Team",
    schedule: "Vineri, 14:00–17:00",
    description: "Construcție și programare roboți pentru competiții naționale și internaționale. Arduino, Raspberry Pi.",
    tags: ["Arduino", "Python", "Competiții"],
    color: "from-orange-400 to-red-500"
  },
  {
    icon: Users,
    name: "Student Council Tech",
    schedule: "Săptămânal",
    description: "Organizare evenimente tech, hackathoane interne, și conferințe cu invitați din industrie (Google, Bitdefender, UiPath).",
    tags: ["Hackathon", "Evenimente", "Networking"],
    color: "from-yellow-400 to-amber-500"
  },
];

export const ProgramsSection = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenDialog = () => setOpen(true);
    window.addEventListener('openProgramsDialog', handleOpenDialog);
    return () => window.removeEventListener('openProgramsDialog', handleOpenDialog);
  }, []);

  return (
    <>
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
            <Button onClick={() => setOpen(true)} className="aero-button group shrink-0 hover-glow text-foreground" size="lg">
              Vezi Toate Programele
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Programs Grid - Aero Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {programs.map((program) => (
              <div
                key={program.title}
                className="group aero-glass p-6 lg:p-8 hover-lift transition-all duration-300 hover:shadow-glow soft-shadow"
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
            <div className="aero-glass aero-glass-img p-3 rounded-3xl">
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
                    <Button className="aero-button bg-white/20 hover:bg-white/30 text-foreground dark:text-white border-white/30 dark:border-white/30" size="lg">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto aero-glass">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Toate Programele — CNI Tudor Vianu
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Colegiul Național de Informatică Tudor Vianu, București · fondată 1969
            </p>
          </DialogHeader>
          <Tabs defaultValue="materii">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="materii">📚 Materii</TabsTrigger>
              <TabsTrigger value="specializari">🎯 Specializări</TabsTrigger>
              <TabsTrigger value="cluburi">🏆 Cluburi</TabsTrigger>
            </TabsList>

            {/* Tab 1: Materii */}
            <TabsContent value="materii" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Trunchi comun */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Trunchi comun (toți elevii)</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Limba și literatura română",
                      "Limba modernă 1 (Engleză)",
                      "Limba modernă 2 (Franceză / Germană)",
                      "Matematică",
                      "Fizică",
                      "Chimie",
                      "Biologie",
                      "Istorie",
                      "Geografie",
                      "Filozofie (clasa a XII-a)",
                      "Economie (clasa a XI-a)",
                      "Educație fizică",
                      "Religie / Educație alternativă",
                      "Dirigenție"
                    ].map((subject) => (
                      <span key={subject} className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Profil Intensiv Informatică */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Profil Intensiv Informatică</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Informatică (C++)", olympiad: true },
                      { name: "Matematică aprofundată" },
                      { name: "Logică matematică și teoria mulțimilor" },
                      { name: "TIC" },
                      { name: "Arhitectura calculatoarelor (opțional)", olympiad: true },
                      { name: "Pregătire pentru olimpiade", olympiad: true }
                    ].map((subject) => (
                      <span key={subject.name} className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${subject.olympiad ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-accent/20 text-accent dark:text-accent'}`}>
                        {subject.olympiad && <Trophy className="w-3 h-3" />}
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Specializări */}
            <TabsContent value="specializari" className="space-y-4 mt-4">
              {/* Specializare 1 */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">1. Informatică Intensiv — Profil Principal</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Limbaje studiate:</strong> C++, Pascal (inițiere), Python, Java (opțional)</p>
                  <p><strong>Materii distinctive:</strong> Algoritmică avansată, Teoria grafurilor, Geometrie computațională, Combinatorică</p>
                  <p><strong>Olimpiade pregătite:</strong> ONI, Balcaniadă, IOI</p>
                  <p><strong>Absolvenți notabili:</strong> studenți acceptați la MIT, ETH Zurich, Politehnica București</p>
                  <p><strong>Admitere:</strong> medie generală min. 9.50 + probă de informatică</p>
                </div>
              </div>

              {/* Specializare 2 */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-sky-500" />
                  <h3 className="font-semibold">2. Inteligență Artificială — Specializare (cls. XI-XII)</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Conținut:</strong> Rețele neuronale, Computer Vision cu OpenCV, NLP, TensorFlow/PyTorch</p>
                  <p><strong>Proiecte finale:</strong> aplicații reale prezentate la târguri de proiecte</p>
                  <p><strong>Cerință intrare:</strong> Informatică Intensiv + medie 9.00 la informatică</p>
                </div>
              </div>

              {/* Specializare 3 */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-teal-500" />
                  <h3 className="font-semibold">3. Statistician de Date — Specializare</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Conținut:</strong> Python pentru date (Pandas, NumPy, Matplotlib), SQL, Power BI, statistică aplicată</p>
                  <p><strong>Certificări:</strong> pregătire pentru Google Data Analytics Certificate</p>
                  <p><strong>Proiecte:</strong> analiză date reale din competiții Kaggle</p>
                </div>
              </div>

              {/* Specializare 4 */}
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-lime-500" />
                  <h3 className="font-semibold">4. Securitate Cibernetică și Pentest — Specializare</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Conținut:</strong> Ethical hacking (Kali Linux, Metasploit), Criptografie aplicată, CTF</p>
                  <p><strong>Competiții:</strong> RoCSC, picoCTF</p>
                  <p><strong>Laborator dedicat:</strong> rețea izolată pentru exerciții de penetration testing</p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Cluburi */}
            <TabsContent value="cluburi" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                {clubs.map((club) => (
                  <div key={club.name} className="p-4 rounded-xl border bg-card">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${club.color} flex items-center justify-center shrink-0`}>
                        <club.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{club.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{club.schedule}</p>
                        <p className="text-sm text-muted-foreground mb-3">{club.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {club.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
