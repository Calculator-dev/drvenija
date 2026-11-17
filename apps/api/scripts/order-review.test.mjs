import test from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { ZodError } from 'zod'

process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
const { orderReviewRoutes } = await import('../dist/routes/order-review.js')
const { db, pool } = await import('../dist/db/client.js')

const orderId = '15d43dcb-fb77-466e-a69d-54ea1f08aac7'
const existing = {
  id: orderId,
  orderNumber: 'DRV-123',
  locale: 'bs',
  status: 'submitted',
  email: 'customer@example.com',
  fullName: 'Test Kupac',
}

test('fulfilment status only moves forward from accepted orders and keeps the tracking number', async () => {
  const app = Fastify()
  await app.register(sensible)
  app.setErrorHandler((error, _request, reply) => reply.code(error instanceof ZodError ? 400 : error.statusCode ?? 500).send({ message: error.message }))
  await app.register(orderReviewRoutes)
  const originalSelect = db.select
  const originalUpdate = db.update
  let current = { ...existing, status: 'submitted', trackingNumber: null }
  let saved
  db.select = () => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: async () => [current] }) }) }) })
  db.update = () => ({ set: values => ({ where: () => ({
    returning: async () => { saved = values; return [{ ...current, ...values }] },
    then: resolve => resolve([]),
  }) }) })
  const move = payload => app.inject({ method: 'PUT', url: `/orders/${orderId}/status`, payload })
  try {
    assert.equal((await move({ status: 'shipped' })).statusCode, 409)
    current = { ...current, status: 'confirmed' }
    assert.equal((await move({ status: 'confirmed' })).statusCode, 400)
    const shipped = await move({ status: 'shipped', trackingNumber: 'BA123' })
    assert.equal(shipped.statusCode, 200)
    assert.equal(saved.status, 'shipped')
    assert.equal(saved.trackingNumber, 'BA123')
    assert.deepEqual(shipped.json().notification, { sent: false, reason: 'not_configured' })
    current = { ...current, status: 'shipped', trackingNumber: 'BA123' }
    assert.equal((await move({ status: 'in_production' })).statusCode, 409)
    const completed = await move({ status: 'completed', notify: false })
    assert.equal(completed.statusCode, 200)
    assert.equal(saved.trackingNumber, 'BA123')
    assert.equal(completed.json().notification, null)
  } finally {
    db.select = originalSelect
    db.update = originalUpdate
    await app.close()
  }
})

test('order decisions require a decline reason and persist accepted or declined states', async () => {
  const app = Fastify()
  await app.register(sensible)
  app.setErrorHandler((error, _request, reply) => reply.code(error instanceof ZodError ? 400 : error.statusCode ?? 500).send({ message: error.message }))
  await app.register(orderReviewRoutes)
  const originalSelect = db.select
  const originalUpdate = db.update
  let current = { ...existing }
  let saved
  db.select = () => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: async () => [current] }) }) }) })
  db.update = () => ({ set: values => ({ where: () => ({
    returning: async () => { saved = values; return [{ ...current, ...values }] },
    then: resolve => resolve([]),
  }) }) })

  try {
    const invalid = await app.inject({ method: 'PUT', url: `/orders/${orderId}/decision`, payload: { decision: 'decline', reason: 'no' } })
    assert.equal(invalid.statusCode, 400)

    const declined = await app.inject({ method: 'PUT', url: `/orders/${orderId}/decision`, payload: { decision: 'decline', reason: 'Proizvod nije dostupan.' } })
    assert.equal(declined.statusCode, 200)
    assert.equal(saved.status, 'declined')
    assert.equal(saved.paymentStatus, 'cancelled')
    assert.equal(saved.declineReason, 'Proizvod nije dostupan.')
    assert.deepEqual(declined.json().notification, { sent: false, reason: 'not_configured' })

    const accepted = await app.inject({ method: 'PUT', url: `/orders/${orderId}/decision`, payload: { decision: 'accept' } })
    assert.equal(accepted.statusCode, 200)
    assert.equal(saved.status, 'confirmed')
    assert.equal(saved.declineReason, null)

    current = { ...current, status: 'confirmed' }
    assert.equal((await app.inject({ method: 'PUT', url: `/orders/${orderId}/decision`, payload: { decision: 'accept' } })).statusCode, 409)
  } finally {
    db.select = originalSelect
    db.update = originalUpdate
    await app.close()
    await pool.end()
  }
})
