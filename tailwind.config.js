/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14172B",
        mist: "#F5F6FB",
        line: "#E2E5F0",
        ultra: { DEFAULT: "#2B3FE0", soft: "#E8EBFF", deep: "#1F2EB0" },
        signal: { DEFAULT: "#D98A00", soft: "#FFF3D6" },
        slate2: "#6B7190",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Instrument Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 1px 2px rgba(20,23,43,.05), 0 8px 24px -12px rgba(31,46,176,.18)",
      },
    },
  },
  plugins: [],
};
