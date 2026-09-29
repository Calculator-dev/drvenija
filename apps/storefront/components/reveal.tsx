"use client"

import type { PropsWithChildren } from "react"
import { useEffect, useRef } from "react"

type RevealProps = PropsWithChildren<{
  className?: string
  y?: number
  delay?: number
}>

export function Reveal({ children, className, y = 28, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cleanup = () => undefined

    async function run() {
      const target = ref.current
      if (!target) return

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (prefersReducedMotion) return

      const gsap = await import("gsap")
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")

      gsap.default.registerPlugin(ScrollTrigger)

      const tween = gsap.default.fromTo(
        target,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          delay,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: target,
            start: "top 88%",
            once: true,
          },
        },
      )

      cleanup = () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    }

    void run()

    return () => cleanup()
  }, [delay, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
