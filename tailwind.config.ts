import type { Config } from "tailwindcss";


const tailwindcssAnimate = require("tailwindcss-animate");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [
    tailwindcssAnimate, // Plugin của shadcn

  ],
};

export default config;
