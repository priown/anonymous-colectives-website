/* =============================================================================
   ANONYMOUS COLLECTIVES — main.js
   Shared on every page: header, footer, mobile menu, search, price helpers,
   product cards, fade-in on scroll and the newsletter form.
   Requires products.js to be loaded first.
============================================================================= */

/* ---- Image fallbacks (global so inline onerror attributes can reach them) -- */
window.acImgFallback = function (img) {
  img.onerror = null;
  img.src = "assets/products/placeholder.svg";
  img.dataset.placeholder = "true";
  // Sections that must only show real mockups (e.g. Featured Collection) drop the card entirely.
  const hide = img.closest("[data-hide-if-missing]");
  if (hide) { hide.remove(); return; }
  // Everywhere else the card/gallery stays and shows its "Mockup coming soon" tag.
  const host = img.closest("[data-product-id], [data-needs-image], .gallery-main");
  if (host) host.dataset.missing = "true";
};
window.acLogoFallback = function (img) {
  // If a logo file is ever missing, show the brand name as text (keeps the theme classes).
  const span = document.createElement("span");
  span.className = img.className.replace(/\bh-\S+|\bw-auto/g, "") + " wordmark text-xl";
  span.textContent = "Anonymous Collectives";
  img.replaceWith(span);
};

const AC = (() => {
  /* ---- Small helpers ------------------------------------------------------ */
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const formatPrice = (n) =>
    new Intl.NumberFormat(SITE.locale, {
      style: "currency",
      currency: SITE.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  /** Works out pricing for a product. Discounts are optional. */
  const priceInfo = (p) => {
    const original = Number(p.originalPrice) || 0;
    const discount = Number(p.discountPrice) || 0;
    const hasDiscount = discount > 0 && discount < original;
    return {
      original,
      current: hasDiscount ? discount : original,
      hasDiscount,
      percent: hasDiscount ? Math.round((1 - discount / original) * 100) : 0,
    };
  };

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const SIZE_NAMES = { XS: "Extra Small", S: "Small", M: "Medium", L: "Large", XL: "Extra Large", XXL: "Double Extra Large" };
  const sizeName = (s) => SIZE_NAMES[s] || s;
  const productUrl = (id) => `product.html?id=${encodeURIComponent(id)}`;
  const shopUrl = (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `shop.html${q ? "?" + q : ""}`;
  };
  const waLink = (message) =>
    `https://wa.me/${SITE.whatsappNumber}${message ? "?text=" + encodeURIComponent(message) : ""}`;

  const img = (src, alt, cls = "", extra = "") =>
    `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" ${extra} onerror="acImgFallback(this)">`;

  /** Search across name, category, collection, gender, colours and description. */
  const searchProducts = (query) => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return PRODUCTS.slice();
    return PRODUCTS.filter((p) => {
      const hay = [p.name, p.category, p.collection, p.gender, p.description, ...p.colours.map((c) => c.name)]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  };

  const social = (kind, cls = "") => {
    const s = SITE.social[kind];
    const label = kind === "tiktok" ? "TikTok" : "Instagram";
    // Only show a social link when a real URL has been supplied.
    return s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="${cls}">${label}</a>` : "";
  };

  /* ---- Product card -------------------------------------------------------
     variant "clean"     -> standard product photography card
     variant "editorial" -> taller image, larger serif caption                  */
  const productCard = (p, opts = {}) => {
    const variant = opts.variant || "clean";
    const info = priceInfo(p);
    const ratio = variant === "editorial" ? "aspect-[3/4]" : "aspect-[4/5]";
    const badges = [];
    badges.push(`<span class="badge badge-out soon-badge">Mockup coming soon</span>`);   // shows only if the photo file is missing
    if (!p.available) badges.push(`<span class="badge badge-out">Sold out</span>`);
    if (info.hasDiscount) badges.push(`<span class="badge badge-sale">Sale -${info.percent}%</span>`);
    if (p.isNewArrival) badges.push(`<span class="badge badge-new">New</span>`);
    if (p.isBestSeller) badges.push(`<span class="badge badge-best">Best Seller</span>`);

    const alt =
      p.images[1] && variant !== "editorial"
        ? `<img src="${esc(p.images[1])}" alt="" class="card-alt-img" loading="lazy" onerror="this.remove()">`
        : "";

    const dots = p.colours
      .slice(0, 5)
      .map((c) => `<span class="swatch-dot" style="background:${esc(c.hex)}" title="${esc(c.name)}"></span>`)
      .join("");
    const moreDots = p.colours.length > 5 ? `<span class="text-xs text-ink/60">+${p.colours.length - 5}</span>` : "";

    const price = info.current <= 0
      ? `<span class="font-semibold">Price on request</span>`
      : info.hasDiscount
      ? `<span class="text-ink/50 line-through">${formatPrice(info.original)}</span>
         <span class="font-semibold">${formatPrice(info.current)}</span>`
      : `<span class="font-semibold">${formatPrice(info.current)}</span>`;

    return `
      <a href="${productUrl(p.id)}" class="product-card zoom ${p.available ? "" : "opacity-90"}" data-product-id="${esc(p.id)}">
        <div class="img-frame relative ${ratio}">
          ${img(p.images[0], p.name, "", 'loading="lazy"')}
          ${alt}
          <div class="absolute left-3 top-3 flex flex-col items-start gap-1.5">${badges.join("")}</div>
        </div>
        <div class="pt-4">
          <p class="text-xs text-ink/60">${esc(p.category)}</p>
          <h3 class="${variant === "editorial" ? "font-serif text-2xl lg:text-3xl" : "font-serif text-xl lg:text-2xl"} leading-tight mt-1">${esc(p.name)}</h3>
          <div class="mt-2 flex items-center gap-1.5 min-h-[1rem]">${dots}${moreDots}</div>
          <p class="mt-2 flex flex-wrap items-center gap-x-2 text-sm">${price}</p>
          <p class="mt-1 text-xs text-ink/60">${p.sizes.length ? esc(p.sizes.join(" · ")) : ""}</p>
          <span class="link-line mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em]">View product</span>
        </div>
      </a>`;
  };

  /* ---- Header -------------------------------------------------------------- */
  const NAV = [
    { label: "Home", href: "index.html", page: "home" },
    { label: "Shop", href: "shop.html", page: "shop" },
    { label: "Collections", href: "shop.html#collections", page: "collections" },
    { label: "About Us", href: "about.html", page: "about" },
    { label: "Contact", href: "contact.html", page: "contact" },
  ];

  // Two copies of the official logo; CSS shows the right one for the current theme.
  const logoMarkup = (cls = "h-9") =>
    `<img src="${esc(SITE.logoCharcoal)}" alt="" class="logo-charcoal ${cls} w-auto" onerror="acLogoFallback(this)">` +
    `<img src="${esc(SITE.logoIvory)}" alt="" class="logo-ivory ${cls} w-auto" onerror="acLogoFallback(this)">`;

  const renderHeader = () => {
    const mount = document.getElementById("site-header-mount");
    if (!mount) return;
    const page = document.body.dataset.page;
    const current = page === "product" ? "shop" : page;
    const link = (n, cls) =>
      `<a href="${n.href}" class="${cls}" ${n.page === current ? 'aria-current="page"' : ""}>${n.label}</a>`;

    mount.innerHTML = `
      <header id="site-header" class="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div class="mx-auto grid h-16 max-w-[90rem] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 lg:h-20 lg:px-10">
          <a href="index.html" aria-label="Anonymous Collectives, home" class="flex items-center">${logoMarkup("h-12 lg:h-16")}</a>
          <nav class="hidden justify-center gap-10 lg:flex" aria-label="Primary">
            ${NAV.map((n) => link(n, "nav-link")).join("")}
          </nav>
          <div class="col-start-3 flex items-center justify-end gap-1">
            <button type="button" id="open-search" class="grid h-11 w-11 place-items-center" aria-label="Search products">
              <i data-lucide="search" class="h-5 w-5"></i>
            </button>
            <button type="button" id="theme-toggle" class="grid h-11 w-11 place-items-center" aria-label="Switch to dark mode" aria-pressed="false">
              <i data-lucide="moon" class="icon-moon h-5 w-5"></i><i data-lucide="sun" class="icon-sun h-5 w-5"></i>
            </button>
            <button type="button" id="open-cart" class="relative grid h-11 w-11 place-items-center" aria-label="Open shopping bag" aria-haspopup="dialog">
              <i data-lucide="shopping-bag" class="h-5 w-5"></i><span id="cart-count" class="cart-badge" hidden>0</span>
            </button>
            <a href="${waLink("Hello Anonymous Collectives!")}" target="_blank" rel="noopener noreferrer"
               class="hidden h-11 w-11 place-items-center sm:grid" aria-label="Chat with us on WhatsApp">
              <i data-lucide="message-circle" class="h-5 w-5"></i>
            </a>
            <button type="button" id="menu-toggle" class="grid h-11 w-11 place-items-center lg:hidden"
               aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
              <i data-lucide="menu" class="h-6 w-6"></i>
            </button>
          </div>
        </div>
        <div id="mobile-menu" class="absolute inset-x-0 top-full h-[calc(100svh-4rem)] overflow-y-auto bg-cream lg:hidden" aria-hidden="true">
          <nav class="flex flex-col px-6 pt-6" aria-label="Mobile">
            ${NAV.map((n) => link(n, "border-b border-ink/10 py-5 font-serif text-4xl")).join("")}
          </nav>
          <div class="px-6 pb-10 pt-8 text-sm">
            <a href="${waLink("Hello Anonymous Collectives!")}" target="_blank" rel="noopener noreferrer" class="btn btn-dark w-full">Chat on WhatsApp</a>
            <p class="mt-6 flex gap-6">${social("tiktok", "link-line")}${social("instagram", "link-line")}</p>
          </div>
        </div>
      </header>

      <div id="search-overlay" class="fixed inset-0 z-[60] overflow-y-auto bg-cream" role="dialog" aria-modal="true" aria-label="Search products" aria-hidden="true">
        <div class="mx-auto max-w-3xl px-5 pb-16 pt-6 lg:pt-12">
          <div class="flex items-center justify-end">
            <button type="button" id="close-search" class="grid h-11 w-11 place-items-center" aria-label="Close search">
              <i data-lucide="x" class="h-6 w-6"></i>
            </button>
          </div>
          <form id="search-form" role="search" class="mt-2 border-b border-ink">
            <label for="search-input" class="sr-only">Search products</label>
            <input id="search-input" type="search" autocomplete="off" placeholder="Search tees, caps, tanks..."
              class="w-full bg-transparent py-4 font-serif text-3xl outline-none placeholder:text-ink/40 lg:text-5xl">
          </form>
          <p id="search-hint" class="mt-4 text-sm text-ink/60">Type to search, or press Enter to see every result in the shop.</p>
          <ul id="search-results" class="mt-6 divide-y divide-ink/10" aria-live="polite"></ul>
        </div>
      </div>`;
  };

  /* ---- Footer -------------------------------------------------------------- */
  const renderFooter = () => {
    const mount = document.getElementById("site-footer-mount");
    if (!mount) return;
    const tiktok = social("tiktok", "link-line");
    const instagram = social("instagram", "link-line");
    mount.innerHTML = `
      <footer class="border-t border-ink/15 bg-sand">
        <div class="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.1fr_1.5fr] lg:px-10">
          <div>
            <a href="index.html" aria-label="Anonymous Collectives, home" class="inline-block">${logoMarkup("h-24")}</a>
            <p class="mt-5 font-serif text-2xl">${esc(SITE.tagline)}</p>
          </div>
          <div>
            <h2 class="text-sm font-semibold">Explore</h2>
            <ul class="mt-4 space-y-3 text-sm">
              ${NAV.map((n) => `<li><a href="${n.href}" class="link-line">${n.label}</a></li>`).join("")}
            </ul>
          </div>
          <div>
            <h2 class="text-sm font-semibold">Talk to us</h2>
            <ul class="mt-4 space-y-3 text-sm">
              <li><a href="${waLink("Hello Anonymous Collectives!")}" target="_blank" rel="noopener noreferrer" class="link-line">WhatsApp ${esc(SITE.whatsappDisplay)}</a></li>
              ${tiktok ? `<li>${tiktok}</li>` : ""}
              ${instagram ? `<li>${instagram}</li>` : ""}
            </ul>
          </div>
          <div>
            <h2 class="text-sm font-semibold">Stay in the loop</h2>
            <p class="mt-4 text-sm text-ink/70">New collections and releases, straight to your inbox.</p>
            <form data-newsletter class="mt-4">
              <div class="flex gap-2">
                <label for="footer-email" class="sr-only">Email address</label>
                <input id="footer-email" type="email" autocomplete="email" placeholder="Your email" class="input flex-1 bg-cream">
                <button type="submit" class="btn btn-dark px-5">Join</button>
              </div>
              <p data-status role="status" class="mt-3 text-sm"></p>
            </form>
          </div>
        </div>
        <div class="border-t border-ink/15">
          <p class="mx-auto max-w-[90rem] px-5 py-6 text-xs text-ink/70 lg:px-10">&copy; ${new Date().getFullYear()} Anonymous Collectives. All rights reserved.</p>
        </div>
      </footer>`;
  };

  /* ---- Mobile menu --------------------------------------------------------- */
  const initMenu = () => {
    const btn = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");
    if (!btn || !menu) return;
    const set = (open) => {
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      btn.innerHTML = `<i data-lucide="${open ? "x" : "menu"}" class="h-6 w-6"></i>`;
      document.body.classList.toggle("no-scroll", open);
      icons();
    };
    btn.addEventListener("click", () => set(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && menu.classList.contains("is-open") && (set(false), btn.focus()));
    if (window.matchMedia) window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => e.matches && set(false));
  };

  /* ---- Search overlay ------------------------------------------------------ */
  const initSearch = () => {
    const overlay = document.getElementById("search-overlay");
    const openBtn = document.getElementById("open-search");
    const closeBtn = document.getElementById("close-search");
    const input = document.getElementById("search-input");
    const form = document.getElementById("search-form");
    const list = document.getElementById("search-results");
    const hint = document.getElementById("search-hint");
    if (!overlay || !openBtn) return;

    const open = () => {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      setTimeout(() => input.focus(), 50);
    };
    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      openBtn.focus();
    };

    const render = () => {
      const q = input.value.trim();
      if (!q) {
        list.innerHTML = "";
        hint.textContent = "Type to search, or press Enter to see every result in the shop.";
        return;
      }
      const results = searchProducts(q);
      hint.textContent = results.length
        ? `${results.length} ${results.length === 1 ? "result" : "results"}. Press Enter to open them in the shop.`
        : `Nothing matches "${q}". Try a category like tee, cap or tank.`;
      list.innerHTML = results
        .slice(0, 6)
        .map((p) => {
          const info = priceInfo(p);
          return `<li><a href="${productUrl(p.id)}" class="flex items-center gap-4 py-4">
            <span class="img-frame block h-20 w-16 shrink-0">${img(p.images[0], "", "", 'loading="lazy"')}</span>
            <span class="min-w-0 flex-1">
              <span class="block font-serif text-xl leading-tight">${esc(p.name)}</span>
              <span class="block text-xs text-ink/60">${esc(p.category)}</span>
            </span>
            <span class="text-sm font-semibold">${formatPrice(info.current)}</span>
          </a></li>`;
        })
        .join("");
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    input.addEventListener("input", render);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? shopUrl({ q }) : shopUrl();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && overlay.classList.contains("is-open") && close());
  };

  /* ---- Sticky header that tucks away when scrolling down ------------------- */
  const initHeaderScroll = () => {
    const header = document.getElementById("site-header");
    if (!header) return;
    let last = window.scrollY;
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const menuOpen = document.body.classList.contains("no-scroll");
          if (!menuOpen) header.classList.toggle("is-hidden", y > last && y > 160);
          last = y;
          ticking = false;
        });
      },
      { passive: true }
    );
  };

  /* ---- Fade in on scroll --------------------------------------------------- */
  let observer = null;
  const reveal = (root = document) => {
    const items = root.querySelectorAll("[data-reveal]:not([data-reveal-bound])");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    observer =
      observer ||
      new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              observer.unobserve(en.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
    items.forEach((el) => {
      el.setAttribute("data-reveal-bound", "");
      observer.observe(el);
    });
  };

  const icons = () => window.lucide && window.lucide.createIcons();

  /* ---- Newsletter ----------------------------------------------------------
     No email service is connected, so by default nothing is stored and the form
     says so. To connect one, set SITE.newsletter.endpoint in products.js
     (see README: "Newsletter"). Any service that accepts a JSON POST with
     { email } works, e.g. Formspree, Buttondown, or your own serverless function. */
  const initNewsletter = (form) => {
    const input = form.querySelector('input[type="email"]');
    const status = form.querySelector("[data-status]");
    const button = form.querySelector("button[type='submit']");
    const show = (text, cls) => {
      status.textContent = text;
      status.className = `mt-3 text-sm ${cls}`;
    };
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      input.classList.remove("field-error");
      if (!email) {
        input.classList.add("field-error");
        return show("Enter your email address.", "msg-err");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.classList.add("field-error");
        return show("That email doesn't look right. Check it and try again.", "msg-err");
      }
      if (!SITE.newsletter.endpoint) {
        return show(
          "Sign-ups aren't switched on yet, so your email has not been saved. Follow us on TikTok for updates in the meantime.",
          "msg-info"
        );
      }
      button.disabled = true;
      show("Subscribing...", "msg-info");
      try {
        const res = await fetch(SITE.newsletter.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("Bad response");
        form.reset();
        show("You're on the list. We'll be in touch when something new drops.", "msg-ok");
      } catch (err) {
        show("Something went wrong and your email was not saved. Please try again in a moment.", "msg-err");
      } finally {
        button.disabled = false;
      }
    });
  };

  /* ---- Light / dark theme ---------------------------------------------------
     theme.js (in <head>) already applied the saved/device theme before first paint.
     This wires up the toggle, remembers the choice, and keeps the label in sync. */
  const applyThemeUi = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#111111" : "#F5F3EF");
  };
  const setTheme = (theme, save) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");               // enables the smooth colour transition
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (save) { try { localStorage.setItem("ac:theme", theme); } catch (e) { /* storage blocked */ } }
    applyThemeUi();
    setTimeout(() => root.classList.remove("theme-switching"), 600);
  };
  const initTheme = () => {
    applyThemeUi();
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark", true));
    // Follow the device setting live, but only until the visitor picks a theme themselves.
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e) => {
        let saved = null;
        try { saved = localStorage.getItem("ac:theme"); } catch (err) { /* ignore */ }
        if (!saved) setTheme(e.matches ? "dark" : "light", false);
      };
      mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener && mq.addListener(onChange);
    }
  };

  /* ---- Catalogue helpers -------------------------------------------------- */
  /** Photo for a collection card: its first product's main photo. */
  const collectionImage = (c) => {
    const p = PRODUCTS.find((x) => x.collection === c.name);
    return p ? p.images[0] : null;
  };

  /* ---- Boot ---------------------------------------------------------------- */
  const init = () => {
    renderHeader();
    renderFooter();
    initTheme();
    initMenu();
    initSearch();
    initHeaderScroll();
    document.querySelectorAll("form[data-newsletter]").forEach(initNewsletter);
    document.documentElement.classList.add("reveal-ready");
    reveal();
    icons();
  };

  return {
    esc, formatPrice, priceInfo, findProduct, productUrl, shopUrl, waLink, img,
    searchProducts, social, productCard, reveal, icons, init, collectionImage, sizeName,
  };
})();

document.addEventListener("DOMContentLoaded", AC.init);
