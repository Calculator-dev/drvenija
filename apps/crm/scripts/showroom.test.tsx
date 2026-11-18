import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../src/app.tsx'
import {
  addOutlinePoint, areaHeightCm, clampArea, defaultArtArea, defaultWallOutline, deltaToPercent, moveArea, moveOutlinePoint,
  outlineClipPath, outlineSvgPoints, pointerToPercent, removeOutlinePoint, resizeArea, setAreaField, showroomDraft,
  showroomPayload, showroomSaveError, undoOutlinePoint, withNewPhoto, withoutPhoto, type OutlinePoint, type ShowroomSettings,
} from '../src/lib/showroom.ts'

const settings: ShowroomSettings = {
  image: { id: '6f1c2b8e-3f0a-4c55-9d7e-1a2b3c4d5e6f', url: 'https://example.com/room.webp', width: 1600, height: 1000 },
  artArea: { x: 25, y: 10, width: 50, height: 40 },
  wallOutline: [[0, 0], [100, 0], [100, 55], [60, 70], [0, 55]],
  areaWidthCm: 150,
  updatedAt: '2026-11-01T10:00:00.000Z',
}

function render(client: QueryClient, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return renderToString(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
}
const queryClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })

test('showroom bez postavki počinje od zadanih vrijednosti', () => {
  const draft = showroomDraft(null)
  assert.deepEqual(draft, { image: null, artArea: { x: 30, y: 15, width: 40, height: 35 }, wallOutline: [[0, 0], [100, 0], [100, 60], [0, 60]], areaWidthCm: '120' })
  const saved = showroomDraft(settings)
  assert.equal(saved.areaWidthCm, '150')
  assert.deepEqual(saved.wallOutline, settings.wallOutline)
  saved.wallOutline[0][0] = 5
  assert.equal(settings.wallOutline[0][0], 0, 'nacrt ne mijenja podatke iz keša')
})

test('nova fotografija vraća zadane oznake, a uklanjanje čuva upotrebljiv obris', () => {
  const draft = showroomDraft(settings)
  const replaced = withNewPhoto(draft, { id: 'new', url: 'https://example.com/new.webp', width: 800, height: 600 })
  assert.equal(replaced.image?.id, 'new')
  assert.deepEqual(replaced.artArea, defaultArtArea())
  assert.deepEqual(replaced.wallOutline, defaultWallOutline())
  assert.equal(replaced.areaWidthCm, '150')
  assert.equal(withoutPhoto(draft).image, null)
  assert.deepEqual(withoutPhoto(draft).wallOutline, settings.wallOutline)
  assert.deepEqual(withoutPhoto({ ...draft, wallOutline: [[1, 1]] }).wallOutline, defaultWallOutline())
})

test('položaj pokazivača pretvara se u postotke unutar fotografije', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 }
  assert.deepEqual(pointerToPercent(300, 150, rect), [50, 50])
  assert.deepEqual(pointerToPercent(100, 50, rect), [0, 0])
  assert.deepEqual(pointerToPercent(0, 400, rect), [0, 100])
  assert.deepEqual(pointerToPercent(900, -10, rect), [100, 0])
  assert.deepEqual(pointerToPercent(233, 117, rect), [33.25, 33.5])
  assert.deepEqual(pointerToPercent(10, 10, { left: 0, top: 0, width: 0, height: 0 }), [0, 0])
  assert.deepEqual(deltaToPercent(40, -20, rect), [10, -10])
})

test('pravougaonik ostaje unutar fotografije pri pomjeranju', () => {
  const area = { x: 30, y: 15, width: 40, height: 35 }
  assert.deepEqual(moveArea(area, 10, 5), { x: 40, y: 20, width: 40, height: 35 })
  assert.deepEqual(moveArea(area, 80, 90), { x: 60, y: 65, width: 40, height: 35 })
  assert.deepEqual(moveArea(area, -50, -50), { x: 0, y: 0, width: 40, height: 35 })
  assert.deepEqual(clampArea({ x: -5, y: 99, width: 150, height: 1 }), { x: 0, y: 98, width: 100, height: 2 })
  assert.deepEqual(clampArea({ x: Number.NaN, y: 10, width: 20, height: 20 }), { x: 0, y: 10, width: 20, height: 20 })
  // Rounding never pushes the area past the right edge.
  const rounded = clampArea({ x: 66.665, y: 0, width: 33.335, height: 10 })
  assert.ok(rounded.x + rounded.width <= 100.001)
})

test('promjena veličine pomjera samo povučeni ugao', () => {
  const area = { x: 30, y: 15, width: 40, height: 35 }
  assert.deepEqual(resizeArea(area, 'se', 10, 5), { x: 30, y: 15, width: 50, height: 40 })
  assert.deepEqual(resizeArea(area, 'nw', -10, -5), { x: 20, y: 10, width: 50, height: 40 })
  assert.deepEqual(resizeArea(area, 'ne', 5, 5), { x: 30, y: 20, width: 45, height: 30 })
  assert.deepEqual(resizeArea(area, 'sw', 5, -5), { x: 35, y: 15, width: 35, height: 30 })
  // Stops at the photo's edges…
  assert.deepEqual(resizeArea(area, 'se', 100, 100), { x: 30, y: 15, width: 70, height: 85 })
  assert.deepEqual(resizeArea(area, 'nw', -100, -100), { x: 0, y: 0, width: 70, height: 50 })
  // …and never gets smaller than 2 % or flips over.
  assert.deepEqual(resizeArea(area, 'se', -100, -100), { x: 30, y: 15, width: 2, height: 2 })
  assert.deepEqual(resizeArea(area, 'nw', 100, 100), { x: 68, y: 48, width: 2, height: 2 })
})

test('numerička polja mijenjaju pravougaonik bez izlaska iz fotografije', () => {
  const area = { x: 30, y: 15, width: 40, height: 35 }
  assert.deepEqual(setAreaField(area, 'x', 45.5), { ...area, x: 45.5 })
  assert.deepEqual(setAreaField(area, 'x', 80), { ...area, x: 60 })
  assert.deepEqual(setAreaField(area, 'y', -3), { ...area, y: 0 })
  assert.deepEqual(setAreaField(area, 'width', 90), { ...area, width: 70 })
  assert.deepEqual(setAreaField(area, 'height', 1), { ...area, height: 2 })
  assert.equal(setAreaField(area, 'width', Number.NaN), area)
})

test('tačke obrisa zida dodaju se, pomjeraju i poništavaju', () => {
  let outline: OutlinePoint[] = []
  outline = addOutlinePoint(outline, [10, 10])
  outline = addOutlinePoint(outline, [120, -4])
  outline = addOutlinePoint(outline, [50, 60.123])
  assert.deepEqual(outline, [[10, 10], [100, 0], [50, 60.12]])
  assert.deepEqual(moveOutlinePoint(outline, 1, [90, 5]), [[10, 10], [90, 5], [50, 60.12]])
  assert.equal(moveOutlinePoint(outline, 7, [1, 1]), outline)
  assert.deepEqual(removeOutlinePoint(outline, 0), [[100, 0], [50, 60.12]])
  assert.deepEqual(undoOutlinePoint(outline), [[10, 10], [100, 0]])
  assert.deepEqual(undoOutlinePoint([]), [])
  const full = Array.from({ length: 60 }, (_value, index): OutlinePoint => [index, index])
  assert.equal(addOutlinePoint(full, [1, 1]).length, 60)
  assert.equal(outlineClipPath([[0, 0], [100, 0], [50, 60]]), 'polygon(0% 0%, 100% 0%, 50% 60%)')
  assert.equal(outlineSvgPoints([[0, 0], [100, 0], [50, 60]]), '0,0 100,0 50,60')
})

test('visina označenog prostora računa se iz širine u cm i proporcija fotografije', () => {
  // 50 % of 1600 px = 800 px wide, 40 % of 1000 px = 400 px high → half the width.
  assert.equal(areaHeightCm(settings.artArea, 150, settings.image!), 75)
  assert.equal(areaHeightCm(settings.artArea, Number.NaN, settings.image!), null)
})

test('tijelo zahtjeva za showroom i poruke o greškama', () => {
  const draft = showroomDraft(settings)
  assert.deepEqual(showroomPayload(draft), { body: { imageId: settings.image!.id, artArea: settings.artArea, wallOutline: settings.wallOutline, areaWidthCm: 150 } })
  assert.equal(showroomPayload(withoutPhoto(draft)).body?.imageId, null)
  assert.deepEqual(showroomPayload({ ...draft, areaWidthCm: ' 120 ' }).body?.areaWidthCm, 120)

  const invalid = showroomPayload({ ...draft, wallOutline: [[0, 0], [10, 10]], areaWidthCm: '12.5', artArea: { x: 90, y: 0, width: 20, height: 1 } })
  assert.deepEqual(invalid.errors, [
    'Prostor za sliku mora biti unutar fotografije i velik najmanje 2 % širine i visine.',
    'Obris zida mora imati najmanje 3 tačke.',
    'Širina označenog prostora mora biti cijeli broj centimetara, od 20 do 1000.',
  ])
  for (const width of ['', '19', '1001', 'abc']) assert.ok(showroomPayload({ ...draft, areaWidthCm: width }).errors)
  assert.ok(showroomPayload({ ...draft, areaWidthCm: '20' }).body)
  assert.ok(showroomPayload({ ...draft, areaWidthCm: '1000' }).body)
  assert.match(showroomPayload({ ...draft, wallOutline: [[0, 0], [100, 0], [50, 101]] }).errors?.[0] ?? '', /unutar fotografije/)
  assert.match(showroomPayload({ ...draft, wallOutline: Array.from({ length: 61 }, (): OutlinePoint => [1, 1]) }).errors?.[0] ?? '', /najviše 60/)

  assert.match(showroomSaveError({ status: 409, message: 'This photo belongs to a product.' }), /pripada proizvodu/)
  assert.match(showroomSaveError({ status: 400, message: 'The showroom photo no longer exists. Upload it again.' }), /više ne postoji/)
  assert.match(showroomSaveError({ status: 400, message: 'Invalid' }), /nisu ispravni/)
  assert.equal(showroomSaveError({ message: 'Potrebna je prijava' }), 'Potrebna je prijava')
})

test('stranica showrooma prikazuje upute i zadane vrijednosti kad još nije podešena', () => {
  const client = queryClient()
  client.setQueryData(['showroom'], null)
  const html = render(client, '/showroom')
  assert.match(html, /href="\/showroom"/)
  assert.match(html, /Showroom još nije podešen/)
  assert.match(html, /Dodaj fotografiju/)
  assert.match(html, /image\/jpeg,image\/png,image\/webp/)
  assert.match(html, /Dodajte fotografiju sobe/)
  assert.match(html, /Širina označenog prostora u cm/)
  assert.match(html, /value="120"/)
  assert.match(html, /value="30"/)
  assert.match(html, /Sačuvaj/)
  client.clear()
})

test('stranica showrooma prikazuje sačuvanu fotografiju s oznakama', () => {
  const client = queryClient()
  client.setQueryData(['showroom'], settings)
  const html = render(client, '/showroom')
  assert.doesNotMatch(html, /još nije podešen/)
  assert.match(html, /room\.webp/)
  assert.match(html, /aspect-ratio:1600 \/ 1000/)
  assert.match(html, /left:25%;top:10%;width:50%;height:40%/)
  assert.match(html, /points="0,0 100,0 100,55 60,70 0,55"/)
  assert.match(html, /Zamijeni fotografiju/)
  assert.match(html, /Ukloni fotografiju/)
  assert.match(html, /Poništi zadnju tačku/)
  assert.match(html, /Počni ispočetka/)
  assert.match(html, /Pregled boje zida/)
  assert.match(html, /#9fb59a/)
  assert.match(html, /5 tačaka/)
  assert.match(html, /oko 75 cm/)
  client.clear()
})
