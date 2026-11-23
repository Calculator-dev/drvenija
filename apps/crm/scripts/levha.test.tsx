import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../src/app.tsx'
import {
  ayahDraft, ayahPayload, ayahSaveError, ayahSortOrder, ayahVisibilityBody, combinationRows, configurationSummary, levhaPrice,
  newSizeDraft, nextSortOrder, priceLabel, pricingDraft, pricingExample, pricingPayload, requestRows, requestTextLabel,
  requestUpdateBody, textDirection, wholeKm,
  type AdminLevhaAyah, type AdminLevhaRequest, type AdminLevhaRequestDetail, type LevhaPricing,
} from '../src/lib/levha.ts'

// Same as defaultLevhaPricing in apps/api/src/lib/levha.ts.
const pricing: LevhaPricing = {
  sizes: [
    { width: 80, height: 40, price: 80 },
    { width: 80, height: 50, price: 90 },
    { width: 100, height: 60, price: 120 },
  ],
  pricePerSqm: 250,
  backgroundSurchargePct: { plywood: 0, plexiglass: 25 },
  letterSurchargePct: { plywood: 0, mdf: 0, plexiglass: 25 },
  minWidth: 40,
  minHeight: 40,
  maxAutoWidth: 100,
  maxAutoHeight: 60,
}

const arabic = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
const ayah: AdminLevhaAyah = {
  id: '3c1d1f4e-6a0b-4b8e-9f1a-2d3c4b5a6e7f',
  name: { bs: 'Bismillah', en: 'Basmala' },
  arabic,
  imageId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  image: { id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', url: 'https://example.com/bismillah.png', width: 1200, height: 400 },
  active: true,
  sortOrder: 2,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}
const hiddenAyah: AdminLevhaAyah = {
  ...ayah,
  id: '4d2e2f5f-7b1c-4c9f-8a2b-3e4d5c6b7a8f',
  name: { bs: 'Ajetul-kursija', en: 'Ajetul-kursija' },
  arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
  imageId: null,
  image: null,
  active: false,
  sortOrder: 1,
}

const requests: AdminLevhaRequest[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    number: 'LVH-261120-AB12CD',
    fullName: 'Amina Hadžić',
    price: 100,
    status: 'contacted',
    ayahName: 'Bismillah',
    configuration: { frame: 'black', size: { width: 80, height: 40 }, background: { material: 'plywood', colour: 'black' }, letters: { material: 'plexiglass', colour: 'gold' }, ayahId: ayah.id, customAyah: null },
    createdAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    number: 'LVH-261122-EF34GH',
    fullName: 'Emir Kovač',
    price: null,
    status: 'new',
    ayahName: null,
    configuration: { frame: 'wood', size: { width: 150, height: 80 }, background: { material: 'plexiglass', colour: 'gray' }, letters: { material: 'mdf', colour: 'raw' }, ayahId: null, customAyah: { text: `${arabic}\nالْحَمْدُ لِلَّهِ`, part: 'Samo prvi red' } },
    createdAt: '2026-11-22T10:00:00.000Z',
  },
]
const detail: AdminLevhaRequestDetail = {
  ...requests[1],
  locale: 'bs',
  email: 'emir@example.com',
  phone: '+387 61 123 456',
  notes: 'Molim za poklon.\nHvala!',
  adminNote: 'Pozvati u ponedjeljak',
  updatedAt: '2026-11-22T11:00:00.000Z',
}

const queryClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
function render(client: QueryClient, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return renderToString(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
}

test('cijena levhe se računa kao na API-ju', () => {
  const choose = (width: number, height: number, background: 'plywood' | 'plexiglass', letters: 'plywood' | 'mdf' | 'plexiglass') =>
    levhaPrice(pricing, { size: { width, height }, background: { material: background }, letters: { material: letters } })
  // Standard sizes use their own price, then the surcharges.
  assert.equal(choose(80, 40, 'plywood', 'plexiglass'), 100)
  assert.equal(choose(80, 40, 'plywood', 'plywood'), 80)
  assert.equal(choose(100, 60, 'plexiglass', 'plexiglass'), 180)
  // Other sizes are priced by area, in either orientation, up to the largest priced size.
  assert.equal(choose(60, 40, 'plywood', 'mdf'), 60)
  assert.equal(choose(60, 100, 'plywood', 'plywood'), 150)
  assert.equal(choose(45, 45, 'plexiglass', 'plywood'), 63)
  // Larger or smaller sizes are priced on request.
  assert.equal(choose(110, 50, 'plywood', 'plywood'), null)
  assert.equal(choose(70, 70, 'plywood', 'plywood'), null)
  assert.equal(choose(30, 40, 'plywood', 'plywood'), null)
  // Discounts never make the price negative.
  assert.equal(levhaPrice({ ...pricing, backgroundSurchargePct: { plywood: -100, plexiglass: 0 }, letterSurchargePct: { plywood: -50, mdf: 0, plexiglass: 0 } }, { size: { width: 80, height: 40 }, background: { material: 'plywood' }, letters: { material: 'plywood' } }), 0)
})

test('primjer i tabela kombinacija prate cjenovnik', () => {
  assert.equal(pricingExample(pricing), 'Primjer: 80 × 40, šperploča pozadina, pleksiglas slova = 100 KM')
  assert.equal(pricingExample({ ...pricing, sizes: [] }), null)
  const rows = combinationRows(pricing)
  assert.equal(rows.length, 6)
  assert.deepEqual(rows[0], { key: '80x40-plywood', size: '80 × 40 cm', background: 'Šperploča', prices: [{ letters: 'plywood', price: '80 KM' }, { letters: 'mdf', price: '80 KM' }, { letters: 'plexiglass', price: '100 KM' }] })
  assert.deepEqual(rows[5].prices.map(cell => cell.price), ['150 KM', '150 KM', '180 KM'])
  assert.equal(rows[5].background, 'Pleksiglas')
  assert.equal(wholeKm(1250), '1.250 KM')
  assert.equal(priceLabel(null), 'Na upit')
})

test('obrazac cijena vraća isti cjenovnik i provjerava pravila API-ja', () => {
  const draft = pricingDraft(pricing)
  assert.deepEqual(pricingPayload(draft), { body: pricing })
  assert.deepEqual(pricingPayload({ ...draft, pricePerSqm: ' 300 ' }).body?.pricePerSqm, 300)

  const errors = (change: Partial<typeof draft>) => pricingPayload({ ...draft, ...change }).errors ?? []
  assert.deepEqual(errors({ sizes: [] }), ['Dodajte najmanje jednu standardnu veličinu.'])
  assert.match(errors({ sizes: Array.from({ length: 13 }, (_value, index) => newSizeDraft({ width: 20 + index, height: 20, price: 10 })) })[0], /Najviše 12/)
  assert.deepEqual(errors({ sizes: [newSizeDraft({ width: 80, height: 40, price: 80 }), newSizeDraft({ width: 80, height: 40, price: 90 })] }), ['Standardne veličine se ne smiju ponavljati (ista širina i visina).'])
  assert.match(errors({ sizes: [{ ...draft.sizes[0], width: '9' }] })[0], /Veličina 1: širina i visina .* od 10 do 1000/)
  assert.match(errors({ sizes: [{ ...draft.sizes[0], height: '1001' }] })[0], /od 10 do 1000/)
  assert.match(errors({ sizes: [{ ...draft.sizes[0], price: '12.5' }] })[0], /Veličina 1: cijena mora biti cijeli iznos/)
  assert.match(errors({ sizes: [{ ...draft.sizes[0], price: '' }] })[0], /cijena/)
  assert.match(errors({ pricePerSqm: '-1' })[0], /Cijena po m²/)
  assert.match(errors({ backgroundSurchargePct: { plywood: '-101', plexiglass: '25' } })[0], /pozadinu od šperploče .* od −100 do 1000/)
  assert.match(errors({ letterSurchargePct: { plywood: '0', mdf: '1001', plexiglass: '25' } })[0], /slova od MDF-a/)
  assert.ok(pricingPayload({ ...draft, letterSurchargePct: { plywood: '-100', mdf: '1000', plexiglass: '0' } }).body)
  assert.match(errors({ minWidth: '5' })[0], /Najmanja širina/)
  assert.deepEqual(errors({ maxAutoHeight: '30' }), ['Najveća veličina s automatskom cijenom mora biti najmanje jednaka najmanjoj veličini.'])
  assert.ok(pricingPayload({ ...draft, maxAutoWidth: '40', maxAutoHeight: '40' }).body)
  assert.notEqual(newSizeDraft().key, newSizeDraft().key)
})

test('izbori levhe i zahtjevi imaju čitljive bosanske nazive', () => {
  assert.deepEqual(configurationSummary(requests[1].configuration), [
    { label: 'Okvir', value: 'Drveni' },
    { label: 'Veličina', value: '150 × 80 cm' },
    { label: 'Pozadina', value: 'Pleksiglas, sivo ogledalo' },
    { label: 'Slova', value: 'MDF, prirodni' },
  ])
  assert.deepEqual(configurationSummary({ ...requests[0].configuration, frame: 'white', background: { material: 'plywood', colour: 'wood' }, letters: { material: 'plexiglass', colour: 'gold' } }).map(item => item.value), ['Bijeli', '80 × 40 cm', 'Šperploča, drvo', 'Pleksiglas, zlatno ogledalo'])
  const rows = requestRows(requests)
  assert.deepEqual(rows.map(row => row.number), ['LVH-261122-EF34GH', 'LVH-261120-AB12CD'], 'najnoviji prvi')
  assert.equal(rows[0].price, 'Na upit')
  assert.equal(rows[0].status, 'Novi')
  assert.equal(rows[0].statusKey, 'new')
  assert.match(rows[0].text, /^Vlastiti tekst: /)
  assert.ok(rows[0].text.length <= 'Vlastiti tekst: '.length + 41)
  assert.equal(rows[1].text, 'Bismillah')
  assert.equal(rows[1].price, '100 KM')
  assert.equal(rows[1].status, 'Kontaktiran')
  assert.equal(requestTextLabel({ ayahName: null, configuration: requests[0].configuration }), 'Tekst iz ponude')
  assert.equal(textDirection(arabic), 'rtl')
  assert.equal(textDirection('Bismillah'), 'ltr')
})

test('promjena statusa šalje očišćenu internu bilješku', () => {
  assert.deepEqual(requestUpdateBody('accepted', '  Dogovoreno 120 KM  '), { body: { status: 'accepted', adminNote: 'Dogovoreno 120 KM' } })
  assert.deepEqual(requestUpdateBody('contacted', '   '), { body: { status: 'contacted', adminNote: null } })
  assert.match(requestUpdateBody('new', 'x'.repeat(5001)).error ?? '', /5000/)
})

test('obrazac teksta gradi tijelo zahtjeva i provjerava polja', () => {
  const draft = ayahDraft(ayah)
  assert.equal(draft.nameEn, 'Basmala')
  assert.equal(draft.sortOrder, '2')
  assert.equal(ayahDraft(hiddenAyah).nameEn, '', 'engleski naziv jednak bosanskom se prikazuje prazan')
  assert.deepEqual(ayahDraft(undefined, 7), { nameBs: '', nameEn: '', arabic: '', image: null, imageAlt: '', sortOrder: '7', active: true })
  assert.deepEqual(ayahPayload({ ...draft, nameBs: ' Bismillah ', imageAlt: ' Kaligrafija ' }), {
    body: { name: { bs: 'Bismillah', en: 'Basmala' }, arabic, imageId: ayah.imageId, imageAlt: 'Kaligrafija', active: true, sortOrder: 2 },
  })
  assert.equal('imageAlt' in (ayahPayload(draft).body ?? {}), false)
  assert.deepEqual(ayahPayload({ ...draft, image: null, imageAlt: 'x', sortOrder: '' }).body, { name: { bs: 'Bismillah', en: 'Basmala' }, arabic, imageId: null, active: true, sortOrder: 0 })
  assert.deepEqual(ayahPayload({ ...draft, nameBs: ' ', arabic: '', sortOrder: '-1' }).errors, ['Unesite naziv na bosanskom.', 'Unesite tekst na arapskom.', 'Redoslijed mora biti cijeli broj, 0 ili više.'])
  assert.deepEqual(ayahPayload({ ...draft, nameBs: 'x'.repeat(161), nameEn: 'y'.repeat(161), arabic: 'ب'.repeat(5001), imageAlt: 'z'.repeat(301), sortOrder: '1.5' }).errors?.length, 5)
  assert.deepEqual(ayahVisibilityBody(ayah, false), { name: ayah.name, arabic, imageId: ayah.imageId, active: false, sortOrder: 2 })
  assert.equal(nextSortOrder([]), 0)
  assert.equal(nextSortOrder([ayah, hiddenAyah]), 3)
  assert.deepEqual(ayahSortOrder([ayah, hiddenAyah]).map(item => item.sortOrder), [1, 2])
  assert.match(ayahSaveError({ status: 409, message: 'This image is used elsewhere.' }), /već koristi drugdje/)
  assert.match(ayahSaveError({ status: 400, message: 'The calligraphy image no longer exists. Upload it again.' }), /više ne postoji/)
  assert.match(ayahSaveError({ status: 400, message: 'Invalid' }), /nisu ispravni/)
  assert.equal(ayahSaveError({ message: 'Potrebna je prijava' }), 'Potrebna je prijava')
})

test('lista zahtjeva za levhe prikazuje tabelu, filtere i statuse', () => {
  const client = queryClient()
  client.setQueryData(['levha-requests'], requests)
  const html = render(client, '/levha')
  assert.match(html, /Levhe po mjeri/)
  assert.match(html, /aria-current="page"[^>]*href="\/levha"[^>]*>Zahtjevi</)
  assert.match(html, /href="\/levha\/tekstovi"/)
  assert.match(html, /href="\/levha\/cijene"/)
  assert.match(html, /aria-label="Filtriraj po statusu"/)
  for (const label of ['Svi', 'Novi', 'Kontaktiran', 'Prihvaćen', 'Odbijen']) assert.match(html, new RegExp(`>${label}<`))
  assert.ok(html.indexOf('LVH-261122-EF34GH') < html.indexOf('LVH-261120-AB12CD'), 'najnoviji prvi')
  assert.match(html, /Emir Kovač/)
  assert.match(html, /150 × 80 cm/)
  assert.match(html, /Na upit/)
  assert.match(html, /100 KM/)
  assert.match(html, /href="\/levha\/22222222-2222-4222-8222-222222222222"/)
  client.setQueryData(['levha-requests'], [])
  assert.match(render(client, '/levha'), /Još nema zahtjeva za levhe/)
  client.clear()
})

test('detalji zahtjeva prikazuju sve izbore, tekst zdesna nalijevo, kontakt i status', () => {
  const client = queryClient()
  client.setQueryData(['levha-request', detail.id], detail)
  const html = render(client, `/levha/${detail.id}`)
  assert.match(html, /LVH-261122-EF34GH/)
  assert.match(html, /Drveni/)
  assert.match(html, /Pleksiglas, sivo ogledalo/)
  assert.match(html, /MDF, prirodni/)
  assert.match(html, /Na upit \(veličina izvan cjenovnika\)/)
  assert.match(html, /Vlastiti tekst|vlastiti tekst/)
  assert.match(html, /dir="rtl"[^>]*class="[^"]*whitespace-pre-wrap/)
  assert.ok(html.includes(`${arabic}\nالْحَمْدُ لِلَّهِ`), 'prelomi redova su sačuvani')
  assert.match(html, /Samo prvi red/)
  assert.match(html, /href="mailto:emir@example.com"/)
  assert.match(html, /href="tel:\+38761123456"/)
  assert.match(html, /Molim za poklon\.\nHvala!/)
  assert.match(html, /aria-pressed="true"[^>]*>Novi</)
  assert.match(html, />Kontaktiran</)
  assert.match(html, /Prihvaćen/)
  assert.match(html, /Odbijen/)
  assert.match(html, /Interna bilješka/)
  assert.match(html, /Pozvati u ponedjeljak/)
  assert.match(html, /Sačuvaj bilješku/)
  client.clear()
})

test('detalji zahtjeva s tekstom iz ponude prikazuju arapski tekst', () => {
  const client = queryClient()
  const chosen = { ...detail, ...requests[0], email: 'amina@example.com', phone: null, notes: null, adminNote: null }
  client.setQueryData(['levha-request', chosen.id], chosen)
  client.setQueryData(['levha-ayahs'], [ayah])
  const html = render(client, `/levha/${chosen.id}`)
  assert.match(html, /Bismillah/)
  assert.match(html, new RegExp(`dir="rtl" lang="ar"[^>]*>${arabic}<`))
  assert.match(html, /100 KM/)
  assert.match(html, /Šperploča, crna/)
  assert.match(html, /Pleksiglas, zlatno ogledalo/)
  assert.match(html, /Kupac nije ostavio napomenu/)
  assert.doesNotMatch(html, /href="tel:/)
  client.clear()
})

test('stranica tekstova prikazuje arapski tekst, kaligrafiju i skrivanje', () => {
  const client = queryClient()
  client.setQueryData(['levha-ayahs'], [ayah, hiddenAyah])
  const html = render(client, '/levha/tekstovi')
  assert.match(html, /Tekstovi/)
  assert.match(html, /Novi tekst/)
  assert.ok(html.indexOf('Ajetul-kursija') < html.indexOf('Bismillah'), 'po redoslijedu')
  assert.match(html, /dir="rtl"/)
  assert.match(html, /bismillah\.png/)
  assert.match(html, /repeating-conic-gradient/)
  assert.match(html, /Basmala/)
  assert.match(html, /Aktivan/)
  assert.match(html, /Sakriven/)
  assert.match(html, />Sakrij</)
  assert.match(html, />Prikaži</)
  client.clear()
})

test('obrazac teksta objašnjava kaligrafiju i prima samo PNG/WebP', async () => {
  const { AyahForm } = await import('../src/pages/levha-texts.tsx')
  const client = queryClient()
  const html = renderToString(<QueryClientProvider client={client}><AyahForm ayah={ayah} sortOrder={3} onCancel={() => {}} onSaved={() => {}} /></QueryClientProvider>)
  assert.match(html, /Uredi tekst/)
  assert.match(html, /accept="image\/png,image\/webp"/)
  assert.match(html, /CNC datoteke/)
  assert.match(html, /prozirnom pozadinom/)
  assert.match(html, /kaligrafskim fontom/)
  assert.match(html, /<textarea dir="rtl" lang="ar"/)
  assert.match(html, /bismillah\.png/)
  assert.match(html, /Ukloni sliku/)
  assert.match(html, /value="Basmala"/)
  const empty = renderToString(<QueryClientProvider client={client}><AyahForm sortOrder={3} onCancel={() => {}} onSaved={() => {}} /></QueryClientProvider>)
  assert.match(empty, /Novi tekst/)
  assert.match(empty, /value="3"/)
  assert.match(empty, /Nema slike/)
  assert.match(empty, /Dodaj tekst/)
  client.clear()
})

test('stranica cijena prikazuje polja, pravilo, primjer i sve kombinacije', () => {
  const client = queryClient()
  client.setQueryData(['levha-pricing'], pricing)
  const html = render(client, '/levha/cijene')
  assert.match(html, /Kako se računa cijena/)
  assert.match(html, /cijena na upit/)
  assert.match(html, /40 × 40 cm/)
  assert.match(html, /100 × 60 cm, u bilo kojoj orijentaciji/)
  assert.match(html, /Primjer: 80 × 40, šperploča pozadina, pleksiglas slova = 100 KM/)
  assert.match(html, /Standardne veličine/)
  assert.match(html, /Dodaj veličinu/)
  assert.match(html, /Ukloni veličinu 3/)
  assert.match(html, /value="250"/)
  assert.match(html, /Pozadina: pleksiglas \(%\)/)
  assert.match(html, /Slova: MDF \(%\)/)
  assert.match(html, /Sve kombinacije/)
  assert.match(html, /180 KM/)
  assert.match(html, /Sačuvaj cijene/)
  client.clear()
})
