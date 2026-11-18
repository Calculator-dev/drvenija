import assert from 'node:assert/strict'
import test from 'node:test'
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused'
const { showroomInput } = await import('../dist/routes/showroom.js')

const valid = {
  imageId: '7a4e9f2c-1b3d-4c5e-8f6a-9b0c1d2e3f40',
  artArea: { x: 30.8, y: 14.9, width: 43.6, height: 38.3 },
  wallOutline: [[17, 5], [100, 0], [100, 61], [17, 61]],
  areaWidthCm: 120,
}

test('showroom settings: the artwork area stays inside the photo and the wall is a real outline', () => {
  assert.deepEqual(showroomInput.parse(valid), valid)
  assert.equal(showroomInput.parse({ ...valid, imageId: null }).imageId, null)
  for (const invalid of [
    { ...valid, artArea: { x: 80, y: 10, width: 40, height: 30 } },
    { ...valid, artArea: { x: 10, y: 10, width: 1, height: 30 } },
    { ...valid, wallOutline: [[0, 0], [100, 0]] },
    { ...valid, wallOutline: [[0, 0], [120, 0], [0, 50]] },
    { ...valid, areaWidthCm: 5 },
    { ...valid, areaWidthCm: 120.5 },
    { ...valid, extra: true },
  ])
    assert.equal(showroomInput.safeParse(invalid).success, false)
})
