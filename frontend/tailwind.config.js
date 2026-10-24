/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: '#05070B',
        'space-950': '#030508',
        'space-900': '#070A10',
        'space-850': '#0B1018',

        surface: '#0B1018',
        'surface-elevated': '#111925',
        'surface-subtle': '#162030',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        'surface-border-active': 'rgba(114, 221, 251, 0.35)',

        signal: {
          cyan: '#72DDFB',
          amber: '#FFBD69',
          red: '#FF626B',
          green: '#80D7A2',
          ice: '#A5C4D4',
        },
        'signal-cyan': '#72DDFB',
        'signal-amber': '#FFBD69',
        'signal-red': '#FF626B',
        'signal-green': '#80D7A2',
        'signal-ice': '#A5C4D4',

        content: {
          primary: '#F2F5FA',
          secondary: '#8D9AAA',
          muted: '#556375',
        },
        'content-primary': '#F2F5FA',
        'content-secondary': '#8D9AAA',
        'content-muted': '#556375',
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle-surface': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        'cyan-glow': '0 0 24px -4px rgba(114, 221, 251, 0.3)',
        'red-glow': '0 0 24px -4px rgba(255, 98, 107, 0.3)',
      }
    },
  },
  plugins: [],
}
