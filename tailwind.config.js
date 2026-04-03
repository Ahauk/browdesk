/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#1A1A1A",
          dark: "#2D2D2D",
          beige: "#F5F0EB",
          "beige-medium": "#E8DDD3",
          gold: "#C4A87C",
          "gold-dark": "#A68B5B",
          gray: "#8A8A8A",
        },
      },
      fontFamily: {
        light: ["Inter_300Light"],
        regular: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
