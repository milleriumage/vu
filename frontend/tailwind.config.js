/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950 extremely dark
        surface: '#18181b', // zinc-900
        surfaceHighlight: '#27272a', // zinc-800
        primary: '#8b5cf6', // violet-500
        secondary: '#d946ef', // fuchsia-500
        accent: '#06b6d4', // cyan-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
