import type { Config } from "tailwindcss";

let tailwindPreset: any = null;
try {
  tailwindPreset = require("@musekit/design-system").tailwindPreset;
} catch {
}

const config: Config = {
  ...(tailwindPreset ? { presets: [tailwindPreset] } : {}),
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layout/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success, 142 76% 36%))",
          foreground: "hsl(var(--success-foreground, 0 0% 100%))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning, 38 92% 50%))",
          foreground: "hsl(var(--warning-foreground, 0 0% 0%))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger, 0 84% 60%))",
          foreground: "hsl(var(--danger-foreground, 0 0% 100%))",
        },
        info: {
          DEFAULT: "hsl(var(--info, 221 83% 53%))",
          foreground: "hsl(var(--info-foreground, 0 0% 100%))",
        },
        chart: {
          primary: "var(--chart-primary, hsl(221.2, 83.2%, 53.3%))",
          secondary: "var(--chart-secondary, hsl(142, 76%, 36%))",
          tertiary: "var(--chart-tertiary, hsl(0, 84%, 60%))",
        },
      },
      fontFamily: {
        body: "var(--font-body, system-ui, sans-serif)",
        heading: "var(--font-heading, system-ui, sans-serif)",
      },
      boxShadow: {
        theme: "var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))",
        "theme-md": "var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1))",
        "theme-lg": "var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
