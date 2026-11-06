/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Noto Sans"',
          'Helvetica',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace'
        ]
      },
      colors: {
        gh: {
          canvas: {
            DEFAULT: '#ffffff',
            dark: '#0d1117',
            subtle: '#f6f8fa',
            'subtle-dark': '#161b22',
            inset: '#f6f8fa',
            'inset-dark': '#010409'
          },
          border: {
            DEFAULT: '#d0d7de',
            dark: '#30363d',
            muted: '#afb8c1',
            'muted-dark': '#21262d'
          },
          text: {
            DEFAULT: '#1f2328',
            dark: '#e6edf3',
            muted: '#656d76',
            'muted-dark': '#848d97',
            subtle: '#6e7781',
            'subtle-dark': '#6e7681'
          },
          green: {
            DEFAULT: '#1a7f37',
            dark: '#238636',
            hover: '#2ea043'
          },
          blue: {
            DEFAULT: '#0969da',
            dark: '#2f81f7',
            hover: '#58a6ff'
          },
          red: {
            DEFAULT: '#cf222e',
            dark: '#f85149',
            btn: '#da3633'
          },
          amber: {
            DEFAULT: '#9a6700',
            dark: '#d29922'
          },
          purple: {
            DEFAULT: '#8250df',
            dark: '#a371f7'
          }
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      }
    },
  },
  plugins: [],
}
