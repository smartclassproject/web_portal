// tailwind.config.js - RiseMe brand colors
// Primary: Blue #1E73BE (Technology/Data), Green #4CAF50 (Growth/Education)
// Secondary: Yellow #F4C430 (Achievement/Success)
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RiseMe primary
        'riseme-blue': '#1E73BE',
        'riseme-green': '#4CAF50',
        'riseme-yellow': '#F4C430',
        // Override default blue/green to RiseMe palette
        primary: '#4CAF50',
        secondary: '#1E73BE',
        blue: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#1E73BE',
          600: '#1E73BE',
          700: '#1565A0',
          800: '#0D47A1',
          900: '#0A3D91',
        },
        green: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#4CAF50',
          700: '#43A047',
          800: '#388E3C',
          900: '#2E7D32',
        },
        yellow: {
          400: '#F4C430',
          500: '#F4C430',
          600: '#E6B82E',
        },
      },
    },
  },
  plugins: [],
};
