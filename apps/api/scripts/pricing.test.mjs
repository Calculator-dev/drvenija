import assert from 'node:assert/strict'
import test from 'node:test'
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
const { discountFor, discountProblem, normalizeCode, orderTotals, giftWrapPrice } = await import('../dist/lib/pricing.js')
const { discountInput } = await import('../dist/routes/marketing.js')

const code = { kind: 'percent', value: 10, minSubtotal: 0, startsAt: null, endsAt: null, maxUses: null, usedCount: 0, active: true }

test('discounts are whole KM, rounded down and capped at the subtotal', () => {
  assert.equal(discountFor({ kind: 'percent', value: 10 }, 95), 9)
  assert.equal(discountFor({ kind: 'fixed', value: 20 }, 95), 20)
  assert.equal(discountFor({ kind: 'fixed', value: 200 }, 95), 95)
  assert.equal(normalizeCode(' ramazan10 '), 'RAMAZAN10')
})

test('discount codes respect activity, dates, usage limit and minimum subtotal', () => {
  const now = new Date('2026-03-01T12:00:00Z')
  assert.equal(discountProblem(code, 50, now), null)
  assert.equal(discountProblem({ ...code, active: false }, 50, now), 'inactive')
  assert.equal(discountProblem({ ...code, startsAt: new Date('2026-03-02') }, 50, now), 'not_started')
  assert.equal(discountProblem({ ...code, endsAt: new Date('2026-03-01T12:00:00Z') }, 50, now), 'expired')
  assert.equal(discountProblem({ ...code, maxUses: 3, usedCount: 3 }, 50, now), 'used_up')
  assert.equal(discountProblem({ ...code, minSubtotal: 100 }, 50, now), 'min_subtotal')
})

test('order totals: free delivery judged after discount, gift wrap added on top', () => {
  assert.deepEqual(orderTotals({ subtotal: 160, discount: 0, giftWrap: false }), { subtotal: 160, discountAmount: 0, shippingAmount: 0, giftWrapAmount: 0, total: 160 })
  assert.deepEqual(orderTotals({ subtotal: 160, discount: 16, giftWrap: true }), { subtotal: 160, discountAmount: 16, shippingAmount: 10, giftWrapAmount: giftWrapPrice, total: 144 + 10 + giftWrapPrice })
})

test('discount input validates percentages and date order', () => {
  assert.equal(discountInput.parse({ code: 'eid-2026', kind: 'percent', value: 15 }).code, 'EID-2026')
  assert.throws(() => discountInput.parse({ code: 'BIG', kind: 'percent', value: 150 }))
  assert.throws(() => discountInput.parse({ code: 'DATES', kind: 'fixed', value: 5, startsAt: '2026-05-02T00:00:00Z', endsAt: '2026-05-01T00:00:00Z' }))
  assert.throws(() => discountInput.parse({ code: 'has space', kind: 'fixed', value: 5 }))
})
