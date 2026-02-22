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

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
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
          : isDark 
            ? "text-white/80 hover:bg-white/20" 
            : "text-white hover:bg-white/20"
      }`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
