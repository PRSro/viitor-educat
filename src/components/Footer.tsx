import { Terminal, MapPin, Phone, Mail, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

const quickLinks = [
  { name: "Despre Noi", href: "#despre" },
  { name: "Programe", href: "#programe" },
  { name: "Admitere", href: "#admitere" },
  { name: "Viața Școlară", href: "#viata" },
  { name: "Noutăți", href: "/noutati" },
  { name: "Profesori", href: "/profesori" },
  { name: "Forum", href: "/forum" },
];

const resources = [
  { name: "Catalog Online", href: "#" },
  { name: "Bibliotecă Digitală", href: "#" },
  { name: "Platformă E-Learning", href: "#" },
  { name: "Calendar Academic", href: "#" },
  { name: "Consiliul Elevilor", href: "#" },
];

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export const Footer = () => {
  return (
    <footer id="contact" className="relative overflow-hidden">
      {/* Aero Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent via-teal-600 to-emerald-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Floating Bubbles */}
      <div className="absolute top-20 right-[15%] w-32 h-32 rounded-full bg-white/8">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/30 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-32 left-[10%] w-20 h-20 rounded-full bg-white/6">
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/25 rounded-full blur-[1px]" />
      </div>
      <div className="absolute top-1/2 right-[5%] w-16 h-16 rounded-full bg-white/5" />

      {/* Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Main Footer */}
        <div className="py-16 lg:py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative overflow-hidden group-hover:bg-white/30 transition-colors">
                <Terminal className="w-6 h-6 text-white" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
              </div>
              <div>
                <span className="font-bold text-lg block text-white">Tudor Vianu</span>
                <span className="text-sm text-white/65">Colegiul Național de Informatică</span>
              </div>
            </a>
            <p className="text-white/70 mb-6 leading-relaxed">
              Formăm liderii de mâine în tehnologie și știință din 1969.
            </p>
            {/* Social Links - Aero Buttons */}
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
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
            <h4 className="font-semibold text-lg mb-6 text-white">Navigare Rapidă</h4>
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
            <h4 className="font-semibold text-lg mb-6 text-white">Resurse</h4>
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
                  Strada Ion Mincu 10, Sector 1, București, România
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <a
                  href="tel:+40212223344"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  +40 21 222 33 44
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <a
                  href="mailto:contact@tudorvianu.ro"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  contact@tudorvianu.ro
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider - Glow line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/60">
          <p>© 2025 Colegiul Național de Informatică Tudor Vianu. Toate drepturile rezervate.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Politica de Confidențialitate</a>
            <a href="#" className="hover:text-white transition-colors">Termeni și Condiții</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
