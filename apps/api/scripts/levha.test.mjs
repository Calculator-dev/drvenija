import assert from 'node:assert/strict'
import test from 'node:test'
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
const { defaultLevhaPricing: pricing, levhaConfiguration, levhaPrice, levhaPricingInput, createLevhaNumber } = await import('../dist/lib/levha.js')
const { levhaSummary } = await import('../dist/services/order-email.js')

const ayahId = '7a4e9f2c-1b3d-4c5e-8f6a-9b0c1d2e3f40'
const base = {
  frame: 'black', size: { width: 80, height: 40 },
  background: { material: 'plywood', colour: 'black' },
  letters: { material: 'plexiglass', colour: 'gold' },
  ayahId, customAyah: null,
}

test('reference levha: black frame, black plywood, gold plexiglass letters, 80 × 40 = 100 KM', () => {
  assert.equal(levhaPrice(pricing, base), 100)
  // Plexiglass costs more than plywood.
  assert.ok(levhaPrice(pricing, { ...base, background: { material: 'plexiglass', colour: 'gray' } }) > 100)
  assert.equal(levhaPrice(pricing, { ...base, letters: { material: 'plywood', colour: 'white' } }), 80)
})

test('custom sizes and own texts have no price: the shop confirms them first', () => {
  for (const size of [{ width: 60, height: 40 }, { width: 40, height: 80 }, { width: 120, height: 60 }])
    assert.equal(levhaPrice(pricing, { ...base, size }), null, `${size.width} × ${size.height}`)
  assert.equal(levhaPrice(pricing, { ...base, size: { width: 100, height: 60 } }), 150)
  assert.equal(levhaPrice(pricing, { ...base, ayahId: null, customAyah: { text: 'Ajetul-kursija' } }), null)
})

test('configuration: same-colour letters are blocked and exactly one text is required', () => {
  assert.equal(levhaConfiguration.safeParse(base).success, true)
  assert.equal(levhaConfiguration.safeParse({ ...base, letters: { material: 'plexiglass', colour: 'black' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, letters: { material: 'mdf', colour: 'raw' } }).success, true)
  assert.equal(levhaConfiguration.safeParse({ ...base, letters: { material: 'mdf', colour: 'gold' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, background: { material: 'plywood', colour: 'gold' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, ayahId: null }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, customAyah: { text: 'Ajetul-kursija', part: 'prvi dio' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, ayahId: null, customAyah: { text: 'Ajetul-kursija', part: 'prvi dio' } }).success, true)
  assert.equal(levhaConfiguration.safeParse({ ...base, frame: 'gold' }).success, false)
})

test('text under the ayah: none by default, a translation needs a listed text, own text is limited', () => {
  assert.deepEqual(levhaConfiguration.parse(base).subtitle, { kind: 'none' })
  assert.equal(levhaConfiguration.safeParse({ ...base, subtitle: { kind: 'translation' } }).success, true)
  const own = { ...base, ayahId: null, customAyah: { text: 'Er-Rahman 13' } }
  assert.equal(levhaConfiguration.safeParse({ ...own, subtitle: { kind: 'translation' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...own, subtitle: { kind: 'custom', text: 'Pa, koju blagodat Gospodara svoga poričete?' } }).success, true)
  assert.equal(levhaConfiguration.safeParse({ ...base, subtitle: { kind: 'custom', text: '' } }).success, false)
  assert.equal(levhaConfiguration.safeParse({ ...base, subtitle: { kind: 'custom', text: 'x'.repeat(151) } }).success, false)
})

test('price settings validation and request numbers', () => {
  assert.equal(levhaPricingInput.safeParse(pricing).success, true)
  assert.equal(levhaPricingInput.safeParse({ ...pricing, sizes: [...pricing.sizes, pricing.sizes[0]] }).success, false)
  assert.equal(levhaPricingInput.safeParse({ ...pricing, minWidth: 5 }).success, false)
  // Prices saved before per-m² pricing was dropped still load.
  assert.deepEqual(levhaPricingInput.parse({ ...pricing, pricePerSqm: 250, maxAutoWidth: 100, maxAutoHeight: 60 }), pricing)
  assert.match(createLevhaNumber(new Date('2026-11-23T10:00:00Z')), /^LVH-261123-[0-9A-F]{6}$/)
})

test('email summary lists every choice and the custom text', () => {
  const rows = levhaSummary({ configuration: { ...base, ayahId: null, customAyah: { text: 'Ajetul-kursija', part: 'prvi dio' } }, ayahName: null, subtitleText: 'Moja porodica', price: null }, 'bs')
  assert.deepEqual(rows, [
    ['Okvir', 'Crni'], ['Dimenzije', '80 × 40 cm'], ['Pozadina', 'šperploča, crna'], ['Slova', 'pleksiglas, zlatno ogledalo'],
    ['Vlastiti tekst', 'Ajetul-kursija'], ['Dio teksta', 'prvi dio'], ['Tekst ispod', 'Moja porodica'], ['Cijena', 'na upit (potvrđujemo da li se može izraditi)'],
  ])
})

test('POST /public/levha-requests prices on the server and refuses unknown texts', async () => {
  const { createApp } = await import('../dist/app.js')
  const { db } = await import('../dist/db/client.js')
  const { levhaAyahs, levhaRequests, levhaSettings } = await import('../dist/db/schema.js')
  const app = createApp()
  const original = { select: db.select, insert: db.insert }
  let ayahs = [{ id: ayahId, active: true, name: { bs: 'Bismillah', en: 'Bismillah' }, translation: { bs: 'U ime Allaha, Milostivog, Samilosnog', en: 'In the name of Allah' } }]
  const inserted = []
  db.select = () => ({ from: table => ({ where: () => ({ limit: async () => table === levhaAyahs ? ayahs : table === levhaSettings ? [] : [] }) }) })
  db.insert = table => ({ values: values => ({ onConflictDoNothing: () => ({ returning: async () => { if (table === levhaRequests) inserted.push(values); return [{ id: 'request-id', number: values.number }] } }) }) })
  const body = { locale: 'bs', configuration: base, customer: { fullName: 'Amra Test', email: 'amra@example.com' } }
  try {
    const response = await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, price: 1 } })
    assert.equal(response.statusCode, 400, 'unknown fields such as a client price are refused')
    const ok = await app.inject({ method: 'POST', url: '/public/levha-requests', payload: body })
    assert.equal(ok.statusCode, 201)
    assert.equal(ok.json().price, 100)
    assert.equal(inserted[0].price, 100)
    assert.equal(inserted[0].ayahName, 'Bismillah')
    // The translation is looked up on the server in the request's language.
    await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, locale: 'en', configuration: { ...base, subtitle: { kind: 'translation' } } } })
    assert.equal(inserted.at(-1).subtitleText, 'In the name of Allah')
    ayahs = [{ ...ayahs[0], translation: null }]
    assert.equal((await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, configuration: { ...base, subtitle: { kind: 'translation' } } } })).statusCode, 400)
    ayahs = [{ ...ayahs[0], translation: { bs: 'U ime Allaha', en: 'In the name of Allah' } }]
    inserted.length = 1
    const tooSmall = await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, configuration: { ...base, size: { width: 30, height: 40 } } } })
    assert.equal(tooSmall.statusCode, 400, 'smaller than the 40 × 40 minimum is refused')
    assert.equal(inserted.length, 1)
    // Contact: email by default; WhatsApp and Viber need a phone number.
    assert.equal(inserted[0].contactMethod, 'email')
    const viber = { ...body, customer: { ...body.customer, contact: 'viber' } }
    assert.equal((await app.inject({ method: 'POST', url: '/public/levha-requests', payload: viber })).statusCode, 400)
    assert.equal((await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...viber, customer: { ...viber.customer, phone: '+387 61 234 567' } } })).statusCode, 201)
    assert.equal(inserted.at(-1).contactMethod, 'viber')
    assert.equal((await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, customer: { ...body.customer, contact: 'sms' } } })).statusCode, 400)
    // A custom size is saved as a request without a price.
    const custom = await app.inject({ method: 'POST', url: '/public/levha-requests', payload: { ...body, configuration: { ...base, size: { width: 60, height: 40 } } } })
    assert.equal(custom.json().price, null)
    assert.equal(inserted.at(-1).price, null)
    ayahs = [{ ...ayahs[0], active: false }]
    assert.equal((await app.inject({ method: 'POST', url: '/public/levha-requests', payload: body })).statusCode, 400)
  } finally {
    Object.assign(db, original)
    await app.close()
  }
})
