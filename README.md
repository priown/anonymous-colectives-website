# Anonymous Collectives website (v3)

Five public pages (Home, Shop, Product, About Us, Contact), a shopping bag, and a private helper page (`manage.html`). Built with HTML5, Tailwind CSS (CDN) and vanilla JavaScript. No backend and no build step, so it works on GitHub Pages.

**Checkout = WhatsApp.** There is no online payment on this site (and none existed before). Customers add pieces to the bag, press *Checkout on WhatsApp*, and the whole order opens as a ready-written message to **+234 703 759 3930**. You confirm delivery and payment with them there.

---

## 1. Run it

Open `index.html` in a browser, or use a local server:

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
# or, with Node:  npm start
```

No dependencies to install. You only need internet (Tailwind, fonts and icons load from CDNs). Python packages are only needed for the colour tool (section 6): `pip install -r tools/requirements.txt`.

## 2. Change your prices (old price and sale price)

Open **`js/products.js`**. The first thing in the file is the **PRICE LIST**:

```js
const PRICE_LIST = {
  "ac-001": { old: 12000, sale: null  },   // Male Tank Top      (not on sale)
  "ac-002": { old: 12000, sale: 10000 },   // Female Tank Top    (was 12,000, now 10,000)
  ...
};
```

- `old` = the normal price (shown crossed out when there is a sale).
- `sale` = what the customer pays now. Write `null` when there is no sale.
- Numbers only: no commas, no ₦. The "% off" is worked out automatically.
- The bag, cards, product pages and WhatsApp messages all follow these numbers.

**Prefer a form?** Open `manage.html` in your browser (it isn't linked from the site): type the old and sale prices, press *Copy price list*, then paste it over `PRICE_LIST` in `js/products.js`.

The prices in the project are sample prices.

## 3. Add new photos when they're ready (no code changes)

Every product already lists the exact file names it expects. Save a photo in that folder with that exact name and refresh: it appears on the shop, home page, product page and bag. Until then a "Mockup coming soon" tile shows, and the home page Featured Collection only shows products whose photo exists.

| Product | Save the photos as |
|---|---|
| Stay Low Tee | `assets/products/t-shirts/stay-low-tee-1.jpg` (grey), `stay-low-tee-2.jpg` (black) |
| Anonymous Tee | `assets/products/t-shirts/anonymous-tee-1.jpg` |
| Sleeveless Shirt | `assets/products/sleeveless/sleeveless-shirt-1.jpg` |
| Cap, Design 01 / 02 | `assets/products/caps/cap-01-1.jpg`, `cap-02-1.jpg` |

`manage.html` also lists every expected photo and tells you which are **Found** or **Missing**.

Tips: 4:5 portrait JPG, around 1200 to 1500 px tall, under about 250 KB. **Add more colours or photos** to a product by adding a file name to its `images` list and a colour line (below). **Add a whole product:** copy a product block in `PRODUCTS`, give it a new id, and add its prices to `PRICE_LIST`.

## 4. Colours: how the colour selector works

Each colour in `products.js` has its own image:

```js
{ name: "Pure White", hex: "#FFFFFF", image: "assets/products/male-tank/white.jpg", preview: true }
```

Clicking a swatch switches the product image to that file (no CSS filters anywhere), marks the swatch selected, and that exact colour + size goes into the bag and the WhatsApp message.

`preview: true` marks a digitally re-coloured image (see below). The product page labels those honestly. For a real photo, leave `preview` out.

## 5. Shopping bag

- Header bag icon with a live item count. Items are saved in the visitor's browser, so the bag survives refreshes and page changes.
- Each line is one variant (product + colour + size). Change quantities, remove items, clear the bag, or continue shopping.
- *Checkout on WhatsApp* sends the whole bag. The single-item *Order via WhatsApp* button on each product page still works too.

## 6. Making colour variants from a photo

`tools/make_colour_variants.py` recolours only the garment of an original photo (keeping model, pose, ribbing, shadows and logo placement) and writes one JPG per colour. Dark garments keep a white logo; the pure-white garment gets a black logo.

```bash
pip install -r tools/requirements.txt
python3 tools/make_colour_variants.py              # all products
python3 tools/make_colour_variants.py beanie       # one product
```

To add a colour, add its hex to `COLOURS` and the product's `targets`/`g` lines in `JOBS` (top of the tool), run it, then add the colour to the product in `products.js`. The untouched originals are in `assets/products/_source/`.

## 7. Dark and light mode

Dark is the default and primary experience. The moon/sun button in the header switches instantly with a smooth transition, and the choice is remembered across pages and visits (`localStorage` key `ac:theme`). `js/theme.js` runs in each page's `<head>` before anything is painted, so there is no flash. Keep that script tag in any new page. To follow the visitor's device setting on a first visit instead, change `DEFAULT_THEME` in `js/theme.js` as described in that file.

Palette (css/styles.css): #111111, #080808, #1C1C1C, #F5F3EF, #FFFFFF, #929292, #333333, accent #A83232.

## 8. Other things you can edit

- **Homepage banners:** `assets/banners/hero-main.jpg` and `campaign-second.jpg` (paths and descriptions in `BANNERS`).
- **AC Lookbook:** the model photos and captions in `CAMPAIGNS` (`assets/models/`). `productIds` decides which products appear when a photo is clicked. Model photos are used only here.
- **Marquee text:** `PHRASES` in `js/home.js`.
- **WhatsApp number, TikTok, Instagram:** `SITE` in `js/products.js`. Instagram stays hidden until you paste a real URL.
- **Newsletter:** the form validates and shows messages, but **no email service is connected, so nothing is saved**, and the form says so. To connect one, set `SITE.newsletter.endpoint` in `js/products.js` to a URL that accepts a JSON `POST` of `{ "email": "..." }` and replies 2xx (Formspree, Buttondown, or a small serverless function). Never put API secrets in the site files.

## 9. Project structure

```
index.html shop.html product.html about.html contact.html   public pages
manage.html                      private helper: price writer + photo checker
css/styles.css                   theme tokens, marquee, bag, components
js/products.js                   ** prices, products, colours, lookbook, settings **
js/theme.js  tailwind-config.js  main.js  cart.js  home.js  shop.js  product.js  contact.js  manage.js
tools/make_colour_variants.py    colour variant generator (+ requirements.txt)
assets/ logo/ banners/ models/ products/ (male-tank, female-tank, beanie, _source, ...)
```

## 10. Deploy to GitHub Pages

1. Create a GitHub repository (e.g. `anonymous-collectives`).
2. Upload everything in this folder (so `index.html` is at the top level), or:
   ```bash
   git init && git add . && git commit -m "Anonymous Collectives v3"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/anonymous-collectives.git
   git push -u origin main
   ```
3. **Settings > Pages**: Source = *Deploy from a branch*, branch **main**, folder **/ (root)**, Save.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/anonymous-collectives/`. All paths are relative, so it works in that sub-folder and on a custom domain.
5. Change the `og:image` meta tags to full URLs so link previews show a picture.
6. `manage.html` is public once deployed (it only helps write text and check photos; it can't change the site). Delete it from the repository if you'd rather not publish it.

Updating later: replace the changed files in the repository; changes go live within a couple of minutes.

## 11. Custom domain

1. **Settings > Pages > Custom domain**: enter it and Save.
2. At your registrar add four **A** records for the root: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a **CNAME** for `www` pointing to `YOUR-USERNAME.github.io`.
3. When DNS updates, tick **Enforce HTTPS**, then update the `og:image` URLs.
