import { Terminal, MapPin, Mail, Github, Twitter, Linkedin } from "lucide-react";

const quickLinks = [
  { name: "About", href: "#about" },
  { name: "Programs", href: "#programs" },
  { name: "CyberLab", href: "/student/cyberlab_challenges" },
  { name: "Courses", href: "#courses" },
  { name: "Community", href: "/forum" },
  { name: "Instructors", href: "/instructors" },
];

const resources = [
  { name: "Learning Paths", href: "#" },
  { name: "Documentation", href: "#" },
  { name: "CTF Archives", href: "#" },
  { name: "Security Blog", href: "#" },
  { name: "Code of Conduct", href: "#" },
];

const socials = [
  { icon: Github, href: "https://github.com/obscuronhq", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/obscuronhq", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/obscuronhq", label: "LinkedIn" },
];

export const Footer = () => {
  return (
    <footer id="contact" className="relative overflow-hidden">
      {/* Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 to-background" />
      <div className="absolute inset-0 bg-white/5 dark:bg-black/5" />

      {/* Floating Elements */}
      <div className="absolute top-20 right-[15%] w-32 h-32 rounded-full bg-white/8">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/30 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-32 left-[10%] w-20 h-20 rounded-full bg-white/6">
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/25 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-1/2 right-[5%] w-16 h-16 rounded-full bg-white/5" />

      {/* Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Main Footer */}
        <div className="py-16 lg:py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative overflow-hidden group-hover:bg-white/30 transition-colors">
                <Terminal className="w-6 h-6 text-white" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
              </div>
              <div>
                <span className="font-bold text-lg block text-white">Obscuron</span>
                <span className="text-sm text-white/65">HQ</span>
              </div>
            </a>
            <p className="text-white/70 mb-6 leading-relaxed">
              Empowering the next generation of cybersecurity professionals through hands-on education and CTF challenges.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 relative overflow-hidden group"
                >
                  <social.icon className="w-5 h-5 text-white" />
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Resources</h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/70">
                  Global (Online Platform)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <a
                  href="mailto:contact@obscuron.io"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  contact@obscuron.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider - Glow line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/60">
          <p>© 2025 Obscuron HQ. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
