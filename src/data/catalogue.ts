/* =============================================================================
   ANONYMOUS COLLECTIVES — catalogue
   The ONE file you edit to run the shop. Home, Shop, Product, the cart and the
   manage page all read from here.

   Prices live in PRICE_LIST. Everything else lives in the exports below.
   ============================================================================= */

export type Colour = {
  name: string
  hex: string
  image?: string
  preview?: boolean
}

export type ProductSeed = {
  id: string
  name: string
  category: string
  gender: string
  description: string
  story?: string
  images: string[]
  colours: Colour[]
  sizes: string[]
  available: boolean
  availabilityNote?: string
  isNewArrival: boolean
  isBestSeller: boolean
  isFeatured: boolean
  isTopRecommended?: boolean
  collection: string
  dateAdded: string
}

export type Product = ProductSeed & {
  originalPrice: number
  discountPrice: number | null
  quantity?: number
  sortOrder?: number
}

/** Old price = normal price. Sale = what the customer pays now (null = no sale). */
export const PRICE_LIST: Record<string, { old: number; sale: number | null }> = {
  'ac-001': { old: 17000, sale: 15000 }, // Male Tank Top
  'ac-002': { old: 17000, sale: 15000 }, // Female Tank Top
  'ac-003': { old: 17000, sale: 12000 }, // Slouch Beanie
  'ac-005': { old: 22000, sale: null },
  'ac-006': { old: 18000, sale: 15000 },
  'ac-007': { old: 9000, sale: null },
  'ac-008': { old: 9000, sale: 7500 },
}

export const SITE = {
  name: 'ANONYMOUS COLLECTIVES',
  shortName: 'Anonymous Collectives',
  tagline: 'Stay Low, Stand Out.',

  whatsappNumber: '2347037593930',
  whatsappDisplay: '+234 703 759 3930',

  currency: 'NGN',
  locale: 'en-NG',

  logoIvory: 'assets/logo/ac-logo-ivory.png',
  logoCharcoal: 'assets/logo/ac-logo-charcoal.png',

  social: {
    tiktok: {
      handle: '@anonymous.collective01',
      url: 'https://www.tiktok.com/@anonymous.collective01',
    },
    instagram: {
      handle: '',
      url: '',
    },
  },

  defaultStory:
    "Anonymous Collectives is built on a simple idea: you don't have to be loud to be seen. Every piece is made to be worn with quiet confidence, so the details do the talking.",

  newsletter: { endpoint: '' },
}

export type Banner = { image: string; alt: string }

export const BANNERS: { hero: Banner; campaign: Banner } = {
  hero: {
    image: 'assets/banners/hero-main.jpg',
    alt: 'A woman in a black ribbed tank and a man in a camouflage slouchy beanie and black hoodie, seated on concrete steps',
  },
  campaign: {
    image: 'assets/banners/campaign-second.jpg',
    alt: 'A black hoodie and a black Anonymous beanie resting on concrete in low, warm light',
  },
}

export type Campaign = {
  id: string
  title: string
  text: string
  image: string
  alt: string
  productIds: string[]
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    title: 'Back Print, Loud Walls',
    text: "The message sits where you can't see it. Everyone behind you can.",
    image: 'assets/models/model-01.jpg',
    alt: 'Model seen from behind in a grey Anonymous Collectives tee with the Stay Low, Stand Out back print, standing against a graffiti wall',
    productIds: ['ac-005'],
  },
  {
    id: 'c2',
    title: 'Head Down, Eyes Up',
    text: 'A small chest print and a relaxed fit. Nothing else needed.',
    image: 'assets/models/model-02.jpg',
    alt: 'Model in a grey Anonymous tee with a small chest print, looking down in front of a graffiti wall',
    productIds: ['ac-005'],
  },
  {
    id: 'c3',
    title: 'After Dark',
    text: 'Black on black, with the print as the only signal.',
    image: 'assets/models/model-03.jpg',
    alt: 'Model looking over her shoulder, wearing a black Stay Low, Stand Out tee, photographed in a mirror',
    productIds: ['ac-005'],
  },
  {
    id: 'c4',
    title: 'Indoors, Unbothered',
    text: "Soft, easy and quiet. The kind of outfit that doesn't ask for attention.",
    image: 'assets/models/model-04.jpg',
    alt: 'Model in black Anonymous clothing with a small chest print, standing in a bright hallway',
    productIds: ['ac-005'],
  },
  {
    id: 'c5',
    title: 'Red, Unsigned',
    text: 'The ribbed tank in red, with the wordmark stitched small.',
    image: 'assets/models/model-05.jpg',
    alt: 'Model in a red ribbed Anonymous tank top holding an Anonymous Collectives shopping bag in front of her face',
    productIds: ['ac-002', 'ac-001'],
  },
  {
    id: 'c6',
    title: 'Chest Print, Open Air',
    text: 'Two takes on the same quiet logo, worn without a word.',
    image: 'assets/models/model-06.jpg',
    alt: 'Two models outdoors under a tree, one in a black Anonymous sleeveless top and one in a black Anonymous tee with the ANO NY MOUS chest print',
    productIds: ['ac-005', 'ac-006'],
  },
  {
    id: 'c7',
    title: 'Back Print, Big Sky',
    text: 'Seen from behind, the message does all the talking.',
    image: 'assets/models/model-07.jpg',
    alt: 'Two models sitting on a rock seen from behind, wearing black Anonymous tees with the Stay Low, Stand Out back print under a wide sky',
    productIds: ['ac-005', 'ac-006'],
  },
  {
    id: 'c8',
    title: 'Under the Canopy',
    text: 'A small chest print, a lowered gaze, and nothing left to prove.',
    image: 'assets/models/model-11.jpg',
    alt: 'Model in a black Anonymous tee with the ANO NY MOUS chest print standing under a leafy tree, looking down',
    productIds: ['ac-005'],
  },
]

export const CATEGORIES = [
  { name: 'Beanie Caps', image: 'assets/products/beanie/black.jpg' },
  { name: 'Male Tank Tops', image: 'assets/products/male-tank/red.jpg' },
  { name: 'Female Tank Tops', image: 'assets/products/female-tank/black.jpg' },
  { name: 'T-Shirts', image: 'assets/products/t-shirts/anonymous-tee-1.jpg' },
  { name: 'Sleeveless Shirts', image: 'assets/products/sleeveless/sleeveless-shirt-1.jpg' },
  { name: 'Caps', image: 'assets/products/caps/cap-01-1.jpg' },
]

export const COLLECTIONS = [
  { name: 'Essentials', description: 'Ribbed tanks with the wordmark kept small.' },
  { name: 'Headwear', description: 'Beanies and caps, each in its own design.' },
  { name: 'Stay Low Series', description: "Graphic tees that say it quietly, usually from the back." },
]

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: 'ac-001',
    name: 'Male Tank Top',
    category: 'Male Tank Tops',
    gender: 'Men',
    description: 'Ribbed tank with a close fit and the Anonymous wordmark printed small at the chest.',
    story: 'A tank that keeps it simple: the name sits small and the fit does the rest.',
    images: [
      'assets/products/male-tank/red.jpg',
      'assets/products/male-tank/black.jpg',
      'assets/products/male-tank/white.jpg',
      'assets/products/male-tank/brown.jpg',
    ],
    colours: [
      { name: 'Red', hex: '#C3141B', image: 'assets/products/male-tank/red.jpg' },
      { name: 'Black', hex: '#161616', image: 'assets/products/male-tank/black.jpg', preview: true },
      { name: 'Pure White', hex: '#FFFFFF', image: 'assets/products/male-tank/white.jpg', preview: true },
      { name: 'Brown', hex: '#65402D', image: 'assets/products/male-tank/brown.jpg', preview: true },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available: true,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    collection: 'Essentials',
    dateAdded: '2026-10-28',
  },
  {
    id: 'ac-002',
    name: 'Female Tank Top',
    category: 'Female Tank Tops',
    gender: 'Women',
    description:
      'Ribbed crop tank with a racer neckline and the Anonymous wordmark with Stay low, Stand out at the chest.',
    story: 'Soft ribbing, a racer neckline and one quiet line of embroidery. Nothing else needed.',
    images: [
      'assets/products/female-tank/black.jpg',
      'assets/products/female-tank/red.jpg',
      'assets/products/female-tank/white.jpg',
      'assets/products/female-tank/brown.jpg',
    ],
    colours: [
      { name: 'Black', hex: '#161616', image: 'assets/products/female-tank/black.jpg' },
      { name: 'Red', hex: '#C3141B', image: 'assets/products/female-tank/red.jpg', preview: true },
      { name: 'Pure White', hex: '#FFFFFF', image: 'assets/products/female-tank/white.jpg', preview: true },
      { name: 'Brown', hex: '#65402D', image: 'assets/products/female-tank/brown.jpg', preview: true },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available: true,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    collection: 'Essentials',
    dateAdded: '2026-10-27',
  },
  {
    id: 'ac-003',
    name: 'Slouch Beanie',
    category: 'Beanie Caps',
    gender: 'Unisex',
    description:
      'Slouch beanie with the Stay Low, Stand Out badge. Available in black, ash grey, purple and brown.',
    story: 'The slouch hangs low on purpose, and the badge says the rest.',
    images: [
      'assets/products/beanie/black.jpg',
      'assets/products/beanie/ash.jpg',
      'assets/products/beanie/purple.jpg',
      'assets/products/beanie/brown.jpg',
    ],
    colours: [
      { name: 'Black', hex: '#161616', image: 'assets/products/beanie/black.jpg' },
      { name: 'Ash Grey', hex: '#929292', image: 'assets/products/beanie/ash.jpg', preview: true },
      { name: 'Purple', hex: '#542477', image: 'assets/products/beanie/purple.jpg', preview: true },
      { name: 'Brown', hex: '#65402D', image: 'assets/products/beanie/brown.jpg', preview: true },
    ],
    sizes: ['One Size'],
    available: true,
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    collection: 'Headwear',
    dateAdded: '2026-10-25',
  },
  {
    id: 'ac-005',
    name: 'Anonymous Tee',
    category: 'T-Shirts',
    gender: 'Unisex',
    description: 'Relaxed tee with the small ANO NY MOUS chest print.',
    images: ['assets/products/t-shirts/anonymous-tee-1.jpg'],
    colours: [
      { name: 'Charcoal Grey', hex: '#6B6663', image: 'assets/products/t-shirts/anonymous-tee-1.jpg' },
      { name: 'Black', hex: '#161616' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: 'Stay Low Series',
    dateAdded: '2026-10-18',
  },
  {
    id: 'ac-006',
    name: 'Sleeveless Shirt',
    category: 'Sleeveless Shirts',
    gender: 'Unisex',
    description: 'Lightweight sleeveless shirt for warm days.',
    images: ['assets/products/sleeveless/sleeveless-shirt-1.jpg'],
    colours: [
      { name: 'Black', hex: '#161616', image: 'assets/products/sleeveless/sleeveless-shirt-1.jpg' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: 'Essentials',
    dateAdded: '2026-10-12',
  },
  {
    id: 'ac-007',
    name: 'Cap — Design 01',
    category: 'Caps',
    gender: 'Unisex',
    description: 'Adjustable cap, first of several designs.',
    images: ['assets/products/caps/cap-01-1.jpg'],
    colours: [
      { name: 'Black', hex: '#161616', image: 'assets/products/caps/cap-01-1.jpg' },
      { name: 'Brown', hex: '#65402D' },
    ],
    sizes: ['One Size'],
    available: true,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: 'Headwear',
    dateAdded: '2026-09-25',
  },
  {
    id: 'ac-008',
    name: 'Cap — Design 02',
    category: 'Caps',
    gender: 'Unisex',
    description: 'Adjustable cap, second design. Shown as sold out to demonstrate stock status.',
    images: ['assets/products/caps/cap-02-1.jpg'],
    colours: [{ name: 'Black', hex: '#161616', image: 'assets/products/caps/cap-02-1.jpg' }],
    sizes: ['One Size'],
    available: false,
    availabilityNote: 'Message us on WhatsApp about the next restock.',
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    collection: 'Headwear',
    dateAdded: '2026-09-25',
  },
]

/* Apply the PRICE LIST to the products. */
export const PRODUCTS: Product[] = PRODUCT_SEEDS.map((p) => {
  const price = PRICE_LIST[p.id]
  const original = price && Number(price.old) > 0 ? Number(price.old) : 0
  const sale = price ? Number(price.sale) : 0
  const discount = sale > 0 && sale < original ? sale : null

  if (!price || !original) {
    console.warn(
      `[Anonymous Collectives] No price for "${p.id}" (${p.name}). Add it to PRICE_LIST.`,
    )
  } else if (sale > 0 && sale >= original) {
    console.warn(
      `[Anonymous Collectives] Sale price for "${p.id}" is not lower than the old price, so it was ignored.`,
    )
  }

  return { ...p, originalPrice: original, discountPrice: discount }
})
