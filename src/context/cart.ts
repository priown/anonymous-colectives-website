import { createContext, useContext } from 'react'
import type { Colour, Product } from '../data/catalogue'

export type CartItem = {
  id: string
  colour: string
  size: string
  qty: number
}

export type CartLine = {
  key: string
  item: CartItem
  product: Product
  colour: Colour | undefined
  image: string
  lineTotal: number
  originalPrice: number
  currentPrice: number
  hasDiscount: boolean
}

export type AddPayload = {
  id: string
  colour?: string
  size?: string
  qty?: number
}

export type CartContextValue = {
  items: CartItem[]
  lines: CartLine[]
  count: number
  total: number
  isOpen: boolean
  toast: string
  add: (payload: AddPayload) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
  showToast: (message: string) => void
  checkout: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
