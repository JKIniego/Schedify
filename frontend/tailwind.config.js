/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#14213D",
          gold: "#C9A227",
          crimson: "#8B1E3F",
          slate: "#5B6472",
          hair: "#E4E1D8",
          card: "#FBFAF7",
        },
      },
    },
  },
  plugins: [],
}