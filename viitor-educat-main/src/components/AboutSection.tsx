import { CheckCircle2, Sparkles, Target, Heart, Lightbulb, Shield, Terminal } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Hands-On Learning",
    description: "Learn by doing with real-world CTF challenges and security labs.",
  },
  {
    icon: Lightbulb,
    title: "Innovation First",
    description: "We encourage creative problem-solving and unconventional approaches.",
  },
  {
    icon: Heart,
    title: "Community Driven",
    description: "Join a global community of security researchers and learners.",
  },
];

const highlights = [
  "Learn ethical hacking and penetration testing techniques",
  "Practice with 500+ CTF challenges across multiple categories",
  "Get mentored by industry security professionals",
  "Earn certificates and build your security portfolio",
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 lg:py-32 bg-gradient-to-b from-background via-violet-950/20 to-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 right-[10%] w-24 h-24 rounded-full bg-violet-500/10 blur-[2px] animate-float-slow" />
      <div className="absolute bottom-32 left-[8%] w-16 h-16 rounded-full bg-violet-500/10 blur-[1px] animate-float" 
           style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-[5%] w-20 h-20 rounded-full bg-purple-500/10 animate-float-delayed" />
      
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            About Obscuron
          </span>
          <h2 className="text-display-sm lg:text-display-md mb-6">
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Passion</span> Meets
            Practice
          </h2>
          <p className="text-lg text-muted-foreground">
            Obscuron HQ is an interactive cybersecurity education platform designed to train the next generation of security professionals through hands-on challenges and expert-led courses.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Content with Icon Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="aero-glass p-6 rounded-2xl animate-float-slow">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4">
                  <Terminal className="w-7 h-7 text-white" />
                </div>
                <div className="font-bold text-2xl text-white mb-1">500+</div>
                <div className="text-sm text-white/60">CTF Challenges</div>
              </div>
              
              <div className="aero-glass p-6 rounded-2xl animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="font-bold text-2xl text-white mb-1">10K+</div>
                <div className="text-sm text-white/60">Active Learners</div>
              </div>
              
              <div className="aero-glass p-6 rounded-2xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="font-bold text-2xl text-white mb-1">50+</div>
                <div className="text-sm text-white/60">Expert Courses</div>
              </div>
              
              <div className="aero-glass p-6 rounded-2xl animate-float-slow" style={{ animationDelay: '1.5s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div className="font-bold text-2xl text-white mb-1">100%</div>
                <div className="text-sm text-white/60">Free Content</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-6">
              Learn Security by Breaking Things
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our platform is built on the principle that the best way to learn cybersecurity is by getting your hands dirty. We provide a safe environment to practice hacking techniques, analyze vulnerabilities, and master the art of ethical hacking.
            </p>

            {/* Highlights */}
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 aero-glass p-3 rounded-xl hover:bg-violet-500/5 transition-colors cursor-default"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="aero-glass p-8 text-center group hover:bg-violet-500/5 transition-colors cursor-default rounded-2xl"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-violet-500 group-hover:to-pink-500 transition-all duration-300">
                <value.icon className="w-8 h-8 text-violet-400 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-3">{value.title}</h4>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
