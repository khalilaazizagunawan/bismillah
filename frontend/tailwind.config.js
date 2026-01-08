/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EC4899', // pink-500
        secondary: '#F472B6',
      },
    },
  },
  plugins: [],
}