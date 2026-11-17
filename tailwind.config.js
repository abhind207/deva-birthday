/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dusty: '#A65F78',
        blush: '#F4DDE5',
        ivory: '#FFF9F5',
        gold: '#D8B88C',
        mauve: '#B88A9A',
        wine: '#401E30',
        // admin-only
        ink: '#141116',
        ink2: '#1D1920',
        ink3: '#27212B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
