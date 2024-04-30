/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    fontFamily: {
      sans: "var(--sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji')",
      mono: "var(--mono, 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace')",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fe5c39',
          dark: '#e94e60',
        },
        secondary: '#ffc803',
      },
      spacing: {
        128: '32rem',
      },
    },
  },
  plugins: [],
};
