/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        paper: '#f7f7f2',
        moss: '#2f6b4f',
        sage: '#dfe9df',
        coral: '#db5c4f',
      },
      boxShadow: {
        card: '0 18px 45px -25px rgba(23, 33, 27, 0.28)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
