"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "drvenija-wishlist-v1"

type WishlistContextValue = {
  ids: string[]
  has: (productId: string) => boolean
  toggle: (productId: string) => boolean
  remove: (productId: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

/** Saved products, kept in this browser only. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
      if (Array.isArray(parsed)) setIds(parsed.filter((id): id is string => typeof id === "string").slice(0, 200))
    } catch {
      // Blocked storage or corrupt data: start with an empty list.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Storage unavailable: the list still works for this page view.
    }
  }, [ids, loaded])

  const has = useCallback((productId: string) => ids.includes(productId), [ids])
  const toggle = useCallback((productId: string) => {
    const adding = !ids.includes(productId)
    setIds(current => adding ? [productId, ...current.filter(id => id !== productId)] : current.filter(id => id !== productId))
    return adding
  }, [ids])
  const remove = useCallback((productId: string) => setIds(current => current.filter(id => id !== productId)), [])

  const value = useMemo(() => ({ ids, has, toggle, remove }), [ids, has, toggle, remove])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider")
  return context
}
