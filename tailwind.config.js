/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-cream)',
        ink: 'var(--color-ink)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        knob: 'var(--color-knob)',
        completed: {
          from: '#FFE285',
          to: '#FFAE33',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '32px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(25,25,25,0.04), 0 8px 24px rgba(25,25,25,0.05)',
        cardHover: '0 2px 6px rgba(25,25,25,0.06), 0 14px 36px rgba(25,25,25,0.08)',
        glass: '0 8px 32px 0 rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)',
        glassDeep: '0 12px 40px 0 rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
