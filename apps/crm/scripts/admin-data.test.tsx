import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { seedDashboard, seedProducts } from './fixtures.ts'
import { dashboardView, orderRows, productRows } from '../src/lib/admin-data.ts'
import { App } from '../src/app.tsx'

test('API odgovor kontrolne ploče prikazuje se bez greške', () => {
  const data = dashboardView(seedDashboard)
  assert.equal(data.totals.length, 5)
  assert.equal(data.totals[0].value, '4')
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  client.setQueryData(['dashboard'], data)
  client.setQueryData(['products'], productRows(seedProducts))
  client.setQueryData(['orders'], orderRows(seedDashboard.recentOrders))
  const html = renderToString(<QueryClientProvider client={client}><App /></QueryClientProvider>)
  assert.match(html, /Današnje narudžbe/)
  assert.match(html, /DRV-104251/)
  assert.match(html, /98,00\u00a0KM/)
  client.clear()
})

test('API proizvodi se mapiraju u lokalizovane ćelije tabele', () => {
  const products = productRows(seedProducts)
  assert.equal(products[0].name, 'Monogram za vjenčanje')
  assert.equal(products[0].price, '45,00 KM+')
  assert.deepEqual(productRows([]), [])
})

test('obrazac proizvoda prikazuje tok za prvi proizvod bez postojećih kategorija', async () => {
  const { ProductForm } = await import('../src/components/product-form.tsx')
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  client.setQueryData(['categories'], [])
  const html = renderToString(<QueryClientProvider client={client}><ProductForm onSaved={() => {}} onCancel={() => {}} /></QueryClientProvider>)
  assert.match(html, /Dodaj proizvod/)
  assert.match(html, /Kreiraj kategoriju/)
  assert.match(html, /Još nema kategorija/)
  assert.match(html, /Sačuvaj proizvod/)
  assert.match(html, /Naziv proizvoda na bosanskom/)
  client.clear()
})

test('obrazac za uređivanje popunjen je sačuvanim detaljima proizvoda', async () => {
  const { ProductForm } = await import('../src/components/product-form.tsx')
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  client.setQueryData(['categories'], [{ id: 'category-id', translations: { bs: { name: 'Dom' } } }])
  const product = { ...seedProducts[0], id: 'product-id', categoryId: 'category-id', price: 72, featured: true }
  const html = renderToString(<QueryClientProvider client={client}><ProductForm product={product} onSaved={() => {}} onCancel={() => {}} /></QueryClientProvider>)
  assert.match(html, /Uredi proizvod/)
  assert.match(html, /Sačuvaj izmjene/)
  assert.match(html, /value="72"/)
  assert.match(html, /value="DRV-MONO-01"/)
  assert.match(html, /value="category-id" selected/)
  assert.match(html, /Monogram za vjenčanje/)
  assert.equal(productRows([product])[0].id, 'product-id')
  client.clear()
})

test('sačuvane slike proizvoda prikazuju pregled, opise i kontrole glavne slike', async () => {
  const { ProductImages } = await import('../src/components/product-images.tsx')
  const images = [{ id: 'image-id', url: 'https://example.com/photo.webp', width: 400, height: 300, alt: { bs: 'Drveni natpis', en: 'Wooden sign' }, isPrimary: true }]
  const html = renderToString(<ProductImages images={images} onChange={() => {}} onBusy={() => {}} disabled={false} />)
  assert.match(html, /Slike proizvoda/)
  assert.match(html, /photo.webp/)
  assert.match(html, /Drveni natpis/)
  assert.match(html, /Glavna/)
  assert.match(html, /Ukloni/)
  assert.match(html, /image\/jpeg,image\/png,image\/webp/)
})
