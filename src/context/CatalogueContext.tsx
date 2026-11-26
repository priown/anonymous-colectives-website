import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  CATEGORIES,
  COLLECTIONS,
  PRODUCTS as BASE_PRODUCTS,
  type Product,
} from '../data/catalogue'
import {
  CatalogueContext,
  type CatalogueContextValue,
  type CatalogueOverrides,
  type HomepageSelections,
  type PriceOverride,
} from './catalogue'

const STORAGE_KEY = 'ac:catalogue'

const DEFAULT_FEATURED_COLLECTIONS = COLLECTIONS.map((collection) => collection.name)
const DEFAULT_BEST_SELLERS = BASE_PRODUCTS.filter(
  (product) => product.isBestSeller,
).map((product) => product.id)
const DEFAULT_FEATURED_CATEGORIES = CATEGORIES.slice(0, 5).map(
  (category) => category.name,
)

const DEFAULTS: CatalogueOverrides = {
  prices: {},
  images: {},
  featuredCollections: DEFAULT_FEATURED_COLLECTIONS,
  bestSellers: DEFAULT_BEST_SELLERS,
  featuredCategories: DEFAULT_FEATURED_CATEGORIES,
}

const collectionNames = new Set(COLLECTIONS.map((collection) => collection.name))
const productIds = new Set(BASE_PRODUCTS.map((product) => product.id))
const categoryNames = new Set(CATEGORIES.map((category) => category.name))

const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    : []

/**
 * The Stay Low Tee (ac-004) was merged into the Anonymous Tee (ac-005).
 * Move any admin uploads/prices saved under the old id so nothing is lost.
 */
const migrateOverrides = (overrides: CatalogueOverrides): CatalogueOverrides => {
  const prices = { ...overrides.prices }
  const images = { ...overrides.images }
  let changed = false

  if (prices['ac-004']) {
    if (!prices['ac-005']) prices['ac-005'] = prices['ac-004']
    delete prices['ac-004']
    changed = true
  }

  if (images['ac-004']) {
    if (!images['ac-005']) images['ac-005'] = images['ac-004']
    delete images['ac-004']
    changed = true
  }

  return changed ? { ...overrides, prices, images } : overrides
}

const loadOverrides = (): CatalogueOverrides => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as
      | Partial<CatalogueOverrides>
      | null
    if (!raw || typeof raw !== 'object') return DEFAULTS

    const storedCollections = uniqueStrings(raw.featuredCollections).filter((name) =>
      collectionNames.has(name),
    )
    const storedBestSellers = uniqueStrings(raw.bestSellers).filter((id) =>
      productIds.has(id),
    )
    const storedCategories = uniqueStrings(raw.featuredCategories)
      .filter((name) => categoryNames.has(name))
      .slice(0, 5)

    const overrides: CatalogueOverrides = {
      prices: raw.prices && typeof raw.prices === 'object' ? raw.prices : {},
      images: raw.images && typeof raw.images === 'object' ? raw.images : {},
      featuredCollections:
        Array.isArray(raw.featuredCollections) && storedCollections.length
          ? storedCollections
          : DEFAULT_FEATURED_COLLECTIONS,
      bestSellers: Array.isArray(raw.bestSellers)
        ? storedBestSellers
        : DEFAULT_BEST_SELLERS,
      featuredCategories:
        Array.isArray(raw.featuredCategories) && storedCategories.length === 5
          ? storedCategories
          : DEFAULT_FEATURED_CATEGORIES,
    }

    const migrated = migrateOverrides(overrides)

    if (migrated !== overrides) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      } catch {
        /* storage blocked */
      }
    }

    return migrated
  } catch {
    return DEFAULTS
  }
}

const applyOverrides = (overrides: CatalogueOverrides): Product[] =>
  BASE_PRODUCTS.map((product) => {
    const price = overrides.prices[product.id]
    const old = price ? Number(price.old) || 0 : product.originalPrice
    const sale = price ? Number(price.sale) || 0 : Number(product.discountPrice) || 0
    const discount = sale > 0 && sale < old ? sale : null

    const images = overrides.images[product.id]

    return {
      ...product,
      originalPrice: old,
      discountPrice: discount,
      images: images && images.length ? images : product.images,
      isBestSeller: overrides.bestSellers.includes(product.id),
    }
  })

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CatalogueOverrides>(loadOverrides)
  const overridesRef = useRef(overrides)
  const products = useMemo(() => applyOverrides(overrides), [overrides])

  useEffect(() => {
    overridesRef.current = overrides
  }, [overrides])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next = loadOverrides()
      overridesRef.current = next
      setOverrides(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((next: CatalogueOverrides): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      overridesRef.current = next
      setOverrides(next)
      return true
    } catch {
      return false
    }
  }, [])

  const savePrices = useCallback(
    (prices: Record<string, PriceOverride>) =>
      commit({ ...overridesRef.current, prices }),
    [commit],
  )

  const setProductImages = useCallback(
    (id: string, images: string[]) =>
      commit({
        ...overridesRef.current,
        images: { ...overridesRef.current.images, [id]: images },
      }),
    [commit],
  )

  const saveSelections = useCallback(
    (selections: HomepageSelections) =>
      commit({ ...overridesRef.current, ...selections }),
    [commit],
  )

  const resetPrices = useCallback(
    () => commit({ ...overridesRef.current, prices: {} }),
    [commit],
  )

  const resetProductImages = useCallback(
    (id: string) => {
      const images = { ...overridesRef.current.images }
      delete images[id]
      return commit({ ...overridesRef.current, images })
    },
    [commit],
  )

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage blocked */
    }
    overridesRef.current = DEFAULTS
    setOverrides(DEFAULTS)
    return true
  }, [])

  const value: CatalogueContextValue = {
    products,
    overrides,
    featuredCollections: overrides.featuredCollections,
    bestSellers: overrides.bestSellers,
    featuredCategories: overrides.featuredCategories,
    savePrices,
    setProductImages,
    saveSelections,
    resetPrices,
    resetProductImages,
    resetAll,
  }

  return (
    <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
  )
}
