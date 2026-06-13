import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Vip Insurance
        brand:     '#F04E3E',   // coral-vermelho — cor principal de ação
        brandsoft: '#FDE8E7',   // brand claro
        accent:    '#8B2FC9',   // roxo — cor secundária
        accentsoft:'#F0E8FA',   // accent claro
        ink:       '#1A0A2E',   // roxo quase preto
        mut:       '#7B6B8A',   // muted
        soft:      '#A89CB5',   // softer muted
        fundo:     '#FDF8FF',   // lavanda claríssima
        card:      '#FFFFFF',
        // legados mapeados para nova paleta
        ok:        '#17996B',
        oksoft:    '#E6F4EE',
        warn:      '#C97F16',
        warnsoft:  '#FBF1DE',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8B2FC9, #D63AA0, #F04E3E)',
        'brand-gradient-v': 'linear-gradient(180deg, #8B2FC9, #D63AA0, #F04E3E)',
        'sidebar-bg': 'linear-gradient(180deg, #1A0A2E 0%, #120720 100%)',
      },
      fontFamily: {
        disp: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
      borderRadius: { card: '22px' },
      boxShadow: {
        card:  '0 1px 3px rgba(26,10,46,.06),0 4px 14px rgba(26,10,46,.05)',
        brand: '0 4px 20px rgba(240,78,62,.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
