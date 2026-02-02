import { useEffect, useRef, useCallback, useMemo } from "react";

interface ParallaxValues {
  scrollY: number;
  mouseX: number;
  mouseY: number;
}

export const useParallax = () => {
  const valuesRef = useRef<ParallaxValues>({ scrollY: 0, mouseX: 0, mouseY: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const elementsRef = useRef<Map<HTMLElement, { scrollSpeed: number; mouseIntensity: number }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  
  // Check mobile once
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);

  const updateElements = useCallback(() => {
    elementsRef.current.forEach((config, element) => {
      if (!element.isConnected) {
        elementsRef.current.delete(element);
        return;
      }
      
      const { scrollSpeed, mouseIntensity } = config;
      const scrollOffset = valuesRef.current.scrollY * scrollSpeed;
      const mouseOffsetX = valuesRef.current.mouseX * mouseIntensity;
      const mouseOffsetY = valuesRef.current.mouseY * mouseIntensity;
      
      element.style.transform = `translate3d(${mouseOffsetX.toFixed(1)}px, ${(scrollOffset + mouseOffsetY).toFixed(1)}px, 0)`;
    });
  }, []);

  const animate = useCallback(() => {
    if (!isRunningRef.current) return;
    
    // Smooth mouse interpolation
    const smoothing = 0.08;
    valuesRef.current.mouseX += (targetMouseRef.current.x - valuesRef.current.mouseX) * smoothing;
    valuesRef.current.mouseY += (targetMouseRef.current.y - valuesRef.current.mouseY) * smoothing;
    
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
      targetMouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      isRunningRef.current = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, isMobile]);

  // Register element for parallax
  const registerElement = useCallback((
    element: HTMLElement | null,
    scrollSpeed: number = 0.3,
    mouseIntensity: number = 15
  ) => {
    if (!element || isMobile) return;
    elementsRef.current.set(element, { scrollSpeed, mouseIntensity });
  }, [isMobile]);

  // Unregister element
  const unregisterElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    elementsRef.current.delete(element);
  }, []);

  return { registerElement, unregisterElement, isMobile };
};