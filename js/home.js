/* =============================================================================
   ANONYMOUS COLLECTIVES — home.js
   Fills the home page from the data in products.js.
============================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const { esc, img, productCard, productUrl, shopUrl, priceInfo, formatPrice } = AC;

  /* Banners: images and descriptions come from BANNERS in products.js */
  $("hero-img").src = BANNERS.hero.image;
  $("hero-img").alt = BANNERS.hero.alt;
  $("campaign-img").src = BANNERS.campaign.image;
  $("campaign-img").alt = BANNERS.campaign.alt;

  /* Marquee: the same group twice, so the loop is seamless (the second copy is hidden from screen readers) */
  const PHRASES = ["Anonymous Collectives", "Stay low, stand out", "Streetwear without limits", "Anonymous Collectives"];
  const star = '<svg class="marquee-star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>';
  const group = PHRASES.map((t) => `<span class="marquee-item">${esc(t)}</span>${star}`).join("");
  $("marquee-a").innerHTML = group;
  $("marquee-b").innerHTML = group;

  /* Featured collection: featured products. A card whose photo file is missing removes itself,
     so only real product mockups are ever shown here. */
  const featured = PRODUCTS.filter((p) => p.isFeatured).slice(0, 8);
  $("featured-grid").innerHTML = featured.length
    ? featured.map((p) => `<div data-reveal data-hide-if-missing>${productCard(p)}</div>`).join("")
    : `<p class="col-span-full text-ink/70">New pieces are on the way.</p>`;

  /* Shop by category: each card links to that category in the shop */
  $("category-grid").innerHTML = CATEGORIES.map((c) => {
    const count = PRODUCTS.filter((p) => p.category === c.name).length;
    return `
      <a href="${shopUrl({ category: c.name })}" class="zoom block" data-reveal data-needs-image>
        <div class="img-frame relative aspect-[4/5]">
          ${img(c.image, `${c.name} by Anonymous Collectives`, "", 'loading="lazy"')}
          <span class="badge badge-out soon-badge absolute left-3 top-3">Mockup coming soon</span>
        </div>
        <div class="mt-3 flex items-baseline justify-between gap-2">
          <h3 class="font-serif text-2xl lg:text-3xl">${esc(c.name)}</h3>
          <span class="text-xs text-ink/60">${count} ${count === 1 ? "piece" : "pieces"}</span>
        </div>
      </a>`;
  }).join("");

  /* Lookbook: magazine-style grid ------------------------------------------- */
  const layout = [
    "md:col-span-7",
    "md:col-span-5 md:mt-28",
    "md:col-span-4",
    "md:col-span-4 md:mt-20",
    "md:col-span-4 md:mt-40",
  ];
  $("lookbook-grid").innerHTML = CAMPAIGNS.map((c, i) => `
    <figure class="${layout[i % layout.length]}" data-reveal>
      <button type="button" class="zoom block w-full text-left" data-campaign="${esc(c.id)}" aria-label="${esc(c.title)}: see the products in this photo">
        <div class="img-frame ${i === 0 ? "aspect-[4/5]" : "aspect-[3/4]"}">${img(c.image, c.alt, "", 'loading="lazy"')}</div>
      </button>
      <figcaption class="mt-4">
        <p class="font-serif text-2xl lg:text-3xl">${esc(c.title)}</p>
        <p class="mt-1 max-w-sm text-sm text-ink/70">${esc(c.text)}</p>
      </figcaption>
    </figure>`).join("");

  const dlg = $("lookbook-dialog");
  const openCampaign = (id) => {
    const c = CAMPAIGNS.find((x) => x.id === id);
    if (!c) return;
    const lbImg = $("lb-img");
    lbImg.onerror = () => acImgFallback(lbImg);
    lbImg.src = c.image;
    lbImg.alt = c.alt;
    $("lb-title").textContent = c.title;
    $("lb-text").textContent = c.text;
    const items = (c.productIds || []).map(AC.findProduct).filter(Boolean);
    $("lb-products").innerHTML = items.length
      ? items.map((p) => {
          const info = priceInfo(p);
          return `<li><a href="${productUrl(p.id)}" class="flex items-center gap-4 py-3">
            <span class="img-frame block h-16 w-14 shrink-0">${img(p.images[0], "")}</span>
            <span class="flex-1 font-serif text-xl">${esc(p.name)}</span>
            <span class="text-sm font-semibold">${formatPrice(info.current)}</span>
          </a></li>`;
        }).join("")
      : `<li class="py-3 text-sm text-ink/70">Products from this shoot are coming soon.</li>`;
    dlg.showModal();
    AC.icons();
  };
  $("lookbook-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-campaign]");
    if (b) openCampaign(b.dataset.campaign);
  });
  $("lb-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => e.target === dlg && dlg.close()); // click backdrop


  AC.reveal();
  AC.icons();
});
