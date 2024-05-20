/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./routes/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
      extend: {
          fontFamily: {
              'recmed': ['Recoleta-Medium', 'sans-serif'],
              'recbold': ['Recoleta-SemiBold', 'serif'],
              'recregular': ['Recoleta-Regular', 'serif'],
              'montreg': ['Montserrat-Regular', 'serif'],
              'montmed': ['Montserrat-Medium', 'serif'],
              'montsemibold': ['Montserrat-SemiBold', 'serif'],
              'montbold': ['Montserrat-Bold', 'serif']
          },
      },
  },
  plugins: [],
}
