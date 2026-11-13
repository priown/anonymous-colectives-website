/* =============================================================================
   ANONYMOUS COLLECTIVES — product.js
   Product detail page: gallery, colour and size selection, quantity and the
   WhatsApp order button. The product is chosen by the ?id= in the page link,
   e.g. product.html?id=ac-001
============================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const { esc, img, priceInfo, formatPrice, productCard, waLink, shopUrl } = AC;

  const root = $("product-root");
  const id = new URLSearchParams(window.location.search).get("id");
  const p = AC.findProduct(id);

  /* ---- Product not found ---------------------------------------------------- */
  if (!p) {
    document.title = "Product not found | Anonymous Collectives";
    root.innerHTML = `
      <div class="py-24 text-center">
        <h1 class="font-serif text-5xl">We couldn't find that product.</h1>
        <p class="mt-4 text-ink/70">The link may be old, or the piece may have been removed.</p>
        <a href="shop.html" class="btn btn-dark mt-8">Back to the shop</a>
      </div>`;
    return;
  }

  /* ---- Page title and social metadata ---------------------------------------- */
  const info = priceInfo(p);
  const setMeta = (sel, value) => { const el = document.querySelector(sel); if (el) el.setAttribute("content", value); };
  document.title = `${p.name} | Anonymous Collectives`;
  setMeta('meta[name="description"]', `${p.name} from Anonymous Collectives. ${p.description}`.slice(0, 160));
  setMeta('meta[property="og:title"]', `${p.name} | Anonymous Collectives`);
  setMeta('meta[property="og:description"]', p.description);
  setMeta('meta[property="og:image"]', p.images[0]);

  /* ---- State ------------------------------------------------------------------ */
  const hasColours = p.colours.length > 0;
  const hasSizes = p.sizes.length > 0;
  const state = {
    colour: p.colours.length === 1 ? p.colours[0] : null, // single options are pre-selected
    size: p.sizes.length === 1 ? p.sizes[0] : null,
    qty: 1,
    image: 0,
  };

  /* ---- Layout ------------------------------------------------------------------ */
  const thumbs = p.images.length > 1
    ? p.images.map((src, i) => `
        <button type="button" class="thumb aspect-[4/5] w-16 shrink-0 overflow-hidden sm:w-20 lg:w-full" data-thumb="${i}" aria-label="Show photo ${i + 1} of ${p.images.length}" aria-current="${i === 0}">
          ${img(src, "", "h-full w-full object-cover")}
        </button>`).join("")
    : "";

  const priceHtml = info.current <= 0
    ? `<span class="text-2xl font-semibold">Price on request</span>`
    : info.hasDiscount
    ? `<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
         <span class="text-3xl font-semibold">${formatPrice(info.current)}</span>
         <span class="text-lg text-ink/50 line-through">${formatPrice(info.original)}</span>
         <span class="badge badge-sale">Save ${info.percent}%</span>
       </div>`
    : `<span class="text-3xl font-semibold">${formatPrice(info.current)}</span>`;

  const swatches = p.colours.map((c, i) => `
      <button type="button" class="swatch" style="background:${esc(c.hex)}" data-colour="${i}" aria-pressed="false" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join("");
  const sizeBtns = p.sizes.map((s) => `<button type="button" class="size-btn" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join("");

  root.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-6 text-xs text-ink/60 lg:mb-10">
      <a href="shop.html" class="link-line">Shop</a>
      <span class="mx-2" aria-hidden="true">/</span>
      <a href="${shopUrl({ category: p.category })}" class="link-line">${esc(p.category)}</a>
      <span class="mx-2" aria-hidden="true">/</span>
      <span aria-current="page">${esc(p.name)}</span>
    </nav>

    <div class="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <!-- Gallery -->
      <div class="grid gap-3 lg:grid-cols-[5.5rem_1fr] lg:items-start">
        <div class="gallery-main lg:order-2">
          <img id="gallery-img" src="${esc(p.images[0])}" alt="${esc(p.name)}, photo 1" onerror="acImgFallback(this)">
          ${p.images.length > 1 ? `
          <button type="button" id="prev-img" class="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-cream/90" aria-label="Previous photo"><i data-lucide="chevron-left" class="h-5 w-5"></i></button>
          <button type="button" id="next-img" class="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-cream/90" aria-label="Next photo"><i data-lucide="chevron-right" class="h-5 w-5"></i></button>` : ""}
          <div class="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <span class="badge badge-out soon-badge">Mockup coming soon</span>
            ${!p.available ? '<span class="badge badge-out">Sold out</span>' : ""}
            ${info.hasDiscount ? `<span class="badge badge-sale">Sale -${info.percent}%</span>` : ""}
            ${p.isNewArrival ? '<span class="badge badge-new">New</span>' : ""}
            ${p.isBestSeller ? '<span class="badge badge-best">Best Seller</span>' : ""}
          </div>
        </div>
        ${thumbs ? `<div class="no-scrollbar flex gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible" role="group" aria-label="Product photos">${thumbs}</div>` : ""}
        <p id="preview-note" class="preview-note text-xs text-ink/70 lg:order-3 lg:col-start-2" aria-live="polite"></p>
      </div>

      <!-- Information -->
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p class="text-sm text-ink/60">${esc(p.category)}${p.gender ? ` &middot; ${esc(p.gender)}` : ""}${p.collection ? ` &middot; ${esc(p.collection)}` : ""}</p>
        <h1 class="mt-2 font-serif text-4xl leading-tight lg:text-6xl">${esc(p.name)}</h1>
        <div class="mt-5">${priceHtml}</div>
        <p class="mt-5 max-w-lg text-ink/80">${esc(p.description)}</p>
        <div class="mt-6 max-w-lg border-l-2 border-choc pl-5">
          <p class="font-serif text-xl italic leading-snug">${esc(p.story || SITE.defaultStory)}</p>
          ${p.story ? `<p class="mt-3 text-sm text-ink/70">${esc(SITE.defaultStory)}</p>` : ""}
        </div>

        <p class="mt-5 flex items-center gap-2 text-sm font-medium">
          <span class="inline-block h-2.5 w-2.5 rounded-full ${p.available ? "bg-[#2F5A3A]" : "bg-[#A3281F]"}"></span>
          ${p.available ? "In stock" : "Sold out"}
        </p>
        ${p.availabilityNote ? `<p class="mt-1 text-sm text-ink/70">${esc(p.availabilityNote)}</p>` : ""}

        ${hasColours ? `
        <div class="mt-8 border border-transparent p-1" id="group-colour">
          <p class="mb-3 text-sm font-medium">Colour: <span id="colour-label" class="font-normal text-ink/70">Select a colour</span></p>
          <div class="flex flex-wrap gap-3 p-1" role="group" aria-label="Colour">${swatches}</div>
        </div>` : ""}

        ${hasSizes ? `
        <div class="mt-4 border border-transparent p-1" id="group-size">
          <p class="mb-3 text-sm font-medium">Size: <span id="size-label" class="font-normal text-ink/70">Select a size</span></p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Size">${sizeBtns}</div>
        </div>` : ""}

        <div class="mt-4 p-1">
          <p class="mb-3 text-sm font-medium" id="qty-label">Quantity</p>
          <div class="inline-flex items-center border border-ink/35" role="group" aria-labelledby="qty-label">
            <button type="button" id="qty-minus" class="grid h-12 w-12 place-items-center" aria-label="Decrease quantity"><i data-lucide="minus" class="h-4 w-4"></i></button>
            <output id="qty-value" class="grid h-12 w-12 place-items-center text-sm font-medium" aria-live="polite">1</output>
            <button type="button" id="qty-plus" class="grid h-12 w-12 place-items-center" aria-label="Increase quantity"><i data-lucide="plus" class="h-4 w-4"></i></button>
          </div>
        </div>

        <p id="opt-error" role="alert" class="msg-err mt-5 min-h-[1.25rem] text-sm"></p>

        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <button type="button" id="add-btn" class="btn btn-dark w-full" ${p.available ? "" : "disabled aria-disabled=\"true\""}>
            <i data-lucide="shopping-bag" class="h-4 w-4"></i> ${p.available ? "Add to bag" : "Sold out"}
          </button>
          <button type="button" id="order-btn" class="btn btn-light w-full" ${p.available ? "" : "disabled aria-disabled=\"true\""}>
            <i data-lucide="message-circle" class="h-4 w-4"></i> Order via WhatsApp
          </button>
        </div>
        ${p.available
          ? `<p class="mt-3 text-xs text-ink/60">No online payment: add pieces to your bag and check out on WhatsApp, or order this one piece straight away. We confirm delivery and payment with you there.</p>`
          : `<a class="link-line mt-4 inline-block text-sm" target="_blank" rel="noopener noreferrer" href="${waLink(`Hello Anonymous Collectives! Will the ${p.name} be back in stock soon?`)}">Ask about restocks on WhatsApp</a>`}
      </div>
    </div>`;

  /* ---- Gallery ------------------------------------------------------------------ */
  const main = $("gallery-img");
  const showImage = (i) => {
    const n = p.images.length;
    state.image = (i + n) % n;
    const src = p.images[state.image];
    main.classList.add("is-fading");
    setTimeout(() => {
      main.onload = () => main.classList.remove("is-fading");
      main.onerror = () => acImgFallback(main);
      main.alt = `${p.name}, photo ${state.image + 1}`;
      main.src = src;
      setTimeout(() => main.classList.remove("is-fading"), 700); // safety net
    }, 220);
    document.querySelectorAll("[data-thumb]").forEach((t) => t.setAttribute("aria-current", String(Number(t.dataset.thumb) === state.image)));
    updatePreviewNote();
  };

  /* Honest labelling: digitally re-coloured images are never presented as real photographs. */
  const updatePreviewNote = () => {
    const note = $("preview-note");
    if (!note) return;
    const current = p.images[state.image];
    const c = p.colours.find((x) => x.image === current);
    note.textContent = c && c.preview
      ? `${c.name} is a digital colour preview made from the original product photo. It is not a photograph of actual stock.`
      : "";
  };

  /* ---- Option helpers ------------------------------------------------------------- */
  const clearError = () => {
    $("opt-error").textContent = "";
    document.querySelectorAll("#group-colour, #group-size").forEach((g) => g.classList.remove("field-error"));
  };

  const syncOptions = () => {
    document.querySelectorAll("[data-colour]").forEach((b) => b.setAttribute("aria-pressed", String(state.colour === p.colours[b.dataset.colour])));
    document.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(state.size === b.dataset.size)));
    if (hasColours) $("colour-label").textContent = state.colour ? state.colour.name : "Select a colour";
    if (hasSizes) $("size-label").textContent = state.size || "Select a size";
    $("qty-value").textContent = state.qty;
    $("qty-minus").disabled = state.qty <= 1;
    $("qty-minus").classList.toggle("opacity-40", state.qty <= 1);
  };

  /* ---- Events --------------------------------------------------------------------- */
  root.addEventListener("click", (e) => {
    const thumb = e.target.closest("[data-thumb]");
    if (thumb) {
      const idx = Number(thumb.dataset.thumb);
      const match = p.colours.find((c) => c.image === p.images[idx]);
      if (match) { state.colour = match; clearError(); syncOptions(); }
      return showImage(idx);
    }
    if (e.target.closest("#prev-img")) return showImage(state.image - 1);
    if (e.target.closest("#next-img")) return showImage(state.image + 1);

    const colourBtn = e.target.closest("[data-colour]");
    if (colourBtn) {
      state.colour = p.colours[colourBtn.dataset.colour];
      // Some colours have their own photo: jump the gallery to it.
      const target = state.colour.image ? p.images.indexOf(state.colour.image) : -1;
      if (target > -1 && target !== state.image) showImage(target);
      clearError();
      return syncOptions();
    }
    const sizeBtn = e.target.closest("[data-size]");
    if (sizeBtn) { state.size = sizeBtn.dataset.size; clearError(); return syncOptions(); }

    if (e.target.closest("#qty-minus") && state.qty > 1) { state.qty -= 1; return syncOptions(); }
    if (e.target.closest("#qty-plus") && state.qty < 99) { state.qty += 1; return syncOptions(); }

    if (e.target.closest("#add-btn")) addToBag();
    if (e.target.closest("#order-btn")) orderOnWhatsApp();
  });

  /* ---- WhatsApp order --------------------------------------------------------------- */
  /** Both buttons need the same choices: a colour and a size (when the product has them). */
  const validate = () => {
    clearError();
    const missing = [];
    if (hasColours && !state.colour) { missing.push("colour"); $("group-colour").classList.add("field-error"); }
    if (hasSizes && !state.size) { missing.push("size"); $("group-size").classList.add("field-error"); }
    if (missing.length) {
      $("opt-error").textContent = `Please choose your ${missing.join(" and ")} first.`;
      return false;
    }
    return true;
  };

  /* ---- Add to bag: the selected VARIANT (colour + size) and quantity ------------------------- */
  const addToBag = () => {
    if (!validate()) return;
    CART.add({ id: p.id, colour: state.colour ? state.colour.name : "", size: state.size || "", qty: state.qty });
    CART.toast(`${p.name}${state.colour ? ` (${state.colour.name}${state.size ? ", " + state.size : ""})` : ""} added to your bag`);
    CART.open();
  };

  const orderOnWhatsApp = () => {
    if (!validate()) return;

    const pageUrl = new URL(AC.productUrl(p.id), window.location.href).href;
    const lines = [
      "Hello Anonymous Collectives, I would like to order:",
      "",
      `Product: ${p.name}`,
    ];
    if (state.colour) lines.push(`Colour: ${state.colour.name}`);
    if (state.size) lines.push(`Size: ${AC.sizeName(state.size)}`);
    if (state.qty > 1) lines.push(`Quantity: ${state.qty}`);
    if (info.hasDiscount) {
      lines.push(`Price: ${formatPrice(info.current)} (discounted from ${formatPrice(info.original)})`);
    } else {
      lines.push(`Price: ${formatPrice(info.current)}`);
    }
    if (state.qty > 1) lines.push(`Total: ${formatPrice(info.current * state.qty)}`);
    lines.push(`Product page: ${pageUrl}`, "", "Please let me know how to proceed with my order.");

    // waLink() URL-encodes the message and uses the official wa.me link.
    const url = waLink(lines.join("\n"));
    const win = window.open(url, "_blank", "noopener");
    if (!win) window.location.href = url; // popup blocked: open in this tab instead
  };

  /* ---- Related products ----------------------------------------------------------------- */
  const score = (o) => (o.category === p.category ? 2 : 0) + (o.collection === p.collection ? 1 : 0) + (o.gender === p.gender ? 0.5 : 0);
  const related = PRODUCTS.filter((o) => o.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 4);
  if (related.length) {
    $("related-grid").innerHTML = related.map((o) => productCard(o)).join("");
    $("related-section").classList.remove("hidden");
  }

  syncOptions();
  updatePreviewNote();
  AC.reveal();
  AC.icons();
});
