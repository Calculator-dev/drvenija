"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { LocalizedProduct } from "@/lib/products"

const STORAGE_KEY = "drvenija-cart-v2"
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type CartItem = {
  lineId: string
  productId: string
  variantId?: string
  variantSku?: string
  dimensions?: string
  slug: string
  name: string
  image: string
  price: number
  quantity: number
  personalization?: string
  type: "standard" | "custom"
}

type CartContextValue = {
  items: CartItem[]
  isOpen: boolean
  setOpen: (open: boolean) => void
  addItem: (product: LocalizedProduct, options?: { quantity?: number; personalization?: string; variantId?: string }) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as CartItem[]
      setItems(parsed)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      isOpen,
      setOpen,
      addItem: (product, options) => {
        const quantity = Math.max(1, options?.quantity ?? 1)
        const personalization = options?.personalization?.trim() || undefined
        const variants = (product.variants?.filter((variant) => variant.active !== false) ?? []).length
          ? product.variants!.filter((variant) => variant.active !== false)
          : [{ id: `${product.id}-default`, sku: product.sku, dimensions: product.dimensions, price: product.price }]
        const selected = variants.find((variant) => variant.id === options?.variantId) ?? variants[0]
        const persistedVariantId = uuidPattern.test(selected.id) ? selected.id : undefined
        const lineId = `${product.id}:${selected.id}:${personalization ?? "base"}`
        setItems((current) => {
          const existing = current.find((item) => item.lineId === lineId)
          if (existing) {
            return current.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          }

          return [
            ...current,
            {
              lineId,
              productId: product.id,
              variantId: persistedVariantId,
              variantSku: selected.sku,
              dimensions: selected.dimensions,
              slug: product.localizedSlug,
              name: product.localizedName,
              image: product.primaryImage.url,
              price: selected.price,
              quantity,
              personalization,
              type: product.type,
            },
          ]
        })
        setOpen(true)
      },
      removeItem: (lineId) => {
        setItems((current) => current.filter((item) => item.lineId !== lineId))
      },
      updateQuantity: (lineId, quantity) => {
        setItems((current) =>
          current.map((item) => (item.lineId === lineId ? { ...item, quantity: Math.max(1, quantity) } : item)),
        )
      },
      clear: () => setItems([]),
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }
  }, [isOpen, items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used inside CartProvider")
  }

  return context
}
