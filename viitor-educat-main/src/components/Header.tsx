import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Programs", href: "#programs" },
  { name: "CyberLab", href: "/student/cyberlab_challenges", isRoute: true },
  { name: "Courses", href: "#courses" },
  { name: "Community", href: "/forum", isRoute: true },
  { name: "Instructors", href: "/instructors", isRoute: true },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (isHomePage) {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/' + href);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-white/80 dark:bg-black/40 backdrop-blur-md py-3 border-b border-border/40 shadow-sm"
        : "bg-transparent py-5"
        }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${isScrolled
              ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30"
              : "bg-white/20 backdrop-blur-md text-white border border-white/30"
              } group-hover:scale-105 group-hover:shadow-glow`}>
              <Terminal className="w-6 h-6" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl" />
            </div>
            <div className={`hidden sm:block transition-colors duration-300 ${isScrolled ? "text-foreground" : "text-white"
              }`}>
              <span className="font-bold text-lg block leading-tight">Obscuron</span>
              <span className={`text-xs ${isScrolled ? "text-muted-foreground" : "text-white/70"}`}>
                HQ
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden lg:flex items-center gap-1 p-1.5 rounded-2xl transition-all duration-300 ${isScrolled
            ? "bg-muted/50 dark:bg-muted/30 border border-border/50"
            : "bg-white/10 backdrop-blur-md border border-white/20"
            }`}>
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${isScrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-violet-500/10 dark:hover:bg-violet-500/20"
                    : "text-white/80 hover:text-white hover:bg-white/20"
                    }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${isScrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-violet-500/10 dark:hover:bg-violet-500/20"
                    : "text-white/80 hover:text-white hover:bg-white/20"
                    }`}
                >
                  {link.name}
                </a>
              )
            ))}
          </nav>

          {/* CTA Button & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle isScrolled={isScrolled} />
            <Button
              className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 ${!isScrolled && 'shadow-glow'}`}
              size="default"
              asChild
            >
              <Link to="/login">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Theme Toggle & Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle isScrolled={isScrolled} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2.5 rounded-xl transition-all ${isScrolled
                ? "text-foreground hover:bg-violet-500/10"
                : "text-white hover:bg-white/20"
                } backdrop-blur-sm`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-background/95 dark:bg-background/98 backdrop-blur-xl rounded-2xl p-4 border border-border/50 shadow-lg animate-scale-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-foreground font-medium hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-colors"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      handleNavClick(e, link.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl text-foreground font-medium hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-colors"
                  >
                    {link.name}
                  </a>
                )
              ))}
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg mt-4" size="lg" asChild>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
