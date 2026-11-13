/* =============================================================================
   ANONYMOUS COLLECTIVES — manage.js
   Powers manage.html: a price-list writer and a product-photo checker.
   It never changes the website's files; it produces text for you to paste.
============================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const { esc, formatPrice } = AC;

  /* ---- Prices ----------------------------------------------------------------------- */
  const rows = $("price-rows");
  const build = () => {
    rows.innerHTML = PRODUCTS.map((p) => `
      <tr class="border-b border-ink/10" data-id="${esc(p.id)}">
        <td class="py-3 pr-3"><span class="font-medium">${esc(p.name)}</span><br><span class="text-xs text-ink/60">${esc(p.id)}</span></td>
        <td class="py-3 pr-3"><label class="sr-only" for="old-${esc(p.id)}">Old price for ${esc(p.name)}</label><input id="old-${esc(p.id)}" type="number" min="0" step="100" inputmode="numeric" class="input w-36" value="${p.originalPrice || ""}" data-field="old"></td>
        <td class="py-3 pr-3"><label class="sr-only" for="sale-${esc(p.id)}">Sale price for ${esc(p.name)}</label><input id="sale-${esc(p.id)}" type="number" min="0" step="100" inputmode="numeric" class="input w-36" value="${p.discountPrice || ""}" placeholder="no sale" data-field="sale"></td>
        <td class="py-3 text-sm" data-preview></td>
      </tr>`).join("");
    update();
  };

  const read = () => PRODUCTS.map((p) => {
    const tr = rows.querySelector(`[data-id="${p.id}"]`);
    const old = Number(tr.querySelector('[data-field="old"]').value) || 0;
    const sale = Number(tr.querySelector('[data-field="sale"]').value) || 0;
    return { p, tr, old, sale, onSale: sale > 0 && sale < old, bad: sale > 0 && sale >= old };
  });

  const update = () => {
    const data = read();
    data.forEach(({ tr, old, sale, onSale, bad }) => {
      const cell = tr.querySelector("[data-preview]");
      if (!old) cell.innerHTML = `<span class="msg-err">Enter the old price</span>`;
      else if (bad) cell.innerHTML = `<span class="msg-err">Sale price must be lower than the old price</span>`;
      else if (onSale) cell.innerHTML = `<span class="text-ink/50 line-through">${formatPrice(old)}</span> <strong>${formatPrice(sale)}</strong> <span class="text-ink/60">(-${Math.round((1 - sale / old) * 100)}%)</span>`;
      else cell.innerHTML = `<strong>${formatPrice(old)}</strong>`;
    });
    const lines = data.map(({ p, old, sale, onSale }) =>
      `  "${p.id}": { old: ${old || 0}, sale: ${onSale ? sale : "null"} },   // ${p.name}`);
    $("price-output").value = `const PRICE_LIST = {\n${lines.join("\n")}\n};`;
  };

  rows.addEventListener("input", update);
  $("reset-prices").addEventListener("click", build);
  $("copy-prices").addEventListener("click", async () => {
    const st = $("copy-status"), box = $("price-output");
    try { await navigator.clipboard.writeText(box.value); }
    catch (e) { box.select(); document.execCommand && document.execCommand("copy"); }
    st.textContent = "Copied. Now paste it over PRICE_LIST in js/products.js.";
    st.className = "text-sm msg-ok";
  });

  /* ---- Photo checker ------------------------------------------------------------------ */
  const check = (src) => new Promise((resolve) => {
    const i = new Image();
    i.onload = () => resolve(true);
    i.onerror = () => resolve(false);
    i.src = src + (src.includes("?") ? "&" : "?") + "check=" + Date.now();
  });

  (async () => {
    let found = 0, missing = 0;
    const html = [];
    for (const p of PRODUCTS) {
      const paths = [...new Set([...p.images, ...p.colours.map((c) => c.image).filter(Boolean)])];
      const results = await Promise.all(paths.map(async (src) => ({ src, ok: await check(src) })));
      results.forEach((r) => (r.ok ? found++ : missing++));
      html.push(`
        <div>
          <h3 class="font-serif text-2xl">${esc(p.name)} <span class="text-sm text-ink/60">${esc(p.id)}</span></h3>
          <ul class="mt-3 grid gap-3 sm:grid-cols-2">${results.map((r) => `
            <li class="flex items-center gap-3 border border-ink/15 p-3">
              <span class="img-frame block h-16 w-14 shrink-0">${r.ok ? `<img src="${esc(r.src)}" alt="" loading="lazy">` : ""}</span>
              <span class="min-w-0 text-xs"><span class="block break-all">${esc(r.src)}</span>
                <span class="mt-1 block font-semibold ${r.ok ? "msg-ok" : "msg-err"}">${r.ok ? "Found" : "Missing: save the photo with this exact name"}</span></span>
            </li>`).join("")}</ul>
        </div>`);
    }
    $("img-list").innerHTML = html.join("");
    $("img-summary").textContent = `${found} photos found, ${missing} still to add.`;
  })();

  build();
});
