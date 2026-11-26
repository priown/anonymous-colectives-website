import { createContext, useContext } from 'react'
import type { Product } from '../data/catalogue'

export type PriceOverride = { old: number; sale: number | null }

export type HomepageSelections = {
  featuredCollections: string[]
  bestSellers: string[]
  featuredCategories: string[]
}

export type CatalogueOverrides = {
  prices: Record<string, PriceOverride>
  images: Record<string, string[]>
} & HomepageSelections

export type CatalogueContextValue = {
  products: Product[]
  overrides: CatalogueOverrides
  featuredCollections: string[]
  bestSellers: string[]
  featuredCategories: string[]
  savePrices: (prices: Record<string, PriceOverride>) => boolean
  setProductImages: (id: string, images: string[]) => boolean
  saveSelections: (selections: HomepageSelections) => boolean
  resetPrices: () => boolean
  resetProductImages: (id: string) => boolean
  resetAll: () => boolean
}

export const CatalogueContext = createContext<CatalogueContextValue | null>(null)

export function useCatalogue(): CatalogueContextValue {
  const context = useContext(CatalogueContext)
  if (!context) {
    throw new Error('useCatalogue must be used inside CatalogueProvider')
  }
  return context
}
