import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  enableMouseParallax?: boolean;
}

export function ParallaxLayer({ 
  children, 
  speed = 0.5, 
  className,
  enableMouseParallax = false 
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enableMouseParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setOffset(x * y * speed * 20);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [speed, enableMouseParallax]);

  return (
    <div
      ref={layerRef}
      className={cn('parallax-layer transition-transform duration-100 ease-out', className)}
      style={{ 
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
}

interface ParallaxBackgroundProps {
  children: ReactNode;
  className?: string;
  particleCount?: number;
}

export function ParallaxBackground({ 
  children, 
  className,
  particleCount = 20 
}: ParallaxBackgroundProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Gradient orbs for parallax effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-parallax-slow opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(165 70% 60% / 0.3) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute top-1/4 right-1/4 w-96 h-96 animate-parallax-medium opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(180 70% 55% / 0.4) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-0 left-1/3 w-[800px] h-[400px] animate-parallax-slow opacity-25"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(160 60% 45% / 0.3) 0%, transparent 60%)',
          }}
        />
      </div>
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: 'hsl(165 60% 60% / 0.6)',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            boxShadow: '0 0 10px hsl(165 70% 60% / 0.4)',
          }}
        />
      ))}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'green' | 'dark';
}

export function GlassCard({ 
  children, 
  className,
  variant = 'default' 
}: GlassCardProps) {
  const variantClasses = {
    default: 'aero-glass',
    green: 'aero-glass-green',
    dark: 'aero-glass dark:aero-glass',
  };

  return (
    <div className={cn('aero-glass', variantClasses[variant], className)}>
      {children}
    </div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  floatSpeed?: 'slow' | 'medium' | 'fast';
}

export function FloatingElement({ 
  children, 
  className,
  floatSpeed = 'medium' 
}: FloatingElementProps) {
  const animationClass = {
    slow: 'animate-float-slow',
    medium: 'animate-float',
    fast: 'animate-parallax-fast',
  }[floatSpeed];

  return (
    <div className={cn(animationClass, className)}>
      {children}
    </div>
  );
}

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  backgroundVariant?: 'gradient' | 'bubbles' | 'grid' | 'waves';
}

export function ParallaxSection({ 
  children, 
  className,
  backgroundVariant = 'gradient'
}: ParallaxSectionProps) {
  const bgClasses = {
    gradient: 'section-gradient',
    bubbles: 'pattern-waves',
    grid: 'pattern-grid',
    waves: 'pattern-waves',
  };

  return (
    <section className={cn('relative py-20', bgClasses[backgroundVariant], className)}>
      <ParallaxBackground>
        {children}
      </ParallaxBackground>
    </section>
  );
}

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function GlowButton({ 
  children, 
  onClick,
  className,
  variant = 'primary',
  disabled = false 
}: GlowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative px-8 py-4 rounded-xl font-semibold transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variant === 'primary' 
          ? 'aero-button-accent text-white' 
          : 'aero-button text-foreground',
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-xl animate-glow-pulse opacity-50" />
      )}
    </button>
  );
}

interface GlassInputProps {
  className?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GlassInput({
  className,
  placeholder,
  type = 'text',
  value,
  onChange,
}: GlassInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn('aero-input w-full px-4 py-3 outline-none', className)}
    />
  );
}

export default {
  ParallaxLayer,
  ParallaxBackground,
  GlassCard,
  FloatingElement,
  ParallaxSection,
  GlowButton,
  GlassInput,
};
