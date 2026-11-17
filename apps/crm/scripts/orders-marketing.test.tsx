import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { seedDashboard, seedOrderDetail, seedProducts } from './fixtures.ts'
import { localizedOrderStatus, nextFulfilmentSteps, orderRows, productRows, statusEmailMessage } from '../src/lib/admin-data.ts'
import { discountPayload, discountStatus, discountUsageLabel, discountValueLabel, sortReviews, subscribersCsv, toDateTimeLocal, type AdminReview } from '../src/lib/marketing.ts'
import { routes } from '../src/app.tsx'

const client = () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
function render(queryClient: QueryClient, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return renderToString(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
}

test('sljedeći koraci izrade idu samo naprijed i samo za prihvaćene narudžbe', () => {
  assert.deepEqual(nextFulfilmentSteps('confirmed').map(step => step.status), ['in_production', 'packed', 'shipped', 'completed'])
  assert.deepEqual(nextFulfilmentSteps('packed').map(step => step.label), ['Poslano', 'Završeno'])
  assert.deepEqual(nextFulfilmentSteps('completed'), [])
  assert.deepEqual(nextFulfilmentSteps('submitted'), [])
  assert.deepEqual(nextFulfilmentSteps('declined'), [])
})

test('statusi narudžbi i plaćanja imaju čitljive nazive', () => {
  for (const [status, label] of [['submitted', 'Zaprimljena'], ['confirmed', 'Prihvaćena'], ['declined', 'Odbijena'], ['in_production', 'U izradi'], ['packed', 'Spakovana'], ['shipped', 'Poslana'], ['completed', 'Završena']]) {
    assert.equal(localizedOrderStatus(status), label)
  }
  const [withPayment, withoutPayment] = orderRows(seedDashboard.recentOrders)
  assert.equal(withPayment.payment, 'Čeka uplatu')
  assert.equal(withPayment.paymentMethod, 'Uplata na račun')
  assert.equal(withoutPayment.payment, '—')
})

test('poruka o emailu nakon promjene statusa', () => {
  assert.match(statusEmailMessage(null), /nije poslan email/)
  assert.match(statusEmailMessage({ sent: true }), /poslan email/)
  assert.match(statusEmailMessage({ sent: false, reason: 'not_configured' }), /nije konfigurisan/)
  assert.match(statusEmailMessage({ sent: false, reason: 'delivery_failed' }), /nije isporučen/)
})

test('detalji narudžbe prikazuju plaćanje, poklon, popust i korake izrade', () => {
  const queryClient = client()
  queryClient.setQueryData(['order', seedOrderDetail.id], seedOrderDetail)
  const html = render(queryClient, `/orders/${seedOrderDetail.id}`)
  assert.match(html, /Plaćanje pouzećem/)
  assert.match(html, /Plaćeno/)
  assert.match(html, /Poništi oznaku plaćanja/)
  assert.match(html, /Sretan rođendan!/)
  assert.match(html, /PROLJECE10/)
  assert.match(html, /−12,00\u00a0KM/)
  assert.match(html, /Poklon pakovanje/)
  assert.match(html, /113,00\u00a0KM/)
  assert.match(html, /Izrada i dostava/)
  assert.match(html, /aria-current="step"/)
  assert.match(html, /Sljedeći korak: Poslano/)
  assert.match(html, /Preskoči na: Završeno/)
  assert.match(html, /Broj za praćenje pošiljke/)
  assert.match(html, /Pošalji email kupcu/)
  queryClient.clear()
})

test('zaprimljena narudžba nema panel izrade i nudi označavanje uplate', () => {
  const queryClient = client()
  queryClient.setQueryData(['order', seedOrderDetail.id], { ...seedOrderDetail, status: 'submitted', paymentStatus: 'pending_manual', paymentMethod: 'bank_transfer', giftWrap: false, giftMessage: null, discountCode: null, discountAmount: 0 })
  const html = render(queryClient, `/orders/${seedOrderDetail.id}`)
  assert.match(html, /Uplata na račun/)
  assert.match(html, /Označi kao plaćeno/)
  assert.doesNotMatch(html, /Izrada i dostava/)
  assert.doesNotMatch(html, /Poklon pakovanje/)
  assert.match(html, /Prihvati narudžbu/)
  queryClient.clear()
})

test('lista proizvoda prikazuje oznaku objave i brzu promjenu', () => {
  const queryClient = client()
  queryClient.setQueryData(['products'], productRows([seedProducts[0], { ...seedProducts[1], published: false }]))
  const html = render(queryClient, '/products')
  assert.match(html, /Objavljeno/)
  assert.match(html, /Skica/)
  assert.match(html, /Sakrij s webshopa: Monogram za vjenčanje/)
  assert.match(html, /Objavi na webshopu: Logo natpis za biznis/)
  queryClient.clear()
})

test('status koda za popust', () => {
  const now = new Date('2026-06-01T12:00:00Z')
  const base = { active: true, startsAt: null, endsAt: null, maxUses: null, usedCount: 0 }
  assert.equal(discountStatus(base, now).label, 'Aktivan')
  assert.equal(discountStatus({ ...base, active: false }, now).label, 'Neaktivan')
  assert.equal(discountStatus({ ...base, endsAt: '2026-05-31T00:00:00Z' }, now).label, 'Istekao')
  assert.equal(discountStatus({ ...base, maxUses: 3, usedCount: 3 }, now).label, 'Iskorišten')
  assert.equal(discountStatus({ ...base, startsAt: '2026-07-01T00:00:00Z' }, now).label, 'Zakazan')
  assert.equal(discountUsageLabel({ usedCount: 3, maxUses: 50 }), '3 / 50')
  assert.equal(discountUsageLabel({ usedCount: 3, maxUses: null }), '3 / ∞')
  assert.equal(discountValueLabel({ kind: 'percent', value: 10 }), '10 %')
  assert.equal(discountValueLabel({ kind: 'fixed', value: 15 }), '15,00\u00a0KM')
})

test('obrazac koda za popust gradi tijelo zahtjeva i provjerava unos', () => {
  const form = new FormData()
  form.set('code', ' proljece-10 ')
  form.set('kind', 'percent')
  form.set('value', '10')
  form.set('minSubtotal', '')
  form.set('startsAt', '2026-05-01T08:00')
  form.set('endsAt', '')
  form.set('maxUses', '50')
  form.set('active', 'on')
  const { body } = discountPayload(form)
  assert.ok(body)
  assert.equal(body.code, 'PROLJECE-10')
  assert.equal(body.minSubtotal, 0)
  assert.equal(body.maxUses, 50)
  assert.equal(body.endsAt, null)
  assert.equal(body.startsAt, new Date('2026-05-01T08:00').toISOString())
  assert.equal(toDateTimeLocal(body.startsAt), '2026-05-01T08:00')
  assert.equal(body.active, true)

  form.set('value', '150')
  form.set('code', 'a!')
  form.set('endsAt', '2026-04-01T08:00')
  form.delete('active')
  const invalid = discountPayload(form)
  assert.equal(invalid.body, undefined)
  assert.equal(invalid.errors?.length, 3)

  form.set('value', '150')
  form.set('kind', 'fixed')
  form.set('code', 'FIKSNO')
  form.set('endsAt', '')
  form.set('maxUses', '')
  const fixed = discountPayload(form)
  assert.deepEqual(fixed.body && { kind: fixed.body.kind, value: fixed.body.value, maxUses: fixed.body.maxUses, active: fixed.body.active }, { kind: 'fixed', value: 150, maxUses: null, active: false })
})

test('stranica popusta prikazuje korištenje, važenje i status', () => {
  const queryClient = client()
  queryClient.setQueryData(['discounts'], [{ id: 'd1', code: 'PROLJECE10', kind: 'percent', value: 10, minSubtotal: 50, startsAt: null, endsAt: null, maxUses: 50, usedCount: 3, active: true, createdAt: '2026-04-01T00:00:00Z' }])
  const html = render(queryClient, '/discounts')
  assert.match(html, /Popusti/)
  assert.match(html, /PROLJECE10/)
  assert.match(html, /3 \/ 50/)
  assert.match(html, /Bez ograničenja/)
  assert.match(html, /Aktivan/)
  assert.match(html, /Obriši kod PROLJECE10/)
  queryClient.clear()
})

const review = (id: string, status: AdminReview['status'], createdAt: string): AdminReview => ({ id, productId: 'p', orderId: 'o', authorName: 'Amina', rating: 4, body: 'Odlično!', locale: 'bs', status, reviewedAt: null, createdAt, productName: 'Monogram' })

test('recenzije na čekanju su prve, zatim najnovije', () => {
  const sorted = sortReviews([review('a', 'approved', '2026-05-03'), review('b', 'pending', '2026-05-01'), review('c', 'rejected', '2026-05-02'), review('d', 'pending', '2026-05-04')])
  assert.deepEqual(sorted.map(item => item.id), ['d', 'b', 'a', 'c'])
  const queryClient = client()
  queryClient.setQueryData(['reviews'], [review('a', 'approved', '2026-05-03'), review('b', 'pending', '2026-05-01')])
  const html = render(queryClient, '/reviews')
  assert.match(html, /Ocjena 4 od 5/)
  assert.match(html, /Na čekanju/)
  assert.match(html, /Odobri/)
  assert.match(html, /Vrati na čekanje/)
  queryClient.clear()
})

test('CSV pretplatnika ima zaglavlje, datume i siguran escape', () => {
  const csv = subscribersCsv([
    { id: '1', email: 'amina@example.com', locale: 'bs', createdAt: '2026-05-01T10:00:00.000Z' },
    { id: '2', email: '=cmd"x"@example.com', locale: 'en', createdAt: '2026-05-02T10:00:00.000Z' },
  ])
  assert.equal(csv, 'email,jezik,datum\r\namina@example.com,bs,2026-05-01\r\n"\'=cmd""x""@example.com",en,2026-05-02\r\n')
  assert.equal(subscribersCsv([]), 'email,jezik,datum\r\n')
  const queryClient = client()
  queryClient.setQueryData(['newsletter'], [{ id: '1', email: 'amina@example.com', locale: 'bs', createdAt: '2026-05-01T10:00:00.000Z' }])
  const html = render(queryClient, '/newsletter')
  assert.match(html, /Preuzmi CSV/)
  assert.match(html, /amina@example.com/)
  assert.match(html, /Bosanski/)
  queryClient.clear()
})
