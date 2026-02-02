import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { name: "Despre Noi", href: "#despre" },
  { name: "Programe", href: "#programe" },
  { name: "Admitere", href: "#admitere" },
  { name: "Viața Școlară", href: "#viata" },
  { name: "Noutăți", href: "#noutati" },
  { name: "Contact", href: "#contact" },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/80 dark:bg-background/90 backdrop-blur-xl py-3 border-b border-border/50 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo - Aero Style */}
          <a href="#" className="flex items-center gap-3 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
              isScrolled 
                ? "bg-gradient-to-br from-accent to-teal-500 text-white shadow-lg shadow-accent/30" 
                : "bg-white/20 backdrop-blur-md text-white border border-white/30"
            } group-hover:scale-105 group-hover:shadow-glow`}>
              <Terminal className="w-6 h-6" />
              {/* Shine effect */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl" />
            </div>
            <div className={`hidden sm:block transition-colors duration-300 ${
              isScrolled ? "text-foreground" : "text-white"
            }`}>
              <span className="font-bold text-lg block leading-tight">Tudor Vianu</span>
              <span className={`text-xs ${isScrolled ? "text-muted-foreground" : "text-white/70"}`}>
                Colegiul Național de Informatică
              </span>
            </div>
          </a>

          {/* Desktop Navigation - Aero Pills */}
          <nav className={`hidden lg:flex items-center gap-1 p-1.5 rounded-2xl transition-all duration-300 ${
            isScrolled 
              ? "bg-muted/50 dark:bg-muted/30 border border-border/50" 
              : "bg-white/10 backdrop-blur-md border border-white/20"
          }`}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 relative ${
                  isScrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-accent/10 dark:hover:bg-accent/20"
                    : "text-white/80 hover:text-white hover:bg-white/20"
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle isScrolled={isScrolled} />
            <Button 
              className={`aero-button-accent ${!isScrolled && 'shadow-glow'}`}
              size="default"
              asChild
            >
              <Link to="/login">Înscrie-te Acum</Link>
            </Button>
          </div>

          {/* Mobile Theme Toggle & Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle isScrolled={isScrolled} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2.5 rounded-xl transition-all ${
                isScrolled 
                  ? "text-foreground hover:bg-accent/10" 
                  : "text-white hover:bg-white/20"
              } backdrop-blur-sm`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Aero Panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-background/95 dark:bg-background/98 backdrop-blur-xl rounded-2xl p-4 border border-border/50 shadow-lg animate-scale-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-foreground font-medium hover:bg-accent/10 dark:hover:bg-accent/20 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <Button className="aero-button-accent mt-4" size="lg" asChild>
                <Link to="/login">Înscrie-te Acum</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};