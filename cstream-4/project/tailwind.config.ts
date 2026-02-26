import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Couleurs semantic (HSL variables)
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

        // Status colors for all states
        success: {
          light: "#10b981",
          dark: "#34d399",
        },
        warning: {
          light: "#f59e0b",
          dark: "#fbbf24",
        },
        error: {
          light: "#ef4444",
          dark: "#f87171",
        },
        info: {
          light: "#3b82f6",
          dark: "#60a5fa",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        mono: ["Fira Code", "monospace"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
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
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          from: { transform: "translateY(-20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          from: { transform: "translateX(-20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(161, 161, 170, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(161, 161, 170, 0.4)" },
        },
        pulse_glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        blur_in: {
          from: { filter: "blur(5px)", opacity: "0" },
          to: { filter: "blur(0)", opacity: "1" },
        },
        scale_in: {
          from: { transform: "scale(0.98)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        scalePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        neonGlow: {
          "0%, 100%": { textShadow: "0 0 5px rgba(255,255,255,0.2)" },
          "50%": { textShadow: "0 0 10px rgba(255,255,255,0.4)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.2s ease-in-out",
        slideUp: "slideUp 0.3s ease-out",
        slideDown: "slideDown 0.3s ease-out",
        slideLeft: "slideLeft 0.3s ease-out",
        slideRight: "slideRight 0.3s ease-out",
        shimmer: "shimmer 3s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        pulse_glow: "pulse_glow 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        floatUp: "floatUp 3s ease-in-out infinite",
        blur_in: "blur_in 0.3s ease-out",
        scale_in: "scale_in 0.2s ease-out",
        scalePulse: "scalePulse 3s ease-in-out infinite",
        neonGlow: "neonGlow 3s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(255, 255, 255, 0.1)",
        "glow-md": "0 0 20px rgba(255, 255, 255, 0.2)",
        "glow-lg": "0 0 30px rgba(255, 255, 255, 0.3)",
        "glow-xl": "0 0 40px rgba(255, 255, 255, 0.4)",
        "inner-glow": "inset 0 0 20px rgba(255, 255, 255, 0.1)",
        "light-sm": "0 0 10px rgba(0, 0, 0, 0.05)",
        "light-md": "0 0 20px rgba(0, 0, 0, 0.1)",
      },
      zIndex: {
        0: "0",
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
        110: "110",
        120: "120",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
