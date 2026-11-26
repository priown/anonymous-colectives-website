import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { Client } from 'pg'
import { PRODUCTS } from '../src/data/catalogue'
import type { CatalogueOverrides } from '../src/context/catalogue'

const map = JSON.parse(
  readFileSync('scripts/cloudinary-map.json', 'utf8'),
) as Record<string, string>

const overrides = JSON.parse(
  readFileSync('public/data/store.json', 'utf8'),
) as Partial<CatalogueOverrides>

const cloudinaryUrl = (src?: string): string | undefined => {
  if (!src) return src
  if (src.startsWith('http')) return src
  return map[`public/${src}`] || src
}

const includes = (list: string[] | undefined, id: string, fallback: boolean) =>
  Array.isArray(list) ? list.includes(id) : fallback

const rows = PRODUCTS.map((product, index) => {
  const price = overrides.prices?.[product.id]
  const images = overrides.images?.[product.id] || product.images

  return {
    id: product.id,
    title: product.name,
    category: product.category,
    gender: product.gender,
    description: product.description,
    motto: product.story ?? null,
    pictures: images.map((src) => cloudinaryUrl(src)),
    colours: product.colours.map((colour) => ({
      ...colour,
      ...(colour.image ? { image: cloudinaryUrl(colour.image) } : {}),
    })),
    sizes: product.sizes,
    actualPrice: price?.old ?? product.originalPrice,
    discountPrice: price?.sale ?? product.discountPrice,
    quantity: product.available ? 10 : 0,
    available: product.available,
    availabilityNote: product.availabilityNote ?? null,
    isNewArrival: includes(
      overrides.newArrivals,
      product.id,
      product.isNewArrival,
    ),
    isBestSeller: includes(
      overrides.bestSellers,
      product.id,
      product.isBestSeller,
    ),
    isFeatured: includes(
      overrides.featuredProducts,
      product.id,
      product.isFeatured,
    ),
    isTopRecommended: includes(
      overrides.topRecommended,
      product.id,
      Boolean(product.isTopRecommended),
    ),
    collection: product.collection,
    dateAdded: product.dateAdded,
    sortOrder: index,
  }
})

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query('select public.save_products($1, $2, $3::jsonb)', [
    process.env.ADMIN_USERNAME || 'Admin',
    process.env.ADMIN_PASSWORD || 'Admin',
    JSON.stringify(rows),
  ])
  const result = await client.query(
    'select count(*)::int as count from public.products',
  )
  console.log(`Seeded products. Total rows: ${result.rows[0].count}`)
  console.log(
    rows
      .map((row) => `${row.id} ${row.title} (${row.pictures.length} photos)`)
      .join('\n'),
  )
} finally {
  await client.end()
}
