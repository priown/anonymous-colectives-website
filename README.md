# Anonymous Collectives — React storefront

A full React conversion of the original vanilla HTML/JS site: Home, Shop,
Product, About, Contact, a shopping cart, search, light/dark mode and the private
Manage helper page.

Built with **React 19**, **TypeScript**, **Vite**, **React Router**,
**Tailwind CSS v4** and **lucide-react**.

Checkout is still WhatsApp-only. There is no online payment. Shop data, photo
storage and the admin login use Supabase.

---

## 1. Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Useful scripts:

```bash
npm run build     # type-check + production build into dist/
npm run preview   # preview the production build
npm run lint      # ESLint
```

---

## 2. Prices

Edit **`src/data/catalogue.ts`** → `PRICE_LIST`:

```ts
export const PRICE_LIST = {
  "ac-001": { old: 17000, sale: 15000 }, // Male Tank Top
  "ac-002": { old: 17000, sale: 15000 }, // Female Tank Top
  "ac-003": { old: 17000, sale: 12000 }, // Slouch Beanie
  ...
};
```

- `old` is the normal price, shown crossed out when there is a sale.
- `sale` is the price the customer pays now. Use `null` when there is no sale.
- Numbers only — no commas or `₦`.
- The discount percentage, cards, product pages, cart and WhatsApp message are
  calculated from these numbers.

The private admin page is at **`/manage`** (not linked in the navigation).

### Admin access

The admin uses **Supabase** for permanent username/password login, shared data
and image storage. There is no GitHub token and no expiring access key.

Default login, created in Supabase:

- Username: `Admin`
- Password: `Admin`

One-time Supabase setup:

1. Create a free project at
   [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** and run **`supabase/setup.sql`** from this repository.
3. Go to **Authentication → Users → Add user** and create:
   - Email: `admin@anonymous-collectives.local`
   - Password: `Admin`
   - Confirm the user (auto-confirm).
4. Open **Project Settings → API** and copy:
   - Project URL
   - Public **anon** key
5. Add them as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Locally: create `.env.local` (see `.env.example`).
   - Deployed: add them under **Settings → Secrets and variables → Actions →
     Variables**. The deploy workflow passes them to the build.
6. Redeploy. Then open `/manage` and log in with `Admin` / `Admin`.
7. Press **Publish current data** once to copy the current shop data from
   `public/data/store.json` into Supabase.

The anon key is safe to expose; row-level security only allows the admin email
to write. Never put the Supabase **service-role** key in the frontend. For a real
store, change the `Admin` password to a strong one in Supabase.

Once signed in, admin can:

- Edit every product's old and sale price and save them live across the shop,
  product pages and cart.
- Choose the five **Featured categories** shown directly below the homepage hero.
- Choose **3–5 Featured collections** for the shop's collection row.
- Choose up to 8 **Best-selling products** for the shop row. The first four
  selected fill the homepage Best Selling row.
- Upload extra product photos from the device, add photos by file path/URL,
  remove photos and choose the cover photo.
- Reset prices, photos, selections or all admin changes, and download a JSON
  backup.
- Copy a generated `PRICE_LIST` to paste into `src/data/catalogue.ts`.

Every admin save is stored in Supabase:

- Live data lives in the single `storefront` row.
- Uploaded photos go to the public `storefront` storage bucket.
- Supabase Realtime updates open browsers, and every new page load fetches the
  same data, so changes appear on every device and browser.
- A local copy is kept in `localStorage` for fast loading and offline fallback.
- `public/data/store.json` is the bundled seed/fallback (and is copied into
  Supabase the first time you press **Publish current data**).

---

## 3. Products and photos

All shop content lives in **`src/data/catalogue.ts`**:

- `SITE` — WhatsApp number, social links, logo paths, newsletter endpoint.
- `BANNERS` — hero and campaign banner photos.
- `CAMPAIGNS` — AC Lookbook photos and the products worn in each shot.
- `CATEGORIES` / `COLLECTIONS` — the category cards and shop collections.
- `PRODUCTS` — names, descriptions, colours, sizes, stock status and photo paths.

Homepage order: hero → Featured categories → marquee → Best Selling →
campaign banner → AC Lookbook → brand statement → newsletter. The category and
best-seller rows are controlled from `/manage`; featured collections are
controlled there too and appear on the shop page.

The current seed prices, photos and homepage selections are in
**`public/data/store.json`**. Once Supabase is connected, the live copy is the
`storefront` row in Supabase, and admin uploads live in Supabase Storage.

Product photos live in **`public/assets/products/`**, model photos in
`public/assets/models/`, banners in `public/assets/banners/` and logos in
`public/assets/logo/`. Keep the paths in `catalogue.ts` in sync with the files.

If a product photo is missing, the site shows the placeholder and a
“Mockup coming soon” badge instead of breaking. Featured cards without a real
photo are hidden on the home page.

---

## 4. Shopping cart

- Saved in the visitor’s browser under `ac:cart`, so it survives refreshes and
  page changes.
- One line per product + colour + size.
- “Checkout on WhatsApp” turns the whole cart into one pre-written message to
  `SITE.whatsappNumber`.

---

## 5. Theme

Dark is the default. The moon/sun button switches to light mode instantly and
remembers the choice in `localStorage` (`ac:theme`). The inline script in
`index.html` applies the saved theme before React paints, so there is no flash.

Brand colours, motion, marquee, cart drawer, dialogs and component classes are
in **`src/index.css`**. Tailwind v4 reads the same CSS variables through its
`@theme` block, so utilities such as `bg-cream`, `text-ink/70` and
`border-choc` flip with the theme.

---

## 6. Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/shop` | Shop with URL-based filters and search (`/shop?category=Caps`) |
| `/product/:id` | Product detail (old `/product?id=ac-001` links redirect) |
| `/about` | About Us |
| `/contact` | Contact + WhatsApp enquiry form |
| `/manage` | Private admin page |

```bash
npm run build
```

For static hosting, serve `dist/` and add a SPA fallback so deep links such as
`/product/ac-001` return `index.html`.

---

## 7. Deploy to GitHub Pages

The repository includes `.github/workflows/deploy.yml`. On every push to `main`
it installs dependencies, builds the app, copies `index.html` to `404.html` for
client-side routes, and publishes `dist/`.

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public anon key).
3. Push to `main` (or run the workflow manually from the Actions tab).
4. The workflow sets the Vite base to `/<repository-name>/` automatically.
   If you use a custom domain, change `VITE_BASE` in the workflow to `/`.
