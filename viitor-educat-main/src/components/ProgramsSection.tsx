import { useState, useEffect } from "react";
import { ArrowRight, Code2, Cpu, Database, Brain, Rocket, Shield, Globe, Users, Trophy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import informaticsClass from "@/assets/informatics-class.jpg";

const programs = [
  {
    icon: Code2,
    title: "Intensive Computer Science",
    level: "Core Track",
    description: "Our elite program for future software engineers and computer science researchers.",
    features: ["Advanced Algorithms", "Competition Prep", "Hands-on Projects", "Problem Solving"],
    color: "from-accent to-teal-500",
  },
  {
    icon: Brain,
    title: "AI Engineering",
    level: "Specialization",
    description: "Explore machine learning, neural networks, and cutting-edge AI applications.",
    features: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP"],
    color: "from-sky-400 to-cyan-500",
  },
  {
    icon: Database,
    title: "Data Science",
    level: "Specialization",
    description: "Analyze complex data and create visualizations that transform information into insights.",
    features: ["Big Data", "Statistics", "Data Visualization", "AI"],
    color: "from-cyan-400 to-teal-500",
  },
  {
    icon: Shield,
    title: "Cybersecurity Analyst",
    level: "Specialization",
    description: "Protect digital systems and learn advanced information security techniques.",
    features: ["Ethical Hacking", "Cryptography", "Network Security", "Forensics"],
    color: "from-violet-400 to-purple-500",
  },
];

const clubs = [
  {
    icon: Terminal,
    name: "CyberSec Club",
    schedule: "Wed, 16:00–18:00",
    description: "CTF competitions, ethical hacking in controlled environments, and RoCSC preparation.",
    tags: ["CTF", "Kali Linux", "Networking"],
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Brain,
    name: "AI Lab",
    schedule: "Tue, 15:00–17:00",
    description: "Machine learning experiments, model training, and computer vision projects. Using Google Colab and Kaggle.",
    tags: ["Python", "TensorFlow", "Kaggle"],
    color: "from-sky-400 to-cyan-500"
  },
  {
    icon: Code2,
    name: "Code Warriors",
    schedule: "Thu, 16:00–18:00",
    description: "Algorithm training and competitive programming. Solving problems from InfoArena and Codeforces.",
    tags: ["C++", "Algorithms", "Contests"],
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: Globe,
    name: "Web Dev Society",
    schedule: "Mon, 15:30–17:30",
    description: "Full-stack web projects: React, Node.js, databases. Real portfolios published on GitHub.",
    tags: ["React", "Node.js", "Portfolio"],
    color: "from-yellow-400 to-amber-500"
  },
  {
    icon: Rocket,
    name: "Robotics Team",
    schedule: "Fri, 14:00–17:00",
    description: "Building and programming robots for national and international competitions. Arduino, Raspberry Pi.",
    tags: ["Arduino", "Python", "Competitions"],
    color: "from-orange-400 to-red-500"
  },
  {
    icon: Users,
    name: "Tech Council",
    schedule: "Weekly",
    description: "Organizing tech events, hackathons, and conferences with industry guests (Google, Bitdefender, UiPath).",
    tags: ["Hackathon", "Events", "Networking"],
    color: "from-violet-400 to-purple-500"
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
      <section id="programs" className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="absolute top-32 left-[5%] w-28 h-28 rounded-full bg-accent/12 animate-float-slow">
          <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-20deg]" />
        </div>
        <div className="absolute bottom-40 right-[8%] w-20 h-20 rounded-full bg-sky-400/12 animate-float" style={{ animationDelay: '2s' }}>
          <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/35 rounded-full blur-[1px]" />
        </div>
        <div className="absolute top-1/3 right-[15%] w-14 h-14 rounded-full bg-teal-400/10 animate-float-delayed" />
        
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-400/8 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
                <Rocket className="w-4 h-4" />
                Learning Programs
              </span>
              <h2 className="text-display-sm lg:text-display-md text-foreground mb-4">
                Prepare for the{" "}
                <span className="text-gradient">Digital Age</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Modern curriculum, constantly updated to reflect the latest trends and technologies 
                in the tech industry: Advanced Algorithms, Artificial Intelligence, and Cybersecurity.
              </p>
            </div>
            <Button onClick={() => setOpen(true)} className="aero-button group shrink-0 hover-glow text-foreground" size="lg">
              View All Programs
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {programs.map((program) => (
              <div
                key={program.title}
                className="group aero-glass p-6 lg:p-8 hover-lift transition-all duration-300 hover:shadow-glow soft-shadow"
              >
                <div className="flex items-start gap-5">
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

          <div className="relative">
            <div className="aero-glass aero-glass-img p-3 rounded-3xl">
              <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl">
                <img
                  src={informaticsClass}
                  alt="Modern computer lab"
                  className="w-full h-64 lg:h-80 object-cover"
                />
                <div className="bg-gradient-to-br from-accent to-teal-500 p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                  
                  <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10">
                    <div className="absolute top-[15%] left-[20%] w-[35%] h-[20%] bg-white/30 rounded-full blur-[1px]" />
                  </div>
                  <div className="absolute bottom-12 right-20 w-10 h-10 rounded-full bg-white/10" />
                  
                  <div className="relative">
                    <Cpu className="w-12 h-12 text-white/90 mb-4" />
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                      State-of-the-Art Labs
                    </h3>
                    <p className="text-white/80 mb-6">
                      We constantly invest in equipment and software to provide 
                      students with international-standard learning experiences.
                    </p>
                    <Button className="aero-button bg-white/20 hover:bg-white/30 text-foreground dark:text-white border-white/30 dark:border-white/30" size="lg">
                      Take a Virtual Tour
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4 aero-glass p-4 animate-float-slow">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">200+</div>
                <div className="text-xs text-muted-foreground">Workstations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto aero-glass">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              All Programs — Obscuron HQ
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Cybersecurity and Computer Science Education · Founded 2024
            </p>
          </DialogHeader>
          <Tabs defaultValue="subjects">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="subjects">Core Subjects</TabsTrigger>
              <TabsTrigger value="specializations">Specializations</TabsTrigger>
              <TabsTrigger value="clubs">Clubs</TabsTrigger>
            </TabsList>

            <TabsContent value="subjects" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Core Curriculum</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Computer Science",
                      "Mathematics",
                      "Physics",
                      "English",
                      "Physical Education",
                      "Cybersecurity Fundamentals",
                      "Technical Writing"
                    ].map((subject) => (
                      <span key={subject} className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Computer Science Track</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Programming (C++, Python)", olympiad: true },
                      { name: "Advanced Mathematics" },
                      { name: "Data Structures & Algorithms" },
                      { name: "Computer Architecture" },
                      { name: "Competition Prep", olympiad: true }
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

            <TabsContent value="specializations" className="space-y-4 mt-4">
              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">1. Intensive Computer Science — Core Track</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Languages:</strong> C++, Python, Java</p>
                  <p><strong>Key Topics:</strong> Advanced Algorithms, Graph Theory, Computational Geometry, Combinatorics</p>
                  <p><strong>Competitions:</strong> IOI, ICPC, national contests</p>
                  <p><strong>Notable Graduates:</strong> Accepted to MIT, ETH Zurich, Stanford</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-sky-500" />
                  <h3 className="font-semibold">2. AI Engineering — Specialization</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Content:</strong> Neural networks, Computer Vision with OpenCV, NLP, TensorFlow/PyTorch</p>
                  <p><strong>Final Projects:</strong> Real applications presented at project fairs</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-teal-500" />
                  <h3 className="font-semibold">3. Data Science — Specialization</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Content:</strong> Python for data (Pandas, NumPy, Matplotlib), SQL, Power BI, Applied Statistics</p>
                  <p><strong>Certifications:</strong> Google Data Analytics Certificate preparation</p>
                  <p><strong>Projects:</strong> Real data analysis from Kaggle competitions</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-lime-500" />
                  <h3 className="font-semibold">4. Cybersecurity Analyst — Specialization</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Content:</strong> Ethical hacking (Kali Linux, Metasploit), Applied Cryptography, CTF</p>
                  <p><strong>Competitions:</strong> RoCSC, picoCTF</p>
                  <p><strong>Lab:</strong> Isolated network for penetration testing exercises</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clubs" className="mt-4">
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
