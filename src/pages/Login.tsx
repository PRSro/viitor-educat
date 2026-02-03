import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, ArrowLeft, Loader2 } from "lucide-react";
import { useParallax } from "@/hooks/use-parallax";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { registerElement, unregisterElement, isMobile } = useParallax();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isMobile) return;

    registerElement(bubble1Ref.current, 0.25, 20);
    registerElement(bubble2Ref.current, 0.35, 25);
    registerElement(bubble3Ref.current, 0.3, 18);
    registerElement(glow1Ref.current, 0.08, 8);
    registerElement(glow2Ref.current, 0.06, 6);

    return () => {
      unregisterElement(bubble1Ref.current);
      unregisterElement(bubble2Ref.current);
      unregisterElement(bubble3Ref.current);
      unregisterElement(glow1Ref.current);
      unregisterElement(glow2Ref.current);
    };
  }, [registerElement, unregisterElement, isMobile]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) clearError();
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

      {/* Floating Aero Bubbles */}
      <div
        ref={bubble1Ref}
        className="absolute top-[10%] left-[5%] w-40 h-40 rounded-full bg-white/15 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
      >
        <div className="absolute top-[15%] left-[20%] w-[40%] h-[25%] bg-white/50 rounded-full blur-[3px] rotate-[-20deg]" />
      </div>

      <div
        ref={bubble2Ref}
        className="absolute top-[20%] right-[8%] w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm animate-float pointer-events-none will-change-transform"
        style={{ animationDelay: "1s" }}
      >
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-25deg]" />
      </div>

      <div
        ref={bubble3Ref}
        className="absolute bottom-[15%] right-[15%] w-20 h-20 rounded-full bg-accent/20 backdrop-blur-sm animate-float-delayed pointer-events-none will-change-transform"
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/40 rounded-full blur-[2px]" />
      </div>

      {/* Large Glow Effects */}
      <div
        ref={glow1Ref}
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[180px] pointer-events-none will-change-transform"
      />
      <div
        ref={glow2Ref}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-400/25 rounded-full blur-[150px] pointer-events-none will-change-transform"
      />

      {/* Subtle Pattern */}
      <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Înapoi</span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="aero-panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-teal-400 mb-4 shadow-glow">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Autentificare</h1>
            <p className="text-muted-foreground">Conectează-te la contul tău</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@email.com"
                className="h-12 bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Parolă
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introdu parola"
                className="h-12 bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                disabled={isLoading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 aero-button-accent text-base font-semibold"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se conectează...
                </>
              ) : (
                'Conectare'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Nu ai cont?{" "}
            <Link to="/register" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
