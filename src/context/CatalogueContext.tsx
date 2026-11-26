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
  type PublishState,
} from './catalogue'
import {
  fetchStorefrontOverrides,
  isSupabaseConfigured,
  publishStorefront,
  watchStorefront,
} from '../lib/supabase'

const STORAGE_KEY = 'ac:catalogue'

const DEFAULT_FEATURED_COLLECTIONS = COLLECTIONS.map((collection) => collection.name)
const DEFAULT_BEST_SELLERS = BASE_PRODUCTS.filter(
  (product) => product.isBestSeller,
).map((product) => product.id)
const DEFAULT_TOP_RECOMMENDED = BASE_PRODUCTS.filter(
  (product) => product.isFeatured,
).map((product) => product.id)
const DEFAULT_FEATURED_PRODUCTS = DEFAULT_TOP_RECOMMENDED
const DEFAULT_NEW_ARRIVALS = BASE_PRODUCTS.filter(
  (product) => product.isNewArrival,
).map((product) => product.id)
const DEFAULT_FEATURED_CATEGORIES = CATEGORIES.slice(0, 5).map(
  (category) => category.name,
)

const DEFAULTS: CatalogueOverrides = {
  prices: {},
  images: {},
  featuredCollections: DEFAULT_FEATURED_COLLECTIONS,
  bestSellers: DEFAULT_BEST_SELLERS,
  topRecommended: DEFAULT_TOP_RECOMMENDED,
  featuredProducts: DEFAULT_FEATURED_PRODUCTS,
  newArrivals: DEFAULT_NEW_ARRIVALS,
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

const normalizeOverrides = (
  raw: Partial<CatalogueOverrides> | null | undefined,
): CatalogueOverrides => {
  if (!raw || typeof raw !== 'object') return DEFAULTS

  const storedCollections = uniqueStrings(raw.featuredCollections).filter((name) =>
    collectionNames.has(name),
  )
  const storedBestSellers = uniqueStrings(raw.bestSellers).filter((id) =>
    productIds.has(id),
  )
  const storedTopRecommended = uniqueStrings(raw.topRecommended).filter((id) =>
    productIds.has(id),
  )
  const storedFeaturedProducts = uniqueStrings(raw.featuredProducts).filter((id) =>
    productIds.has(id),
  )
  const storedNewArrivals = uniqueStrings(raw.newArrivals).filter((id) =>
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
    topRecommended: Array.isArray(raw.topRecommended)
      ? storedTopRecommended
      : DEFAULT_TOP_RECOMMENDED,
    featuredProducts: Array.isArray(raw.featuredProducts)
      ? storedFeaturedProducts
      : DEFAULT_FEATURED_PRODUCTS,
    newArrivals: Array.isArray(raw.newArrivals)
      ? storedNewArrivals
      : DEFAULT_NEW_ARRIVALS,
    featuredCategories:
      Array.isArray(raw.featuredCategories) && storedCategories.length === 5
        ? storedCategories
        : DEFAULT_FEATURED_CATEGORIES,
  }

  return migrateOverrides(overrides)
}

const loadOverrides = (): CatalogueOverrides => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as
      | Partial<CatalogueOverrides>
      | null
    return normalizeOverrides(raw)
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
      isFeatured: overrides.featuredProducts.includes(product.id),
      isNewArrival: overrides.newArrivals.includes(product.id),
      isTopRecommended: overrides.topRecommended.includes(product.id),
    }
  })

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CatalogueOverrides>(loadOverrides)
  const [publishState, setPublishState] = useState<PublishState>(() =>
    isSupabaseConfigured
      ? { status: 'idle', message: 'Connected to the live storefront.' }
      : {
          status: 'local',
          message:
            'Admin backend not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).',
        },
  )
  const overridesRef = useRef(overrides)
  const publishChain = useRef<Promise<unknown>>(Promise.resolve())
  const revisionRef = useRef(0)
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

  // Pull the live Supabase data (or the bundled seed) on every visit.
  useEffect(() => {
    let cancelled = false
    const revisionAtStart = revisionRef.current

    fetchStorefrontOverrides()
      .then((raw) => {
        if (cancelled || !raw || revisionAtStart !== revisionRef.current) return
        const next = normalizeOverrides(raw)
        overridesRef.current = next
        setOverrides(next)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* storage blocked */
        }
      })
      .catch(() => {
        /* offline: keep the local cache or defaults */
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Live updates: when the Supabase row changes, every open browser refreshes.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    const unsubscribe = watchStorefront(() => {
      void (async () => {
        try {
          const raw = await fetchStorefrontOverrides()
          if (cancelled || !raw) return
          const next = normalizeOverrides(raw)
          overridesRef.current = next
          setOverrides(next)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* storage blocked */
          }
        } catch {
          /* keep the current state */
        }
      })()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const runPublish = useCallback(
    async (next: CatalogueOverrides, revision: number): Promise<boolean> => {
      if (!isSupabaseConfigured) {
        if (revision === revisionRef.current) {
          setPublishState({
            status: 'local',
            message:
              'Saved in this browser only. Connect Supabase to publish to every visitor.',
          })
        }
        return false
      }

      if (revision === revisionRef.current) {
        setPublishState({
          status: 'publishing',
          message: 'Publishing changes to the live storefront...',
        })
      }

      try {
        const materialized = await publishStorefront(next)
        if (revision === revisionRef.current) {
          overridesRef.current = materialized
          setOverrides(materialized)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(materialized))
          } catch {
            /* storage blocked */
          }
          setPublishState({
            status: 'success',
            message: 'Published. Every visitor now sees these changes.',
          })
        }
        return true
      } catch (error) {
        if (revision === revisionRef.current) {
          setPublishState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Could not publish changes to Supabase.',
          })
        }
        return false
      }
    },
    [],
  )

  const commit = useCallback(
    (next: CatalogueOverrides): boolean => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        overridesRef.current = next
        setOverrides(next)
      } catch {
        return false
      }

      const revision = ++revisionRef.current
      publishChain.current = publishChain.current
        .then(() => runPublish(next, revision))
        .catch(() => undefined)
      return true
    },
    [runPublish],
  )

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

  const resetAll = useCallback(() => commit(DEFAULTS), [commit])

  const publishNow = useCallback(async (): Promise<boolean> => {
    await publishChain.current.catch(() => undefined)
    const revision = ++revisionRef.current
    return runPublish(overridesRef.current, revision)
  }, [runPublish])

  const value: CatalogueContextValue = {
    products,
    overrides,
    featuredCollections: overrides.featuredCollections,
    bestSellers: overrides.bestSellers,
    topRecommended: overrides.topRecommended,
    featuredProducts: overrides.featuredProducts,
    newArrivals: overrides.newArrivals,
    featuredCategories: overrides.featuredCategories,
    publishState,
    savePrices,
    setProductImages,
    saveSelections,
    resetPrices,
    resetProductImages,
    resetAll,
    publishNow,
  }

  return (
    <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
  )
}
