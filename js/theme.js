/* =============================================================================
   ANONYMOUS COLLECTIVES — theme.js
   Loaded in the <head> of every page, BEFORE the stylesheet paints, so the
   right theme is applied immediately and there is no flash of the wrong one.

   Order of preference:
     1. the theme the visitor chose before (localStorage "ac:theme"), on every page
     2. otherwise DARK, which is the primary experience of the brand
   (To follow the device setting on a first visit instead, see README, "Light and dark mode".)
============================================================================= */
(function () {
  var DEFAULT_THEME = "dark";
  var theme = null;
  try { theme = localStorage.getItem("ac:theme"); } catch (e) { /* storage blocked */ }
  if (theme !== "light" && theme !== "dark") theme = DEFAULT_THEME;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
