/* =============================================================================
   ANONYMOUS COLLECTIVES — shop.js
   Filtering, search and sorting for the shop page.
   All state lives in the URL (?category=Caps&size=L ...) so filtered views can
   be shared and the back button behaves. Only the chosen sort order is also
   remembered in localStorage.
============================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const { esc, img, productCard, searchProducts, priceInfo, shopUrl } = AC;

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
  const DEFAULTS = { q: "", category: "", gender: "", colour: "", size: "", avail: "", flag: "", collection: "", sort: "featured" };

  /* ---- State ---------------------------------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  let savedSort = "featured";
  try { savedSort = localStorage.getItem("ac:sort") || "featured"; } catch (e) { /* storage unavailable */ }
  const state = { ...DEFAULTS, sort: savedSort };
  Object.keys(DEFAULTS).forEach((k) => params.has(k) && (state[k] = params.get(k)));

  const isFiltered = () => Object.keys(DEFAULTS).some((k) => k !== "sort" && state[k] !== "");
  const activeCount = () => ["gender", "colour", "size", "avail", "flag", "collection"].filter((k) => state[k]).length;

  /* ---- Build filter options from the catalogue -------------------------------- */
  const unique = (arr) => [...new Set(arr)];
  const categories = unique([...CATEGORIES.map((c) => c.name), ...PRODUCTS.map((p) => p.category)]);
  const genders = unique(PRODUCTS.map((p) => p.gender)).filter(Boolean);
  const colourMap = new Map();
  PRODUCTS.forEach((p) => p.colours.forEach((c) => colourMap.set(c.name, c.hex)));
  const sizes = unique(PRODUCTS.flatMap((p) => p.sizes)).sort(
    (a, b) => (SIZE_ORDER.indexOf(a) + 99) % 99 - (SIZE_ORDER.indexOf(b) + 99) % 99
  );

  const fillSelect = (el, label, values) => {
    el.innerHTML = `<option value="">${label}: All</option>` + values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  };
  fillSelect($("f-gender"), "Gender", genders);
  fillSelect($("f-colour"), "Colour", [...colourMap.keys()]);
  fillSelect($("f-size"), "Size", sizes);

  /* ---- Filtering and sorting ---------------------------------------------------- */
  const sorters = {
    featured: (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) ||
      Number(b.isBestSeller) - Number(a.isBestSeller) ||
      (b.dateAdded || "").localeCompare(a.dateAdded || ""),
    newest: (a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""),
    "price-asc": (a, b) => priceInfo(a).current - priceInfo(b).current,
    "price-desc": (a, b) => priceInfo(b).current - priceInfo(a).current,
  };

  const getResults = () => {
    const matches = state.q ? new Set(searchProducts(state.q).map((p) => p.id)) : null;
    return PRODUCTS.filter((p) => {
      if (matches && !matches.has(p.id)) return false;
      if (state.category && p.category !== state.category) return false;
      if (state.gender) {
        // Men / Women also include Unisex pieces. "Unisex" shows only Unisex.
        const ok = p.gender === state.gender || (state.gender !== "Unisex" && p.gender === "Unisex");
        if (!ok) return false;
      }
      if (state.colour && !p.colours.some((c) => c.name === state.colour)) return false;
      if (state.size && !p.sizes.includes(state.size)) return false;
      if (state.avail === "in" && !p.available) return false;
      if (state.avail === "out" && p.available) return false;
      if (state.flag === "new" && !p.isNewArrival) return false;
      if (state.flag === "best" && !p.isBestSeller) return false;
      if (state.collection && p.collection !== state.collection) return false;
      return true;
    }).sort(sorters[state.sort] || sorters.featured);
  };

  /* ---- Rendering --------------------------------------------------------------- */
  const renderCategoryNav = () => {
    const btn = (label, value) =>
      `<button type="button" class="chip" data-cat="${esc(value)}" aria-pressed="${state.category === value}">${esc(label)}</button>`;
    $("category-nav").innerHTML = btn("All", "") + categories.map((c) => btn(c, c)).join("");
  };

  const renderGrid = () => {
    const results = getResults();
    $("result-count").textContent = `${results.length} ${results.length === 1 ? "product" : "products"}`;
    $("product-grid").innerHTML = results
      .map((p, i) => `<div data-reveal>${productCard(p, { variant: i % 5 === 2 ? "editorial" : "clean" })}</div>`)
      .join("");
    $("empty-state").classList.toggle("hidden", results.length > 0);
    $("product-grid").classList.toggle("hidden", results.length === 0);
    AC.reveal($("product-grid"));
  };

  const renderControls = () => {
    if (document.activeElement !== $("f-q")) $("f-q").value = state.q;
    $("f-sort").value = state.sort;
    $("f-gender").value = state.gender;
    $("f-colour").value = state.colour;
    $("f-size").value = state.size;
    $("f-avail").value = state.avail;
    document.querySelectorAll("[data-flag]").forEach((b) => b.setAttribute("aria-pressed", String(state.flag === b.dataset.flag)));
    $("collection-chip").innerHTML = state.collection
      ? `<button type="button" class="chip" id="collection-clear" aria-pressed="true">Collection: ${esc(state.collection)} &times;</button>`
      : "";
    const n = activeCount();
    $("filter-count").textContent = n ? `(${n})` : "";
    $("curated").classList.toggle("hidden", isFiltered());
  };

  const syncUrl = () => {
    const out = new URLSearchParams();
    Object.keys(DEFAULTS).forEach((k) => state[k] !== DEFAULTS[k] && state[k] !== "" && out.set(k, state[k]));
    const qs = out.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  };

  const update = () => {
    renderCategoryNav();
    renderControls();
    renderGrid();
    syncUrl();
    AC.icons();
  };

  const scrollToResults = () => $("all-products").scrollIntoView({ behavior: "smooth", block: "start" });

  /* ---- Curated rows and collections (static, rendered once) ----------------------- */
  const newest = PRODUCTS.filter((p) => p.isNewArrival).sort(sorters.newest).slice(0, 4);
  $("shop-new").innerHTML = newest.length ? newest.map((p) => `<div data-hide-if-missing>${productCard(p)}</div>`).join("") : `<p class="text-ink/70">New pieces are on the way.</p>`;
  const best = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4);
  $("shop-best").innerHTML = best.length ? best.map((p) => `<div data-hide-if-missing>${productCard(p, { variant: "editorial" })}</div>`).join("") : `<p class="text-ink/70">Best sellers will appear here.</p>`;

  // A collection card uses its first product's photo. If that photo file is missing the card
  // removes itself, so collections with no real photo yet stay hidden.
  const shownCollections = COLLECTIONS.map((c) => ({ ...c, image: AC.collectionImage(c) })).filter((c) => c.image);
  $("shop-collections").innerHTML = shownCollections.map((c, i) => {
    const span = shownCollections.length === 1 ? "md:col-span-12" : i % 3 === 0 ? "md:col-span-7" : "md:col-span-5";
    const count = PRODUCTS.filter((p) => p.collection === c.name).length;
    return `
      <a href="${shopUrl({ collection: c.name })}#all-products" data-collection="${esc(c.name)}" data-hide-if-missing class="zoom relative block ${span}" data-reveal>
        <div class="img-frame aspect-[4/5] sm:aspect-[16/11] md:aspect-auto md:h-full md:min-h-[24rem]">
          ${img(c.image, `${c.name} collection`, "", 'loading="lazy"')}
          <div class="absolute inset-0 bg-charcoal/45"></div>
        </div>
        <div class="absolute inset-x-0 bottom-0 p-6 text-ivory lg:p-8">
          <h3 class="font-serif text-4xl">${esc(c.name)}</h3>
          <p class="mt-2 max-w-sm text-sm opacity-90">${esc(c.description)}</p>
          <span class="link-line mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em]">${count} ${count === 1 ? "piece" : "pieces"}, view collection</span>
        </div>
      </a>`;
  }).join("");
  if (!shownCollections.length) $("collections").classList.add("hidden");

  /* ---- Events ------------------------------------------------------------------- */
  let searchTimer;
  $("f-q").addEventListener("input", (e) => {
    state.q = e.target.value.trim(); // update state straight away so other controls never overwrite what was typed
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 150);
  });
  $("f-sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    try { localStorage.setItem("ac:sort", state.sort); } catch (err) { /* ignore */ }
    update();
  });
  [["f-gender", "gender"], ["f-colour", "colour"], ["f-size", "size"], ["f-avail", "avail"]].forEach(([id, key]) =>
    $(id).addEventListener("change", (e) => { state[key] = e.target.value; update(); })
  );

  document.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-cat]");
    if (cat) { state.category = cat.dataset.cat; update(); scrollToResults(); return; }

    const flag = e.target.closest("[data-flag]");
    if (flag) { state.flag = state.flag === flag.dataset.flag ? "" : flag.dataset.flag; update(); return; }

    const coll = e.target.closest("[data-collection]");
    if (coll) { e.preventDefault(); state.collection = coll.dataset.collection; update(); scrollToResults(); return; }

    if (e.target.closest("#collection-clear")) { state.collection = ""; update(); return; }
    if (e.target.closest("#f-clear") || e.target.closest("#empty-clear")) {
      Object.keys(DEFAULTS).forEach((k) => k !== "sort" && (state[k] = ""));
      update();
    }
  });

  $("filters-toggle").addEventListener("click", (e) => {
    const panel = $("filter-panel");
    const open = panel.classList.toggle("hidden") === false;
    panel.classList.toggle("grid", open);
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });

  /* ---- Go ----------------------------------------------------------------------- */
  // Open the filter panel straight away on phones if the link arrived with filters in it.
  if (activeCount() > 0) {
    $("filter-panel").classList.remove("hidden");
    $("filter-panel").classList.add("grid");
    $("filters-toggle").setAttribute("aria-expanded", "true");
  }
  const initialHash = window.location.hash; // update() rewrites the URL, so read this first
  update();

  // Content is built after load, so jump to #collections / #all-products once it exists.
  if (initialHash) {
    const target = document.querySelector(initialHash);
    if (target) setTimeout(() => target.scrollIntoView(), 60);
  }
  AC.reveal();
});
