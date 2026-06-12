import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17262C', mut: '#6B7E85', soft: '#9DAFB5',
        fundo: '#F6F8F8', brand: '#0E5F66', brandsoft: '#E5F1F0',
        ok: '#17996B', oksoft: '#E6F4EE', warn: '#C97F16', warnsoft: '#FBF1DE'
      },
      fontFamily: {
        disp: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif']
      },
      borderRadius: { card: '22px' },
      boxShadow: {
        card: '0 1px 3px rgba(23,38,44,.06),0 4px 14px rgba(23,38,44,.05)',
      }
    }
  },
  plugins: []
} satisfies Config;
