import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09070F",
        surface: "#12101D",
        violet: "#7C3AED",
        orchid: "#B98CFF",
        mist: "#E9DDFF",
      },
    },
  },
  plugins: [],
};

export default config;
