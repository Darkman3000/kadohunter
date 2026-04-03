/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter"],
      },
      colors: {
        midnight: "#0a192f",
        navy: "#112240",
        umber: "#c7a77b",
        "umber-dark": "#b3956d",
        "light-slate": "#ccd6f6",
        "slate-text": "#8892b0",
      },
    },
  },
  plugins: [],
};
