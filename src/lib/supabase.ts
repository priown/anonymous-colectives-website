import { createClient } from '@supabase/supabase-js'
import type { CatalogueOverrides } from '../context/catalogue'
import type { Colour, Product } from '../data/catalogue'
import { PUBLIC_CONFIG } from './public-config'

/**
 * Supabase backend for the shop data and admin login.
 *
 * Supabase Auth is not used. Admin passwords live as pgcrypto hashes in
 * `public.users`; the `login` and `save_storefront` Postgres functions check
 * them server-side. Only the project URL + public anon key are exposed here.
 * Never put the service-role key in this app.
 */
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  PUBLIC_CONFIG.supabaseUrl ||
  ''
).trim()
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  PUBLIC_CONFIG.supabaseAnonKey ||
  ''
).trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const TABLE = 'storefront'
const ROW_ID = 'main'
const SESSION_USER = 'ac:admin-user'
const SESSION_PASS = 'ac:admin-pass'

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

const session = (): { username: string; password: string } | null => {
  try {
    const username = sessionStorage.getItem(SESSION_USER)
    const password = sessionStorage.getItem(SESSION_PASS)
    return username && password ? { username, password } : null
  } catch {
    return null
  }
}

export const signInAdmin = async (
  username: string,
  password: string,
): Promise<void> => {
  if (!supabase) {
    throw new Error('Could not reach the login service. Please try again.')
  }

  const name = username.trim()
  const { data, error } = await supabase.rpc('login', {
    p_username: name,
    p_password: password,
  })

  if (error) {
    throw new Error('Could not reach the login service. Please try again.')
  }
  if (!data) {
    throw new Error('Incorrect username or password.')
  }

  try {
    sessionStorage.setItem(SESSION_USER, name)
    sessionStorage.setItem(SESSION_PASS, password)
  } catch {
    throw new Error('Your browser blocked the login session. Allow site storage.')
  }
}

export const signOutAdmin = async (): Promise<void> => {
  try {
    sessionStorage.removeItem(SESSION_USER)
    sessionStorage.removeItem(SESSION_PASS)
  } catch {
    /* storage blocked */
  }
}

export const watchAdminAuth = (callback: (signedIn: boolean) => void): (() => void) => {
  callback(Boolean(session()))
  return () => undefined
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const applyStatic = async (): Promise<Partial<CatalogueOverrides> | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}data/store.json?t=${Date.now()}`,
      { cache: 'no-store' },
    )
    if (!response.ok) return null
    return (await response.json()) as Partial<CatalogueOverrides>
  } catch {
    return null
  }
}

/** Reads the live Supabase state; falls back to the bundled seed file. */
export const fetchStorefrontOverrides = async (): Promise<Partial<CatalogueOverrides> | null> => {
  if (!supabase) return applyStatic()

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data?.data) return data.data as Partial<CatalogueOverrides>
  } catch {
    /* fall through to the static seed */
  }

  return applyStatic()
}

type DbProduct = {
  id: string
  title: string
  category: string
  gender: string
  description: string
  motto: string | null
  pictures: string[]
  colours: Colour[]
  sizes: string[]
  actual_price: number
  discount_price: number | null
  quantity: number
  available: boolean
  availability_note: string | null
  is_new_arrival: boolean
  is_best_seller: boolean
  is_featured: boolean
  is_top_recommended: boolean
  collection: string
  date_added: string
  sort_order: number
}

export const productFromRow = (row: DbProduct): Product => ({
  id: row.id,
  name: row.title,
  category: row.category,
  gender: row.gender,
  description: row.description,
  story: row.motto ?? undefined,
  images: Array.isArray(row.pictures) ? row.pictures : [],
  colours: Array.isArray(row.colours) ? row.colours : [],
  sizes: Array.isArray(row.sizes) ? row.sizes : [],
  originalPrice: Number(row.actual_price) || 0,
  discountPrice:
    row.discount_price === null ? null : Number(row.discount_price) || null,
  quantity: Number(row.quantity) || 0,
  available: Boolean(row.available),
  availabilityNote: row.availability_note ?? undefined,
  isNewArrival: Boolean(row.is_new_arrival),
  isBestSeller: Boolean(row.is_best_seller),
  isFeatured: Boolean(row.is_featured),
  isTopRecommended: Boolean(row.is_top_recommended),
  collection: row.collection,
  dateAdded: row.date_added,
  sortOrder: Number(row.sort_order) || 0,
})

const productToRow = (product: Product) => ({
  id: product.id,
  title: product.name,
  category: product.category,
  gender: product.gender,
  description: product.description,
  motto: product.story ?? null,
  pictures: product.images,
  colours: product.colours,
  sizes: product.sizes,
  actualPrice: product.originalPrice,
  discountPrice: product.discountPrice,
  quantity: product.quantity ?? 0,
  available: product.available,
  availabilityNote: product.availabilityNote ?? null,
  isNewArrival: product.isNewArrival,
  isBestSeller: product.isBestSeller,
  isFeatured: product.isFeatured,
  isTopRecommended: Boolean(product.isTopRecommended),
  collection: product.collection,
  dateAdded: product.dateAdded,
  sortOrder: product.sortOrder ?? 0,
})

export const fetchProducts = async (): Promise<Product[] | null> => {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error || !data?.length) return null
    return (data as DbProduct[]).map(productFromRow)
  } catch {
    return null
  }
}

export const saveProducts = async (products: Product[]): Promise<void> => {
  if (!supabase) throw new Error('Could not reach the live storefront.')
  const credentials = session()
  if (!credentials) throw new Error('Your login session has expired. Sign in again.')

  const { error } = await supabase.rpc('save_products', {
    p_username: credentials.username,
    p_password: credentials.password,
    p_products: products.map(productToRow),
  })
  if (error) {
    if (error.message.toLowerCase().includes('incorrect')) {
      throw new Error('Your login is no longer valid. Please sign in again.')
    }
    throw new Error('Could not save your products. Please try again.')
  }
}

export const deleteProduct = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Could not reach the live storefront.')
  const credentials = session()
  if (!credentials) throw new Error('Your login session has expired. Sign in again.')

  const { error } = await supabase.rpc('delete_product', {
    p_username: credentials.username,
    p_password: credentials.password,
    p_id: id,
  })
  if (error) throw new Error('Could not delete that product.')
}

export const watchProducts = (callback: () => void): (() => void) => {
  if (!supabase) return () => undefined

  const channel = supabase
    .channel('products-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => callback(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export const watchStorefront = (callback: () => void): (() => void) => {
  if (!supabase) return () => undefined

  const channel = supabase
    .channel('storefront-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
      () => callback(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/* -------------------------------------------------------------------------- */
/* Publishing                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Sends the full state through the `save_storefront` function. The function
 * re-checks the admin username/password in Postgres before writing.
 */
export const publishStorefront = async (
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  if (!supabase) {
    throw new Error('Could not reach the live storefront. Please try again.')
  }

  const credentials = session()
  if (!credentials) {
    throw new Error('Your login session has expired. Please sign in again.')
  }

  const { error } = await supabase.rpc('save_storefront', {
    p_username: credentials.username,
    p_password: credentials.password,
    p_data: overrides,
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('incorrect')) {
      throw new Error('Your login is no longer valid. Please sign in again.')
    }
    throw new Error('Could not save to the live storefront. Please try again.')
  }

  return overrides
}
