module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinema: {
          bg:        '#080808',
          surface:   '#100E0C',
          card:      '#131110',
          elevated:  '#1C1916',
          border:    '#252220',
          'border-gold': 'rgba(200,169,110,0.15)',
          muted:     '#6B6560',
          subtle:    '#9C9590',
          text:      '#E2DDD6',
          gold:      '#C8A96E',
          'gold-light': '#EDD9A3',
          'gold-dim': '#9A7E4F',
          success:   '#6B9E7A',
          danger:    '#C47A6B',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '3px',
        chip: '2px',
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,169,110,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,169,110,0.15)',
        'poster':   '4px 0 24px rgba(0,0,0,0.8)',
        'gold-glow':'0 0 30px rgba(200,169,110,0.2)',
        'btn':      '0 2px 8px rgba(200,169,110,0.3)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C8A96E 0%, #EDD9A3 50%, #C8A96E 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(200,169,110,0.03) 0%, transparent 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        'card-enter': 'card-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up':    'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spin-slow 12s linear infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    }
  },
  plugins: [],
}
