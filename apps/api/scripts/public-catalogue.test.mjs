import assert from 'node:assert/strict'
import test from 'node:test'
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
const { catalogueResponse } = await import('../dist/services/public-catalogue.js')
test('live catalogue serializes translations, categories and primary-first stable image URLs', () => {
  const result = catalogueResponse([{ id: 'category', translations: { bs: { name: 'Dom', slug: 'dom', description: '' }, en: { name: 'Home', slug: 'home', description: '' } }, seo: {} }], [{ id: 'product', sku: 'SKU', categoryId: 'category', price: 45, translations: { bs: { name: 'Ime', slug: 'ime' }, en: { name: 'Name', slug: 'name' } }, seo: {}, leadTime: { bs: '3 dana', en: '3 days' }, stockLabel: {}, type: 'custom', material: 'mediapan', featured: true, customizable: true }], [{ id: 'second', productId: 'product', storageKey: 'private-secret', isPrimary: false, alt: {}, width: 100, height: 100, mimeType: 'image/webp' }, { id: 'primary', productId: 'product', isPrimary: true, alt: { bs: 'Slika' }, width: 100, height: 100, mimeType: 'image/webp' }, { id: 'unattached', productId: null }])
  const product = result.products[0]
  assert.equal(product.name.en, 'Name')
  assert.equal(product.categoryName.en, 'Home')
  assert.equal(product.currency, 'BAM')
  assert.equal(product.media.length, 2)
  assert.equal(product.media[0].url, '/public/media/primary')
  assert.equal(product.media[0].alt.en, 'Slika')
  assert.ok(!JSON.stringify(result).includes('private-secret'))
  assert.equal(product.rating, null)
  assert.deepEqual(catalogueResponse([], [], []), { shipping: { freeFrom: 150, fee: 10 }, showroom: null, levha: null, checkout: { giftWrapPrice: 5, paymentMethods: ['bank_transfer', 'cash_on_delivery'] }, products: [], categories: [] })
})

test('catalogue hides unpublished products and summarises approved reviews', () => {
  const base = { sku: 'SKU', categoryId: 'category', price: 45, translations: { bs: { name: 'Ime', slug: 'ime' } }, seo: {}, leadTime: {}, stockLabel: {}, type: 'standard', material: 'mediapan', featured: false, customizable: false }
  const reviews = [
    { id: 'r1', productId: 'live', authorName: 'Amra', rating: 5, body: 'Prelijepo', locale: 'bs', createdAt: new Date() },
    { id: 'r2', productId: 'live', authorName: 'Kenan', rating: 4, body: 'Odlično', locale: 'bs', createdAt: new Date() },
  ]
  const result = catalogueResponse([], [{ ...base, id: 'live', published: true }, { ...base, id: 'draft', published: false }], [], [], reviews)
  assert.deepEqual(result.products.map(product => product.id), ['live'])
  assert.deepEqual(result.products[0].rating, { average: 4.5, count: 2 })
  assert.equal(result.products[0].reviews.length, 2)
})

test('the cutout is returned separately and never appears in the gallery', () => {
  const base = { id: 'product', sku: 'SKU', categoryId: 'category', price: 45, translations: { bs: { name: 'Ime', slug: 'ime' } }, seo: {}, leadTime: {}, stockLabel: {}, type: 'standard', material: 'mediapan', featured: false, customizable: false }
  const images = [
    { id: 'gallery', productId: 'product', isPrimary: true, kind: 'gallery', alt: { bs: 'Slika' }, width: 100, height: 100, mimeType: 'image/webp' },
    { id: 'cutout', productId: 'product', isPrimary: false, kind: 'cutout', alt: { bs: 'Bez pozadine' }, width: 100, height: 100, mimeType: 'image/webp' },
  ]
  const [product] = catalogueResponse([], [base], images).products
  assert.deepEqual(product.media.map(image => image.id), ['gallery'])
  assert.equal(product.cutoutImage.url, '/public/media/cutout')
  assert.equal(product.cutoutImage.alt.bs, 'Bez pozadine')
  assert.equal('roomImage' in product, false)
  assert.equal(catalogueResponse([], [base], [images[0]]).products[0].cutoutImage, null)
})
