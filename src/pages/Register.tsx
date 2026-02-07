import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, ArrowLeft, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { useParallax } from "@/hooks/use-parallax";
import { useAuth } from "@/contexts/AuthContext";
import { registerSchema, getFirstError } from "@/lib/validation";
import { sanitizeEmail, sanitizeInput } from "@/lib/sanitize";

const Register = () => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | ''>('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { registerElement, unregisterElement, isMobile } = useParallax();
  const { register, isLoading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const bubble1Ref = useRef<HTMLDivElement>(null);
  const bubble2Ref = useRef<HTMLDivElement>(null);
  const bubble3Ref = useRef<HTMLDivElement>(null);
  const bubble4Ref = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = 
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'TEACHER' ? '/teacher' : 
        '/student';
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isMobile) return;

    registerElement(bubble1Ref.current, 0.25, 22);
    registerElement(bubble2Ref.current, 0.35, 28);
    registerElement(bubble3Ref.current, 0.3, 15);
    registerElement(bubble4Ref.current, 0.4, 20);
    registerElement(glow1Ref.current, 0.08, 8);
    registerElement(glow2Ref.current, 0.06, 6);

    return () => {
      unregisterElement(bubble1Ref.current);
      unregisterElement(bubble2Ref.current);
      unregisterElement(bubble3Ref.current);
      unregisterElement(bubble4Ref.current);
      unregisterElement(glow1Ref.current);
      unregisterElement(glow2Ref.current);
    };
  }, [registerElement, unregisterElement, isMobile]);

  // Clear errors when inputs change
  useEffect(() => {
    if (error) clearError();
    setValidationError(null);
  }, [email, password, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizeInput(password, 128);
    
    // Client-side validation
    const formData = { email: sanitizedEmail, password: sanitizedPassword, role };
    const validationErr = getFirstError(registerSchema, formData);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }
    
    try {
      await register(sanitizedEmail, sanitizedPassword, role as 'STUDENT' | 'TEACHER');
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
        className="absolute top-[8%] right-[10%] w-36 h-36 rounded-full bg-white/15 backdrop-blur-sm animate-float-slow pointer-events-none will-change-transform"
      >
        <div className="absolute top-[15%] left-[20%] w-[40%] h-[25%] bg-white/50 rounded-full blur-[3px] rotate-[-20deg]" />
      </div>

      <div
        ref={bubble2Ref}
        className="absolute top-[25%] left-[5%] w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm animate-float pointer-events-none will-change-transform"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/40 rounded-full blur-[2px] rotate-[-25deg]" />
      </div>

      <div
        ref={bubble3Ref}
        className="absolute bottom-[20%] left-[12%] w-16 h-16 rounded-full bg-accent/20 backdrop-blur-sm animate-float-delayed pointer-events-none will-change-transform"
      />

      <div
        ref={bubble4Ref}
        className="absolute bottom-[25%] right-[8%] w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm animate-float pointer-events-none will-change-transform"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/40 rounded-full blur-[2px]" />
      </div>

      {/* Large Glow Effects */}
      <div
        ref={glow1Ref}
        className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] bg-accent/25 rounded-full blur-[200px] pointer-events-none will-change-transform"
      />
      <div
        ref={glow2Ref}
        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[180px] pointer-events-none will-change-transform"
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

      {/* Register Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="aero-panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-teal-400 mb-4 shadow-glow">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Înregistrare</h1>
            <p className="text-muted-foreground">Creează un cont nou</p>
          </div>

          {/* Error Message */}
          {(error || validationError) && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {validationError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground font-medium">
                Rol
              </Label>
              <Select 
                value={role} 
                onValueChange={(value: 'STUDENT' | 'TEACHER') => setRole(value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="role"
                  className="h-12 bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                >
                  <SelectValue placeholder="Selectează rolul" />
                </SelectTrigger>
                <SelectContent className="aero-panel border-0">
                  <SelectItem value="STUDENT" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-accent" />
                      <span>Student</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="TEACHER" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span>Profesor</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                placeholder="Alege o parolă"
                className="h-12 bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 aero-button-accent text-base font-semibold"
              disabled={isLoading || !email || !password || !role}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se înregistrează...
                </>
              ) : (
                'Înregistrare'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ai deja cont?{" "}
            <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Conectează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
