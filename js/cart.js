/* =============================================================================
   ANONYMOUS COLLECTIVES — cart.js  (the shopping bag)
   Loaded on every page after main.js.

   - The bag lives in the visitor's browser (localStorage key "ac:cart"), so it survives
     page changes and refreshes.
   - Each bag line is one VARIANT: product + colour + size. Only ids and choices are stored;
     names, photos and prices are looked up from products.js each time, so a price change
     in the PRICE LIST updates the bag too.
   - Checkout = the same WhatsApp ordering the site already uses: the whole bag becomes one
     pre-written message to the Anonymous Collectives WhatsApp number. There is no online
     payment on this site.
============================================================================= */
const CART = (() => {
  const KEY = "ac:cart";
  const { esc, img, formatPrice, priceInfo, findProduct, productUrl, waLink, sizeName } = AC;

  /* ---- Storage -------------------------------------------------------------- */
  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(raw) ? raw.filter((i) => i && i.id && i.qty > 0) : [];
    } catch (e) { return []; }
  };
  let items = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ } };

  const keyOf = (i) => [i.id, i.colour || "", i.size || ""].join("|");

  /* ---- Bag lines resolved against the catalogue --------------------------------- */
  const lines = () =>
    items
      .map((i) => {
        const product = findProduct(i.id);
        if (!product) return null;                         // product was removed from products.js
        const info = priceInfo(product);
        const colour = product.colours.find((c) => c.name === i.colour);
        return {
          key: keyOf(i), item: i, product, info,
          image: (colour && colour.image) || product.images[0],
          lineTotal: info.current * i.qty,
        };
      })
      .filter(Boolean);

  const count = () => lines().reduce((n, l) => n + l.item.qty, 0);
  const total = () => lines().reduce((n, l) => n + l.lineTotal, 0);

  /* ---- Changing the bag ------------------------------------------------------------ */
  const add = ({ id, colour = "", size = "", qty = 1 }) => {
    const incoming = { id, colour, size, qty: Math.max(1, Math.min(99, qty)) };
    const existing = items.find((i) => keyOf(i) === keyOf(incoming));
    if (existing) existing.qty = Math.min(99, existing.qty + incoming.qty);
    else items.push(incoming);
    save(); render();
  };
  const setQty = (key, qty) => {
    const it = items.find((i) => keyOf(i) === key);
    if (!it) return;
    if (qty < 1) return remove(key);
    it.qty = Math.min(99, qty);
    save(); render();
  };
  const remove = (key) => { items = items.filter((i) => keyOf(i) !== key); save(); render(); };
  const clear = () => { items = []; save(); render(); };

  /* ---- WhatsApp checkout message -------------------------------------------------------- */
  const orderMessage = () => {
    const out = ["Hello Anonymous Collectives, I would like to order:", ""];
    lines().forEach((l, n) => {
      out.push(`${n + 1}. ${l.product.name}`);
      if (l.item.colour) out.push(`   Colour: ${l.item.colour}`);
      if (l.item.size) out.push(`   Size: ${sizeName(l.item.size)}`);
      out.push(`   Quantity: ${l.item.qty}`);
      out.push(`   Price: ${formatPrice(l.info.current)}${l.info.hasDiscount ? ` (discounted from ${formatPrice(l.info.original)})` : ""} each = ${formatPrice(l.lineTotal)}`);
      out.push("");
    });
    out.push(`Total: ${formatPrice(total())}`, "", "Please let me know how to proceed with my order.");
    return out.join("\n");
  };

  /* ---- Drawer UI --------------------------------------------------------------------------- */
  let overlay, drawer, opener;

  const buildDrawer = () => {
    overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.setAttribute("aria-hidden", "true");
    drawer = document.createElement("aside");
    drawer.id = "cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Shopping bag");
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = `
      <div class="flex items-center justify-between border-b border-ink/15 px-5 py-4">
        <h2 class="font-serif text-3xl">Your bag <span id="cart-title-count" class="text-base text-ink/60"></span></h2>
        <button type="button" data-cart-close class="grid h-11 w-11 place-items-center" aria-label="Close bag"><i data-lucide="x" class="h-6 w-6"></i></button>
      </div>
      <div id="cart-body" class="flex-1 overflow-y-auto px-5"></div>
      <div id="cart-footer" class="border-t border-ink/15 bg-sand px-5 py-5"></div>`;
    document.body.append(overlay, drawer);
    const toast = document.createElement("div");
    toast.id = "toast"; toast.className = "toast"; toast.setAttribute("role", "status");
    document.body.append(toast);
  };

  const open = () => {
    opener = document.activeElement;
    render();
    overlay.classList.add("is-open"); drawer.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false"); drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    setTimeout(() => drawer.querySelector("[data-cart-close]").focus(), 60);
  };
  const close = () => {
    overlay.classList.remove("is-open"); drawer.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true"); drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (opener && opener.focus) opener.focus();
  };
  const isOpen = () => drawer && drawer.classList.contains("is-open");

  const toast = (text) => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = text; t.classList.add("is-on");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("is-on"), 2200);
  };

  const render = () => {
    // Header badge
    const n = count();
    const badge = document.getElementById("cart-count");
    if (badge) { badge.textContent = n > 99 ? "99+" : n; badge.hidden = n === 0; }
    const btn = document.getElementById("open-cart");
    if (btn) btn.setAttribute("aria-label", n ? `Open shopping bag, ${n} ${n === 1 ? "item" : "items"}` : "Open shopping bag");
    if (!drawer) return;

    const ls = lines();
    document.getElementById("cart-title-count").textContent = n ? `(${n})` : "";
    const body = document.getElementById("cart-body");
    const footer = document.getElementById("cart-footer");

    if (!ls.length) {
      body.innerHTML = `
        <div class="py-16 text-center">
          <p class="font-serif text-3xl">Your bag is empty.</p>
          <p class="mt-3 text-ink/70">Pick a colour and a size and it will appear here.</p>
          <a href="shop.html" class="btn btn-dark mt-8" data-cart-close>Start shopping</a>
        </div>`;
      footer.innerHTML = "";
      footer.hidden = true;
      AC.icons();
      return;
    }

    footer.hidden = false;
    body.innerHTML = `<ul class="divide-y divide-ink/10">${ls.map((l) => `
      <li class="flex gap-4 py-5" data-line="${esc(l.key)}">
        <a href="${productUrl(l.product.id)}" class="img-frame block h-28 w-24 shrink-0">${img(l.image, l.product.name)}</a>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex items-start justify-between gap-2">
            <a href="${productUrl(l.product.id)}" class="font-serif text-xl leading-tight">${esc(l.product.name)}</a>
            <button type="button" data-remove="${esc(l.key)}" class="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center text-ink/70 hover:text-ink" aria-label="Remove ${esc(l.product.name)} from bag"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
          </div>
          <p class="mt-1 text-sm text-ink/70">${[l.item.colour && `Colour: ${esc(l.item.colour)}`, l.item.size && `Size: ${esc(l.item.size)}`].filter(Boolean).join(" · ")}</p>
          <p class="mt-1 text-sm">${l.info.hasDiscount ? `<span class="text-ink/50 line-through">${formatPrice(l.info.original)}</span> ` : ""}<span class="font-semibold">${formatPrice(l.info.current)}</span></p>
          <div class="mt-auto flex items-center justify-between pt-3">
            <div class="inline-flex items-center border border-ink/30" role="group" aria-label="Quantity for ${esc(l.product.name)}">
              <button type="button" class="qty-btn" data-dec="${esc(l.key)}" aria-label="Decrease quantity"><i data-lucide="minus" class="h-4 w-4"></i></button>
              <span class="grid h-9 w-9 place-items-center text-sm font-medium" aria-live="polite">${l.item.qty}</span>
              <button type="button" class="qty-btn" data-inc="${esc(l.key)}" aria-label="Increase quantity"><i data-lucide="plus" class="h-4 w-4"></i></button>
            </div>
            <p class="text-sm font-semibold">${formatPrice(l.lineTotal)}</p>
          </div>
        </div>
      </li>`).join("")}</ul>`;

    footer.innerHTML = `
      <div class="flex items-baseline justify-between"><span class="text-sm">Total</span><span class="font-serif text-3xl">${formatPrice(total())}</span></div>
      <p class="mt-2 text-xs text-ink/60">Checkout sends your bag to us on WhatsApp. We confirm the order, delivery and payment with you there.</p>
      <button type="button" data-checkout class="btn btn-dark mt-4 w-full"><i data-lucide="message-circle" class="h-4 w-4"></i> Checkout on WhatsApp</button>
      <button type="button" data-cart-close class="btn btn-light mt-3 w-full">Continue shopping</button>
      <button type="button" data-clear class="link-line mx-auto mt-4 block text-xs text-ink/70">Clear bag</button>`;
    AC.icons();
  };

  const checkout = () => {
    if (!lines().length) return;
    const url = waLink(orderMessage());
    const win = window.open(url, "_blank", "noopener");
    if (!win) window.location.href = url;     // pop-up blocked: open in this tab
  };

  /* ---- Events ------------------------------------------------------------------------------- */
  const init = () => {
    buildDrawer();
    render();
    document.addEventListener("click", (e) => {
      if (e.target.closest("#open-cart")) return open();
      if (e.target.closest("[data-cart-close]") || e.target === overlay) return isOpen() && close();
      if (!drawer.contains(e.target)) return;
      const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rm = e.target.closest("[data-remove]");
      if (inc) { const l = lines().find((x) => x.key === inc.dataset.inc); if (l) setQty(l.key, l.item.qty + 1); }
      else if (dec) { const l = lines().find((x) => x.key === dec.dataset.dec); if (l) setQty(l.key, l.item.qty - 1); }
      else if (rm) remove(rm.dataset.remove);
      else if (e.target.closest("[data-checkout]")) checkout();
      else if (e.target.closest("[data-clear]")) clear();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
      if (e.key === "Tab" && isOpen()) {                      // keep keyboard focus inside the bag
        const f = [...drawer.querySelectorAll("button, a[href]")].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener("storage", (e) => { if (e.key === KEY) { items = load(); render(); } });   // other tab changed the bag
  };

  document.addEventListener("DOMContentLoaded", init);

  return { add, setQty, remove, clear, count, total, lines, open, close, toast, orderMessage, checkout };
})();
