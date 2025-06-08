/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        cupcake: {
          /* Primary */
          "primary":          "#333446",
          "primary-focus":    "#2C2E38",
          "primary-content":  "#ffffff",

          /* Secondary */
          "secondary":        "#7F8CAA",
          "secondary-focus":  "#6B7A99",
          "secondary-content":"#ffffff",

          /* Accent */
          "accent":           "#B8CFCE",
          "accent-focus":     "#A0BDBA",
          "accent-content":   "#333446",

          /* Neutral */
          "neutral":          "#EAEFEF",
          "neutral-focus":    "#D2DCDC",
          "neutral-content":  "#333446",

          /* Base backgrounds & text */
          "base-100":         "#f3f4f6",
          "base-200":         "#e5e7eb",
          "base-300":         "#d1d5db",
          "base-content":     "#1f2937",
        }
      }
    ]
  },
}
