import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Frutiger Aero Green Palette
        mint: {
          DEFAULT: "hsl(var(--mint))",
          light: "hsl(var(--mint-light))",
          glow: "hsl(var(--mint-glow))",
        },
        lime: {
          DEFAULT: "hsl(var(--lime))",
          light: "hsl(var(--lime-light))",
        },
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          glow: "hsl(var(--emerald-glow))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          light: "hsl(var(--teal-light))",
        },
        sky: {
          DEFAULT: "hsl(var(--sky))",
          light: "hsl(var(--sky-light))",
          deep: "hsl(var(--sky-deep))",
        },
        aqua: {
          DEFAULT: "hsl(var(--aqua))",
          glow: "hsl(var(--aqua-glow))",
        },
        sunshine: {
          DEFAULT: "hsl(var(--sunshine))",
          glow: "hsl(var(--sunshine-glow))",
        },
        cloud: "hsl(var(--cloud))",
        pearl: "hsl(var(--pearl))",
        ivory: "hsl(var(--ivory))",
        slate: "hsl(var(--slate))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["2rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(165 70% 55% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(165 70% 55% / 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        // Parallax keyframes
        "parallax-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-30px)" },
        },
        "parallax-medium": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-50px)" },
        },
        "parallax-fast": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-rotate": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "wave": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 10s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 2s infinite",
        glow: "glow 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        ripple: "ripple 3s ease-out infinite",
        // Parallax animations
        "parallax-slow": "parallax-slow 8s ease-in-out infinite",
        "parallax-medium": "parallax-medium 6s ease-in-out infinite",
        "parallax-fast": "parallax-fast 4s ease-in-out infinite",
        "float-rotate": "float-rotate 8s ease-in-out infinite",
        wave: "wave 3s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 50px hsl(165 80% 55% / 0.4)",
        "glow-sm": "0 0 25px hsl(165 80% 55% / 0.3)",
        "glow-lg": "0 0 80px hsl(165 80% 55% / 0.5)",
        card: "0 4px 30px hsl(165 50% 40% / 0.1)",
        "card-hover": "0 8px 40px hsl(165 50% 35% / 0.15)",
        aero: "0 8px 32px hsl(165 60% 45% / 0.15), 0 2px 8px hsl(165 50% 50% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
        "aero-strong": "0 12px 48px hsl(165 60% 40% / 0.2), 0 4px 16px hsl(165 50% 45% / 0.15), inset 0 2px 0 hsl(0 0% 100% / 0.8)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
