
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
    keyframes: {
      'pulse-glow': {
        '0%, 100%': { boxShadow: '0 0 10px rgba(0, 102, 255, 0.3)' },
        '50%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.6)' }
      }
    },
    animation: {
      'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
    },
    },
  },
  plugins: [],
}
