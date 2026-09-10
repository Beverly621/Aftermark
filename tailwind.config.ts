import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11110f",
        bone: "#f4f0e6",
        acid: "#dfff36",
        signal: "#ff4f9a",
      },
    },
  },
  plugins: [],
} satisfies Config;
