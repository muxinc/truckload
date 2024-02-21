/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    fontFamily: {
      sans: ['Montserrat', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: '#b60000',
        secondary: '#ffc803',
      },
    },
  },
  plugins: [],
};
