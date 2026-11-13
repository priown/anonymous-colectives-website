/* Tailwind (CDN) theme for Anonymous Collectives.
   Loaded on every page right after the Tailwind CDN script.

   The semantic colours below read CSS variables, so they flip automatically
   between light and dark mode (the variables are defined in css/styles.css).
     cream  = page background        ink   = main text
     sand   = secondary background   taupe = secondary text
     choc   = accent (Accent Red)
   charcoal / ivory / bronze are FIXED colours that never change with the theme
   (used for text over photographs and for always-dark sections). */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--c-bg) / <alpha-value>)",
        sand: "rgb(var(--c-bg2) / <alpha-value>)",
        ink: "rgb(var(--c-text) / <alpha-value>)",
        taupe: "rgb(var(--c-text2) / <alpha-value>)",
        choc: "rgb(var(--c-accent) / <alpha-value>)",
        charcoal: "#080808",   // deep black, fixed
        ivory: "#F5F3EF",      // warm white, fixed
        accent: "#A83232",     // accent red, fixed
        grey: "#929292",       // muted grey, fixed
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Archivo"', '"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.045em" },
    },
  },
};
