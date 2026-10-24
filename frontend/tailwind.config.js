/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030712',
          900: '#070d1d',
          850: '#0c142b',
          800: '#111d3d',
          700: '#1b2a54',
        },
        cyber: {
          cyan: '#00f0ff',
          ice: '#70d6ff',
          amber: '#ffb703',
          red: '#ff0054',
          green: '#06d6a0',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.35)',
        'glow-amber': '0 0 20px rgba(255, 183, 3, 0.35)',
        'glow-red': '0 0 20px rgba(255, 0, 84, 0.4)',
      }
    },
  },
  plugins: [],
}
