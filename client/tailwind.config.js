/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          felt: '#1b4a36',
          feltDark: '#123325',
          feltLight: '#235f45',
          wood: '#2b1b14',
          woodBorder: '#472d20',
          gold: '#dfb76c',
          goldLight: '#f3d38c',
          goldDark: '#a67c33'
        }
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
