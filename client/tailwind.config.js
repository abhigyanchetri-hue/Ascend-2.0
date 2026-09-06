/** @type {import('tailwindcss').Config} */
// Ascend design system — warm, human, calm. Now in light AND dark.
//
// Every color is a CSS variable (declared in src/index.css) written as an
// "R G B" triplet. Tailwind turns them into rgb(var(--x) / <alpha-value>)
// utilities, so opacity modifiers like bg-forest/40 still work — and switching
// theme only swaps the variables. Components never know which theme is active.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--c-background) / <alpha-value>)', // page background
        card: 'rgb(var(--c-card) / <alpha-value>)', // cards, nav, popups
        ink: 'rgb(var(--c-ink) / <alpha-value>)', // primary text
        muted: 'rgb(var(--c-muted) / <alpha-value>)', // labels, metadata
        line: 'rgb(var(--c-line) / <alpha-value>)', // borders
        field: 'rgb(var(--c-field) / <alpha-value>)', // input & checkbox borders
        track: 'rgb(var(--c-track) / <alpha-value>)', // empty progress-bar tracks
        hoverbg: 'rgb(var(--c-hoverbg) / <alpha-value>)', // gentle hover fills
        forest: {
          DEFAULT: 'rgb(var(--c-forest) / <alpha-value>)', // primary accent
          dark: 'rgb(var(--c-forest-dark) / <alpha-value>)', // hover/pressed
          light: 'rgb(var(--c-forest-light) / <alpha-value>)', // tinted chips
        },
        warm: {
          DEFAULT: 'rgb(var(--c-warm) / <alpha-value>)', // streaks, fire days
          light: 'rgb(var(--c-warm-light) / <alpha-value>)',
          dark: 'rgb(var(--c-warm-dark) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)', // delete actions
          soft: 'rgb(var(--c-danger-soft) / <alpha-value>)', // red hover fills
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)', // very subtle card elevation
      },
    },
  },
  plugins: [],
};
