/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        // Backgrounds
        surface: 'var(--bg-primary)',
        muted: 'var(--bg-secondary)',
        subtle: 'var(--bg-tertiary)',
        // Borders
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-hover)',
        // Semantic
        'error-bg': 'var(--error-bg)',
        'error': 'var(--error-text)',
        'success-bg': 'var(--success-bg)',
        'success': 'var(--success-text)',
        'warning-bg': 'var(--warning-bg)',
        'warning': 'var(--warning-text)',
      },
      textColor: {
        base: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        faint: 'var(--text-tertiary)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        token: '50%',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },
    },
  },
  plugins: [],
};
