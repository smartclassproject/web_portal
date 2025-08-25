// tailwind.config.js
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#43A047",
          secondary: "#64B5F6",
          neutral: "#E0E0E0",
          success: "#4CAF50",
          error: "#F44336",
        },
        backgroundColor: {
          primary: "#43A047",
          secondary: "#64B5F6",
          neutral: "#E0E0E0",
          success: "#4CAF50",
          error: "#F44336",
        },
      },
    },
    plugins: [],
  };
  