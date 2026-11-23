import { theme } from './src/.bolt-generated/tailwind.theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/.bolt-generated/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: theme,
  },
  plugins: [],
}
