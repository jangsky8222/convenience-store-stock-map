import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cu: {
            DEFAULT: "#5f2d84", // CU Signature Purple
            light: "#f3e8ff",
            text: "#5f2d84",
          },
          gs25: {
            DEFAULT: "#00a3e0", // GS25 Light Blue
            light: "#e0f2fe",
            text: "#0369a1",
          },
          seven: {
            DEFAULT: "#008060", // Seven Eleven Green
            light: "#d1fae5",
            text: "#065f46",
          },
          emart: {
            DEFAULT: "#ffbc0d", // Emart24 Yellow
            light: "#fef3c7",
            text: "#92400e",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
