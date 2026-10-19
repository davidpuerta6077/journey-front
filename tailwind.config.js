// Tailwind solo para el editor CodeX (src/codex); el resto del hub no lo usa.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./codex.html', './src/codex/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
