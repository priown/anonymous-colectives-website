/* =============================================================================
   ANONYMOUS COLLECTIVES — products.js
   The ONE file you edit to run the shop. Home, Shop, Product and the Bag all read from it.

   WHAT'S IN HERE (in order)
   1. PRICE LIST    ← change prices here (old price + sale price). Start here.
   2. SITE          – WhatsApp number, social links, newsletter
   3. BANNERS       – hero banner and second campaign banner
   4. AC LOOKBOOK   – the model photographs (model photos live ONLY here)
   5. CATEGORIES / COLLECTIONS
   6. PRODUCTS      – names, descriptions, colours, sizes, photos

   ADDING PHOTOS LATER (no code changes needed)
   Save the photo in the folder and with the exact file name already written in the product's
   "images" list, then refresh. Until the file exists the site shows a "Mockup coming soon" tile;
   the moment it exists the real photo appears everywhere (shop, home, product page, bag).
   The "Manage" page (manage.html) shows which photos are found and which are still missing.

   PHOTO RULES
   - Product photos   -> assets/products/...   (products only)
   - Model photos     -> assets/models/...     (the AC Lookbook only, never products)
   - Banners          -> assets/banners/...
   - Logo             -> assets/logo/...
============================================================================= */


/* =============================================================================
   1. PRICE LIST  —  EDIT YOUR PRICES HERE
   -----------------------------------------------------------------------------
   One line per product:      "product id": { old: OLD PRICE, sale: SALE PRICE },

     old   = the normal price. It is shown crossed out when there is a sale.
     sale  = the price the customer pays now.  Write null if there is no sale.

   Examples
     On sale  (was ₦12,000, now ₦10,000):  "ac-002": { old: 12000, sale: 10000 },
     Not on sale (just ₦12,000):           "ac-001": { old: 12000, sale: null },

   Rules: numbers only, no commas, no ₦ sign. The % discount is worked out for you.
   Prefer a form instead of editing code? Open manage.html: type your prices and copy the result.
   (The prices below are sample prices; replace them with your own.)
============================================================================= */
const PRICE_LIST = {
  "ac-001": { old: 12000, sale: null  },   // Male Tank Top
  "ac-002": { old: 12000, sale: 10000 },   // Female Tank Top
  "ac-003": { old: 8500,  sale: null  },   // Slouch Beanie
  "ac-004": { old: 25000, sale: 20000 },   // Stay Low Tee
  "ac-005": { old: 22000, sale: null  },   // Anonymous Tee
  "ac-006": { old: 18000, sale: 15000 },   // Sleeveless Shirt
  "ac-007": { old: 9000,  sale: null  },   // Cap — Design 01
  "ac-008": { old: 9000,  sale: 7500  },   // Cap — Design 02
};


/* 2. SITE SETTINGS --------------------------------------------------------- */
const SITE = {
  name: "ANONYMOUS COLLECTIVES",
  shortName: "Anonymous Collectives",
  tagline: "Stay Low, Stand Out.",

  // WhatsApp number in international format, digits only (no +, no spaces).
  // Bag checkout and "Order via WhatsApp" both use this number.
  whatsappNumber: "2347037593930",
  whatsappDisplay: "+234 703 759 3930",

  currency: "NGN",
  locale: "en-NG",

  // Official logo (transparent PNGs made from the supplied logo file).
  // "ivory" shows on dark backgrounds, "charcoal" on light ones.
  logoIvory: "assets/logo/ac-logo-ivory.png",
  logoCharcoal: "assets/logo/ac-logo-charcoal.png",

  // Social links only appear where a real URL is filled in.
  social: {
    tiktok: { handle: "@anonymous.collective01", url: "https://www.tiktok.com/@anonymous.collective01" },
    instagram: { handle: "", url: "" },   // paste the URL when the account exists
  },

  // Brand story line shown on every product page.
  defaultStory:
    "Anonymous Collectives is built on a simple idea: you don't have to be loud to be seen. Every piece is made to be worn with quiet confidence, so the details do the talking.",

  // NEWSLETTER: no email service is connected, so nothing is stored. To connect one later,
  // paste your form endpoint here (see README, "Newsletter").
  newsletter: { endpoint: "" },
};


/* 3. BANNERS ---------------------------------------------------------------- */
const BANNERS = {
  hero: {
    image: "assets/banners/hero-main.jpg",
    alt: "A woman in a black ribbed tank and a man in a camouflage slouchy beanie and black hoodie, seated on concrete steps",
  },
  campaign: {
    image: "assets/banners/campaign-second.jpg",
    alt: "A black hoodie and a black Anonymous beanie resting on concrete in low, warm light",
  },
};


/* 4. AC LOOKBOOK ------------------------------------------------------------
   The model photographs (the editorial layout is positioned automatically).
   Each entry: id, title, text, image, alt, and productIds = products worn in the shot
   (shown when a visitor clicks the photo). Add an entry to add a photo. */
const CAMPAIGNS = [
  {
    id: "c1",
    title: "Back Print, Loud Walls",
    text: "The message sits where you can't see it. Everyone behind you can.",
    image: "assets/models/model-01.jpg",
    alt: "Model seen from behind in a grey Anonymous Collectives tee with the Stay Low, Stand Out back print, standing against a graffiti wall",
    productIds: ["ac-004"],
  },
  {
    id: "c2",
    title: "Head Down, Eyes Up",
    text: "A small chest print and a relaxed fit. Nothing else needed.",
    image: "assets/models/model-02.jpg",
    alt: "Model in a grey Anonymous tee with a small chest print, looking down in front of a graffiti wall",
    productIds: ["ac-005"],
  },
  {
    id: "c3",
    title: "After Dark",
    text: "Black on black, with the print as the only signal.",
    image: "assets/models/model-03.jpg",
    alt: "Model looking over her shoulder, wearing a black Stay Low, Stand Out tee, photographed in a mirror",
    productIds: ["ac-004", "ac-005"],
  },
  {
    id: "c4",
    title: "Indoors, Unbothered",
    text: "Soft, easy and quiet. The kind of outfit that doesn't ask for attention.",
    image: "assets/models/model-04.jpg",
    alt: "Model in black Anonymous clothing with a small chest print, standing in a bright hallway",
    productIds: ["ac-005"],
  },
  {
    id: "c5",
    title: "Red, Unsigned",
    text: "The ribbed tank in red, with the wordmark stitched small.",
    image: "assets/models/model-05.jpg",
    alt: "Model in a red ribbed Anonymous tank top holding an Anonymous Collectives shopping bag in front of her face",
    productIds: ["ac-002", "ac-001"],
  },
];


/* 5. CATEGORIES AND COLLECTIONS ---------------------------------------------
   Category "image" = the card photo on the home page (a product photo). If the file is missing
   the card shows "Mockup coming soon". Add a line to add a category. */
const CATEGORIES = [
  { name: "Beanie Caps",       image: "assets/products/beanie/black.jpg" },
  { name: "Male Tank Tops",    image: "assets/products/male-tank/red.jpg" },
  { name: "Female Tank Tops",  image: "assets/products/female-tank/black.jpg" },
  { name: "T-Shirts",          image: "assets/products/t-shirts/stay-low-tee-1.jpg" },
  { name: "Sleeveless Shirts", image: "assets/products/sleeveless/sleeveless-shirt-1.jpg" },
  { name: "Caps",              image: "assets/products/caps/cap-01-1.jpg" },
];

/* A collection card uses the photo of its first product (a collection with no photo yet stays hidden). */
const COLLECTIONS = [
  { name: "Essentials",      description: "Ribbed tanks with the wordmark kept small." },
  { name: "Headwear",        description: "Beanies and caps, each in its own design." },
  { name: "Stay Low Series", description: "Graphic tees that say it quietly, usually from the back." },
];


/* =============================================================================
   6. PRODUCTS
   -----------------------------------------------------------------------------
   HOW TO ADD A PRODUCT
   1. Save its photos in assets/products/<folder>/ .
   2. Copy a block below, paste it at the end (before the final ]), add a comma after the previous one.
   3. Give it a new unique id (ac-009 ...), and add its prices to the PRICE LIST at the top.

   FIELDS
   id, name, category (match CATEGORIES), gender ("Unisex" | "Men" | "Women"), description,
   story (optional one-liner for the product page),
   images   photo paths; the first is the main/card photo,
   colours  [{ name, hex, image }] — "image" is the photo shown when the colour is selected.
            A colour with no image still works (the order/bag still records the colour).
            preview: true marks an image that is a digital colour preview made from the original
            photo (labelled as such on the product page). Leave it out for real photos.
   sizes    "S","M","L","XL","XXL" — or ["One Size"],
   available true/false (false = Sold out), availabilityNote (optional line under the stock status),
   isNewArrival / isBestSeller / isFeatured, collection (match COLLECTIONS), dateAdded "YYYY-MM-DD".
   Prices are NOT here: they come from the PRICE LIST at the top of this file.
============================================================================= */
const PRODUCTS = [
  {
    id: "ac-001",
    name: "Male Tank Top",
    category: "Male Tank Tops",
    gender: "Men",
    description: "Ribbed tank with a close fit and the Anonymous wordmark printed small at the chest.",
    story: "A tank that keeps it simple: the name sits small and the fit does the rest.",
    images: [
      "assets/products/male-tank/red.jpg",
      "assets/products/male-tank/black.jpg",
      "assets/products/male-tank/white.jpg",
      "assets/products/male-tank/brown.jpg",
    ],
    colours: [
      { name: "Red",        hex: "#C3141B", image: "assets/products/male-tank/red.jpg" },
      { name: "Black",      hex: "#161616", image: "assets/products/male-tank/black.jpg", preview: true },
      { name: "Pure White", hex: "#FFFFFF", image: "assets/products/male-tank/white.jpg", preview: true },
      { name: "Brown",      hex: "#65402D", image: "assets/products/male-tank/brown.jpg", preview: true },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    collection: "Essentials",
    dateAdded: "2026-10-28",
  },
  {
    id: "ac-002",
    name: "Female Tank Top",
    category: "Female Tank Tops",
    gender: "Women",
    description: "Ribbed crop tank with a racer neckline and the Anonymous wordmark with Stay low, Stand out at the chest.",
    story: "Soft ribbing, a racer neckline and one quiet line of embroidery. Nothing else needed.",
    images: [
      "assets/products/female-tank/black.jpg",
      "assets/products/female-tank/red.jpg",
      "assets/products/female-tank/white.jpg",
      "assets/products/female-tank/brown.jpg",
    ],
    colours: [
      { name: "Black",      hex: "#161616", image: "assets/products/female-tank/black.jpg" },
      { name: "Red",        hex: "#C3141B", image: "assets/products/female-tank/red.jpg",   preview: true },
      { name: "Pure White", hex: "#FFFFFF", image: "assets/products/female-tank/white.jpg", preview: true },
      { name: "Brown",      hex: "#65402D", image: "assets/products/female-tank/brown.jpg", preview: true },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    collection: "Essentials",
    dateAdded: "2026-10-27",
  },
  {
    id: "ac-003",
    name: "Slouch Beanie",
    category: "Beanie Caps",
    gender: "Unisex",
    description: "Slouch beanie with the Stay Low, Stand Out badge. Available in black, ash grey, purple and brown.",
    story: "The slouch hangs low on purpose, and the badge says the rest.",
    images: [
      "assets/products/beanie/black.jpg",
      "assets/products/beanie/ash.jpg",
      "assets/products/beanie/purple.jpg",
      "assets/products/beanie/brown.jpg",
    ],
    colours: [
      { name: "Black",    hex: "#161616", image: "assets/products/beanie/black.jpg" },
      { name: "Ash Grey", hex: "#929292", image: "assets/products/beanie/ash.jpg",    preview: true },
      { name: "Purple",   hex: "#542477", image: "assets/products/beanie/purple.jpg", preview: true },
      { name: "Brown",    hex: "#65402D", image: "assets/products/beanie/brown.jpg",  preview: true },
    ],
    sizes: ["One Size"],
    available: true,
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    collection: "Headwear",
    dateAdded: "2026-10-25",
  },

  /* ---- Waiting for mockups ---------------------------------------------------
     No photos yet, so they show "Mockup coming soon" until the files below exist.
     Save a photo with the exact name and it appears everywhere automatically. */
  {
    id: "ac-004",
    name: "Stay Low Tee",
    category: "T-Shirts",
    gender: "Unisex",
    description: "Relaxed, oversized tee with the Stay Low, Stand Out graphic across the back.",
    images: ["assets/products/t-shirts/stay-low-tee-1.jpg", "assets/products/t-shirts/stay-low-tee-2.jpg"],
    colours: [
      { name: "Charcoal Grey", hex: "#6B6663", image: "assets/products/t-shirts/stay-low-tee-1.jpg" },
      { name: "Black",         hex: "#161616", image: "assets/products/t-shirts/stay-low-tee-2.jpg" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: "Stay Low Series",
    dateAdded: "2026-10-20",
  },
  {
    id: "ac-005",
    name: "Anonymous Tee",
    category: "T-Shirts",
    gender: "Unisex",
    description: "Relaxed tee with the small ANO NY MOUS chest print.",
    images: ["assets/products/t-shirts/anonymous-tee-1.jpg"],
    colours: [
      { name: "Charcoal Grey", hex: "#6B6663", image: "assets/products/t-shirts/anonymous-tee-1.jpg" },
      { name: "Black",         hex: "#161616" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: "Stay Low Series",
    dateAdded: "2026-10-18",
  },
  {
    id: "ac-006",
    name: "Sleeveless Shirt",
    category: "Sleeveless Shirts",
    gender: "Unisex",
    description: "Lightweight sleeveless shirt for warm days.",
    images: ["assets/products/sleeveless/sleeveless-shirt-1.jpg"],
    colours: [
      { name: "Black",      hex: "#161616", image: "assets/products/sleeveless/sleeveless-shirt-1.jpg" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: "Essentials",
    dateAdded: "2026-10-12",
  },
  {
    id: "ac-007",
    name: "Cap — Design 01",
    category: "Caps",
    gender: "Unisex",
    description: "Adjustable cap, first of several designs.",
    images: ["assets/products/caps/cap-01-1.jpg"],
    colours: [
      { name: "Black", hex: "#161616", image: "assets/products/caps/cap-01-1.jpg" },
      { name: "Brown", hex: "#65402D" },
    ],
    sizes: ["One Size"],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: "Headwear",
    dateAdded: "2026-09-25",
  },
  {
    id: "ac-008",
    name: "Cap — Design 02",
    category: "Caps",
    gender: "Unisex",
    description: "Adjustable cap, second design. Shown as sold out to demonstrate stock status.",
    images: ["assets/products/caps/cap-02-1.jpg"],
    colours: [{ name: "Black", hex: "#161616", image: "assets/products/caps/cap-02-1.jpg" }],
    sizes: ["One Size"],
    available: false,
    availabilityNote: "Message us on WhatsApp about the next restock.",
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: "Headwear",
    dateAdded: "2026-09-25",
  },
];

/* ---- Apply the PRICE LIST to the products (leave this part alone) ---------------- */
PRODUCTS.forEach((p) => {
  const price = PRICE_LIST[p.id];
  if (!price || !(Number(price.old) > 0)) {
    console.warn(`[Anonymous Collectives] No price for "${p.id}" (${p.name}). Add it to PRICE_LIST at the top of products.js.`);
    p.originalPrice = 0; p.discountPrice = null;
    return;
  }
  p.originalPrice = Number(price.old);
  const sale = Number(price.sale);
  // A sale price only counts if it is lower than the old price.
  p.discountPrice = sale > 0 && sale < p.originalPrice ? sale : null;
  if (sale > 0 && sale >= p.originalPrice) {
    console.warn(`[Anonymous Collectives] Sale price for "${p.id}" is not lower than the old price, so it was ignored.`);
  }
});
