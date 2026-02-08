import type { Config } from 'tailwindcss';

// Tailwind v4: Most config has moved to app/globals.css using @theme and @plugin
// This file is kept for editor tooling compatibility
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
} satisfies Config;
