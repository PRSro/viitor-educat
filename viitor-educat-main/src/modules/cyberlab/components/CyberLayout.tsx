import React, { useEffect, useRef } from 'react';
import { Lock, Cpu, Server } from 'lucide-react';

export function CyberLayout({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix Rain with Japanese & Latin characters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to cover screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Characters array (Latin + Katakana + Numbers)
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const letters = (katakana + latin + nums).split('');
    
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -100)); // Start drops at varying heights above screen

    const draw = () => {
      // Small opacity to create trailing effect on the black background
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 255, 136, 0.5)'; // Brighter green for the rain
      ctx.font = `${fontSize}px "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Only draw if current drop is below 0
        if (drops[i] > 0) {
          const text = letters[Math.floor(Math.random() * letters.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="cyber-layout min-h-screen bg-[#050505] text-[#00ff88] relative overflow-hidden font-mono selection:bg-[#00ff88]/30 selection:text-white">
      {/* Background Rain Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full opacity-20 pointer-events-none z-0"
      />
      
      {/* CSS Scanlines Overlay */}
      <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-[0.15] mix-blend-overlay"></div>

      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 w-full bg-black/80 border-b border-[#00ff88]/30 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-[10px] sm:text-xs tracking-widest text-[#00ff88]/80 font-mono uppercase">
          <div className="flex items-center gap-3">
            <Lock className="w-3 h-3 text-[#00ff88]" />
            <span>SECURE CONNECTION ✓</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> TLS 1.3</span>
            <span className="flex items-center gap-2"><Server className="w-3 h-3" /> AES-256-GCM</span>
          </div>
        </div>
      </div>

      {/* Main Content Render */}
      <div className="relative z-10 pt-8 pb-12 min-h-screen">
        {children}
      </div>
    </div>
  );
}
