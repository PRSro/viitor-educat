import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  isScrolled?: boolean;
}

export const ThemeToggle = ({ isScrolled = false }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const currentTheme = theme || resolvedTheme || 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-xl ${isScrolled ? "text-foreground" : "text-white"}`}
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`rounded-xl transition-all ${
        isScrolled
          ? "text-foreground hover:bg-accent/10"
          : theme === "dark"
            ? "text-white/80 hover:bg-white/20" 
            : "text-white hover:bg-white/20"
      }`}
      aria-label={`Toggle theme (Current: ${theme || resolvedTheme})`}
      title={`Toggle theme (Current: ${theme || resolvedTheme})`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme (Current: {theme || resolvedTheme})</span>
    </Button>
  );
};
