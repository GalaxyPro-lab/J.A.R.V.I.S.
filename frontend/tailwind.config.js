/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jarvis: {
          void: '#060a12',
          bg: '#0a0f1d',
          surface: '#111827',
          card: '#131d31',
          hover: '#1c2842',
          border: 'rgba(56, 189, 248, 0.18)',
          borderGlow: 'rgba(0, 240, 255, 0.45)',
          cyan: '#00f0ff',
          blue: '#3b82f6',
          electric: '#0284c7',
          accent: '#38bdf8',
          text: '#f1f5f9',
          muted: '#94a3b8',
          subtle: '#64748b'
        }
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(0, 240, 255, 0.25)',
        'cyan-intense': '0 0 35px rgba(0, 240, 255, 0.55)',
        'blue-glow': '0 0 25px rgba(59, 130, 246, 0.3)',
        'card-glow': '0 8px 32px 0 rgba(0, 240, 255, 0.08)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin 18s linear infinite reverse',
        'glow-breathing': 'glowBreathing 4s ease-in-out infinite'
      },
      keyframes: {
        glowBreathing: {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.75))' },
        }
      }
    },
  },
  plugins: [],
}
