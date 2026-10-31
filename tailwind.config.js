/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pv: {
          primary: '#1B7A5A',
          'primary-soft': '#E4F2EC',
          alert: '#B7791F',
          danger: '#B83232',
          total: '#1B7A5A',
          inactive: '#5B6770',
          background: '#F5F7F6',
          surface: '#FFFFFF',
          text: '#1F2933',
          'text-soft': '#52606D',
          border: '#D9DEE4',
        },
      },
    },
  },
  plugins: [],
};
