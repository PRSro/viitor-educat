import { useEffect, useRef, useCallback, useState } from "react";

interface ParallaxValues {
  scrollY: number;
  mouseX: number;
  mouseY: number;
  velocityY: number;
}

interface ParallaxElement {
  scrollSpeed: number;
  mouseIntensity: number;
  rotateSpeed?: number;
  scaleSpeed?: number;
  depth: number;
}

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
}

export const useParallax = () => {
  const valuesRef = useRef<ParallaxValues>({ scrollY: 0, mouseX: 0, mouseY: 0, velocityY: 0 });
  const lastScrollRef = useRef(0);
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const elementsRef = useRef<Map<HTMLElement, ParallaxElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsMobile(getIsMobile());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(debounceTimer);
    };
  }, []);

  const updateElements = useCallback(() => {
    elementsRef.current.forEach((config, element) => {
      if (!element.isConnected) {
        elementsRef.current.delete(element);
        return;
      }
      
      const { scrollSpeed, mouseIntensity, rotateSpeed = 0, scaleSpeed = 0, depth } = config;
      
      const baseScrollOffset = valuesRef.current.scrollY * scrollSpeed;
      const velocityOffset = valuesRef.current.velocityY * scrollSpeed * 0.5;
      
      const mouseOffsetX = valuesRef.current.mouseX * mouseIntensity * depth;
      const mouseOffsetY = valuesRef.current.mouseY * mouseIntensity * depth;
      
      const rotate = valuesRef.current.mouseX * (rotateSpeed || 5) * depth;
      const scale = 1 + valuesRef.current.mouseX * (scaleSpeed || 0.02) * depth + 
                    valuesRef.current.mouseY * (scaleSpeed || 0.01) * depth;
      
      element.style.transform = `translate3d(${mouseOffsetX.toFixed(2)}px, ${(baseScrollOffset + mouseOffsetY - velocityOffset).toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      element.style.willChange = 'transform';
    });
  }, []);

  const animate = useCallback(() => {
    if (!isRunningRef.current) return;
    
    const smoothing = 0.1;
    valuesRef.current.mouseX += (targetMouseRef.current.x - valuesRef.current.mouseX) * smoothing;
    valuesRef.current.mouseY += (targetMouseRef.current.y - valuesRef.current.mouseY) * smoothing;
    
    const velocity = valuesRef.current.scrollY - lastScrollRef.current;
    valuesRef.current.velocityY = valuesRef.current.velocityY * 0.9 + velocity * 0.1;
    lastScrollRef.current = valuesRef.current.scrollY;
    
    updateElements();
    rafRef.current = requestAnimationFrame(animate);
  }, [updateElements]);

  useEffect(() => {
    if (isMobile) return;
    
    isRunningRef.current = true;

    const handleScroll = () => {
      valuesRef.current.scrollY = window.scrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.documentElement.getBoundingClientRect();
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      targetMouseRef.current = { x, y };
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      isRunningRef.current = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, isMobile]);

  const registerElement = useCallback((
    element: HTMLElement | null,
    scrollSpeed: number = 0.3,
    mouseIntensity: number = 15,
    options?: { rotateSpeed?: number; scaleSpeed?: number; depth?: number }
  ) => {
    if (!element || isMobile) return;
    elementsRef.current.set(element, { 
      scrollSpeed, 
      mouseIntensity,
      rotateSpeed: options?.rotateSpeed,
      scaleSpeed: options?.scaleSpeed,
      depth: options?.depth ?? 1
    });
  }, [isMobile]);

  const unregisterElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    elementsRef.current.delete(element);
  }, []);

  return { registerElement, unregisterElement, isMobile };
};
