/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#534AB7',
          light: '#EEEDFE',
          border: '#AFA9EC',
          dark: '#3C3489',
          darker: '#26215C',
        },
        page: '#f5f4f0',
        surface: '#f1efe8',
        ink: {
          DEFAULT: '#1a1a18',
          secondary: '#5f5e5a',
          tertiary: '#888780',
        },
        success: { bg: '#EAF3DE', border: '#97C459', text: '#3B6D11' },
        danger:  { bg: '#FCEBEB', border: '#F09595', text: '#A32D2D' },
        warn:    { bg: '#FAEEDA', border: '#EF9F27', text: '#633806' },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
