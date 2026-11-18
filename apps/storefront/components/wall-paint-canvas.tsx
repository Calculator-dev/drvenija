"use client"

import { useEffect, useRef, useState } from "react"
import { repaintWall, wallReference, type ShowroomConfig } from "@/lib/showroom"

type Prepared = { width: number; height: number; photo: Uint8ClampedArray; mask: Uint8ClampedArray; reference: [number, number, number] }

// Photos are repainted at up to this width; the canvas is scaled to the viewer's size.
const maxWidth = 1400

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

async function prepare(config: ShowroomConfig): Promise<Prepared> {
  const photo = await loadImage(config.image.url)
  const scale = Math.min(1, maxWidth / photo.naturalWidth)
  const width = Math.round(photo.naturalWidth * scale)
  const height = Math.round(photo.naturalHeight * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })!
  context.drawImage(photo, 0, 0, width, height)
  const photoPixels = context.getImageData(0, 0, width, height).data

  // The wall: the precise mask image when there is one, otherwise the outline from the CRM.
  context.clearRect(0, 0, width, height)
  if (config.wallMaskUrl) {
    context.drawImage(await loadImage(config.wallMaskUrl), 0, 0, width, height)
  } else {
    context.beginPath()
    config.wallOutline.forEach(([x, y], index) => {
      const point = [(x / 100) * width, (y / 100) * height] as const
      if (index === 0) context.moveTo(...point)
      else context.lineTo(...point)
    })
    context.closePath()
    context.fillStyle = "#000"
    context.fill()
  }
  const mask = context.getImageData(0, 0, width, height).data
  return { width, height, photo: photoPixels, mask, reference: wallReference(photoPixels, mask) }
}

/**
 * The wall in the chosen colour, drawn over the room photo. Only wall pixels are painted;
 * everything else stays transparent so the photo shows through.
 */
export function WallPaintCanvas({ config, colour }: { config: ShowroomConfig; colour: string | null }) {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [prepared, setPrepared] = useState<Prepared | null>(null)

  useEffect(() => {
    let cancelled = false
    prepare(config).then(result => { if (!cancelled) setPrepared(result) }, () => { /* Photo unavailable: no repaint. */ })
    return () => { cancelled = true }
  }, [config])

  useEffect(() => {
    const element = canvas.current
    if (!element || !prepared || !colour) return
    element.width = prepared.width
    element.height = prepared.height
    const context = element.getContext("2d")!
    const output = context.createImageData(prepared.width, prepared.height)
    repaintWall(prepared.photo, prepared.mask, prepared.reference, colour, output.data)
    context.putImageData(output, 0, 0)
  }, [prepared, colour])

  if (!colour) return null
  return <canvas ref={canvas} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${prepared ? "opacity-100" : "opacity-0"}`} />
}
