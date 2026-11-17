import assert from 'node:assert/strict'
import test from 'node:test'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
// Signing a download link is done locally, so dummy storage settings are enough.
Object.assign(process.env, { BACKBLAZE_ENDPOINT: 'https://s3.eu-central-003.backblazeb2.com', BACKBLAZE_REGION: 'eu-central-003', BACKBLAZE_KEY_ID: 'key', BACKBLAZE_APP_KEY: 'secret', BACKBLAZE_BUCKET_NAME: 'bucket' })
const { catalogueRoutes } = await import('../dist/routes/catalogue.js')
const { db } = await import('../dist/db/client.js')
const { products } = await import('../dist/db/schema.js')

test('the CRM product list links each product to its main gallery photo', async () => {
  const app = Fastify()
  await app.register(sensible)
  await app.register(catalogueRoutes)
  const original = db.select
  const rows = [{ id: 'with-photo', sku: 'A' }, { id: 'without-photo', sku: 'B' }]
  // Ordered main photo first, as the query does; the second photo must not win.
  const images = [
    { productId: 'with-photo', storageKey: 'products/main.webp', isPrimary: true },
    { productId: 'with-photo', storageKey: 'products/other.webp', isPrimary: false },
  ]
  db.select = () => ({ from: table => table === products ? { orderBy: async () => rows } : { where: () => ({ orderBy: async () => images }) } })
  try {
    const response = await app.inject({ url: '/products' })
    assert.equal(response.statusCode, 200)
    const [withPhoto, withoutPhoto] = response.json()
    assert.match(withPhoto.thumbnailUrl, /\/bucket\/products\/main\.webp\?/)
    assert.equal(withoutPhoto.thumbnailUrl, null)
  } finally {
    db.select = original
    await app.close()
  }
})
