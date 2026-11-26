import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../data/catalogue'
import { formatPrice, priceInfo, sizeName, waLink } from '../lib/shop'
import { useCatalogue } from './catalogue'
import {
  CartContext,
  type AddPayload,
  type CartContextValue,
  type CartItem,
  type CartLine,
} from './cart'

const KEY = 'ac:cart'

const loadItems = (): CartItem[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw)
      ? raw.filter(
          (item): item is CartItem =>
            Boolean(item) &&
            typeof item.id === 'string' &&
            Number(item.qty) > 0,
        )
      : []
  } catch {
    return []
  }
}

const keyOf = (item: CartItem): string =>
  [item.id, item.colour || '', item.size || ''].join('|')

const resolveLines = (items: CartItem[], products: Product[]): CartLine[] =>
  items
    .map((item) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) return null
      const info = priceInfo(product)
      const colour = product.colours.find((c) => c.name === item.colour)
      return {
        key: keyOf(item),
        item,
        product,
        colour,
        image: (colour && colour.image) || product.images[0],
        lineTotal: info.current * item.qty,
        originalPrice: info.original,
        currentPrice: info.current,
        hasDiscount: info.hasDiscount,
      }
    })
    .filter((line): line is CartLine => Boolean(line))

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalogue()
  const [items, setItems] = useState<CartItem[]>(loadItems)
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage blocked */
    }
  }, [items])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setItems(loadItems())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current)
    },
    [],
  )

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }, [])

  const add = useCallback((payload: AddPayload) => {
    const incoming: CartItem = {
      id: payload.id,
      colour: payload.colour || '',
      size: payload.size || '',
      qty: Math.max(1, Math.min(99, payload.qty || 1)),
    }
    setItems((current) => {
      const existing = current.find((item) => keyOf(item) === keyOf(incoming))
      if (existing) {
        return current.map((item) =>
          item === existing
            ? { ...item, qty: Math.min(99, item.qty + incoming.qty) }
            : item,
        )
      }
      return [...current, incoming]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((current) => {
      if (qty < 1) return current.filter((item) => keyOf(item) !== key)
      return current.map((item) =>
        keyOf(item) === key ? { ...item, qty: Math.min(99, qty) } : item,
      )
    })
  }, [])

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((item) => keyOf(item) !== key))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const lines = useMemo(() => resolveLines(items, products), [items, products])
  const count = useMemo(
    () => lines.reduce((total, line) => total + line.item.qty, 0),
    [lines],
  )
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.lineTotal, 0),
    [lines],
  )

  const checkout = useCallback(() => {
    const currentLines = lines
    if (!currentLines.length) return

    const message = ['Hello Anonymous Collectives, I would like to order:', '']
    currentLines.forEach((line, index) => {
      message.push(`${index + 1}. ${line.product.name}`)
      if (line.item.colour) message.push(`   Colour: ${line.item.colour}`)
      if (line.item.size) message.push(`   Size: ${sizeName(line.item.size)}`)
      message.push(`   Quantity: ${line.item.qty}`)
      message.push(
        `   Price: ${formatPrice(line.currentPrice)}${
          line.hasDiscount
            ? ` (discounted from ${formatPrice(line.originalPrice)})`
            : ''
        } each = ${formatPrice(line.lineTotal)}`,
      )
      message.push('')
    })
    const orderTotal = currentLines.reduce((sum, line) => sum + line.lineTotal, 0)
    message.push(
      `Total: ${formatPrice(orderTotal)}`,
      '',
      'Please let me know how to proceed with my order.',
    )
    const url = waLink(message.join('\n'))
    const opened = window.open(url, '_blank', 'noopener')
    if (!opened) window.location.assign(url)
  }, [lines])

  const value: CartContextValue = {
    items,
    lines,
    count,
    total,
    isOpen,
    toast,
    add,
    setQty,
    remove,
    clear,
    openCart,
    closeCart,
    showToast,
    checkout,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
