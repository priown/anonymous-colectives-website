import { SITE, type Campaign, type Product } from '../data/catalogue'

const PLACEHOLDER = 'assets/products/placeholder.svg'

export const asset = (src: string): string => {
  if (!src) return src
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

export const placeholderImage = asset(PLACEHOLDER)

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat(SITE.locale, {
    style: 'currency',
    currency: SITE.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export type PriceInfo = {
  original: number
  current: number
  hasDiscount: boolean
  percent: number
}

/** Works out pricing for a product. Discounts are optional. */
export const priceInfo = (p: Product): PriceInfo => {
  const original = Number(p.originalPrice) || 0
  const discount = Number(p.discountPrice) || 0
  const hasDiscount = discount > 0 && discount < original
  return {
    original,
    current: hasDiscount ? discount : original,
    hasDiscount,
    percent: hasDiscount ? Math.round((1 - discount / original) * 100) : 0,
  }
}

export const findProduct = (
  products: Product[],
  id?: string | null,
): Product | undefined => products.find((p) => p.id === id)

export const productUrl = (id: string): string =>
  `/product/${encodeURIComponent(id)}`

export const shopUrl = (params: Record<string, string> = {}): string => {
  const query = new URLSearchParams(params).toString()
  return `/shop${query ? `?${query}` : ''}`
}

export const waLink = (message?: string): string =>
  `https://wa.me/${SITE.whatsappNumber}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`

const SIZE_NAMES: Record<string, string> = {
  XS: 'Extra Small',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'Extra Large',
  XXL: 'Double Extra Large',
}

export const sizeName = (size: string): string => SIZE_NAMES[size] || size

/** Search across name, category, collection, gender, colours and description. */
export const searchProducts = (products: Product[], query: string): Product[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return products.slice()

  return products.filter((p) => {
    const hay = [
      p.name,
      p.category,
      p.collection,
      p.gender,
      p.description,
      ...p.colours.map((c) => c.name),
    ]
      .join(' ')
      .toLowerCase()
    return terms.every((term) => hay.includes(term))
  })
}

/** Photo for a collection card: its first product's main photo. */
export const collectionImage = (
  products: Product[],
  collection: { name: string },
): string | null => {
  const product = products.find((p) => p.collection === collection.name)
  return product ? product.images[0] : null
}

export const campaignProducts = (
  products: Product[],
  campaign: Campaign,
): Product[] =>
  campaign.productIds
    .map((id) => findProduct(products, id))
    .filter((p): p is Product => Boolean(p))
