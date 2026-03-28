import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        grimoire: ['Georgia', '"Times New Roman"', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        grimoire: {
          deep:    '#0d0c0b',
          card:    '#141210',
          hover:   '#1c1916',
          input:   '#111009',
          border:  '#2a2520',
          'border-lg':     '#3a3530',
          ink:     '#f0ece4',
          muted:   '#6b6560',
          faint:   '#3a3530',
          gold:         '#b8922a',
          'gold-dim':   '#7a6020',
          'gold-bright':'#d4aa40',
          status: {
            'playing-bg':     '#1a2e20',
            'playing-text':   '#6ab882',
            'backlog-bg':     '#1c1916',
            'backlog-text':   '#6b6560',
            'completed-bg':   '#1a2030',
            'completed-text': '#6a92b8',
            'dropped-bg':     '#2e1a16',
            'dropped-text':   '#b87060',
            'wishlist-bg':    '#2a2010',
            'wishlist-text':  '#b8a060',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config