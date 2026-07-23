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
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        // display: Space Grotesk — marketing surfaces only (dev portal, landing).
        // Never use in product pages, trading terminal, or data-dense UI.
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        // poster: Archivo Black — retro poster / campaign surfaces only (e.g. /hedge, homepage campaign banner).
        // Distinct from font-display; the two are not interchangeable.
        poster: ['"Archivo Black"', 'Impact', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-elevated": "hsl(var(--background-elevated))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          muted: "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
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
          hover: "hsl(var(--card-hover))",
        },
        trading: {
          green: "hsl(var(--trading-green))",
          "green-muted": "hsl(var(--trading-green-muted))",
          "green-bg": "hsl(var(--trading-green-bg))",
          "green-foreground": "hsl(var(--foreground))",
          red: "hsl(var(--trading-red))",
          "red-muted": "hsl(var(--trading-red-muted))",
          "red-bg": "hsl(var(--trading-red-bg))",
          purple: "hsl(var(--trading-purple))",
          "purple-muted": "hsl(var(--trading-purple-muted))",
          "purple-bg": "hsl(var(--trading-purple-bg))",
          yellow: "hsl(var(--trading-yellow))",
          "yellow-muted": "hsl(var(--trading-yellow-muted))",
          "yellow-bg": "hsl(var(--trading-yellow-bg))",
          "yellow-foreground": "hsl(var(--background))",
        },
        indicator: {
          DEFAULT: "hsl(var(--indicator))",
          muted: "hsl(var(--indicator-muted))",
        },
        mainnet: {
          gold: "hsl(var(--mainnet-gold))",
          "gold-muted": "hsl(var(--mainnet-gold-muted))",
          orange: "hsl(var(--mainnet-orange))",
          ember: "hsl(var(--mainnet-ember))",
          surface: "hsl(var(--mainnet-surface))",
          "surface-elevated": "hsl(var(--mainnet-surface-elevated))",
        },
        campaign: {
          accent: "hsl(var(--campaign-accent))",
          "accent-secondary": "hsl(var(--campaign-accent-secondary))",
          surface: "hsl(var(--campaign-surface))",
          "surface-elevated": "hsl(var(--campaign-surface-elevated))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        'safe': 'var(--safe-area-bottom, 5rem)',
      },
      padding: {
        'safe': 'var(--safe-area-bottom, 5rem)',
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "enter": {
          from: { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(400px) rotate(720deg)", opacity: "0" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "rocket-lift": {
          "0%, 100%": { transform: "translateY(0) rotate(-10deg)" },
          "50%": { transform: "translateY(-12px) rotate(-7deg)" },
        },
        "accent-breathe": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 hsl(var(--accent-glow, var(--primary)) / 0)" },
          "50%": { opacity: "0.7", boxShadow: "0 0 6px 0 hsl(var(--accent-glow, var(--primary)) / 0.45)" },
        },
        "ball-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "ball-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "enter": "enter 0.3s ease-out",
        "confetti-fall": "confetti-fall 3s ease-out forwards",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "rocket-lift": "rocket-lift 3.4s ease-in-out infinite",
        "accent-breathe": "accent-breathe 2.4s ease-in-out infinite",
        "ball-spin": "ball-spin 8s linear infinite",
        "ball-bounce": "ball-bounce 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
