import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDishFormData, buildRestaurantFormData } from '../lib/form-data.ts';

const restaurant = () => ({ title: 'Restaurant', description: '<p>About</p>', location: { address: 'Street', city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 } });
const photo = (name) => new File(['image'], name, { type: 'image/png' });

test('owner registration assigns distinct multipart photos to each signature dish', () => {
  const data = buildRestaurantFormData({ ...restaurant(), imageFiles: [photo('inside.png'), photo('outside.png')], photoCategories: ['interior', 'exterior'], signatureDishes: [
    { clientId: 'draft-a', name: 'Soup', description: '<p>Soup</p>', price: 8, imageFiles: [photo('soup-1.png'), photo('soup-2.png')] },
    { clientId: 'draft-b', name: 'Pasta', description: '<p>Pasta</p>', price: 14, imageFiles: [photo('pasta.png')] },
  ] });
  assert.equal(data.get('restaurantImageCount'), '2');
  assert.deepEqual(data.getAll('images').map((file) => file.name), ['inside.png', 'outside.png', 'soup-1.png', 'soup-2.png', 'pasta.png']);
  const dishes = JSON.parse(data.get('signatureDishes'));
  assert.deepEqual(dishes.map((dish) => dish.imageIndexes), [[2, 3], [4]]);
  assert.equal(Object.hasOwn(dishes[0], 'clientId'), false);
});

test('omitted offers remain untouched while an explicit empty list clears offers', () => {
  assert.equal(buildRestaurantFormData(restaurant()).has('offers'), false);
  assert.equal(buildRestaurantFormData({ ...restaurant(), offers: [] }).get('offers'), '[]');
});

test('restaurant edits round-trip full cuisines, hours, gallery ordering and selected lead photo', () => {
  const hours = [{ day: 'Monday', open: '22:00', close: '02:00', closed: false }];
  const data = buildRestaurantFormData({ ...restaurant(), categories: ['German', 'Coffee'], category: 'German', openingHours: hours, timeZone: 'Europe/Berlin', offers: ['Lunch'], contactEmail: 'hello@example.com', images: ['https://example.com/old.png'], imageFiles: [photo('new.png')], photoCategories: ['interior', 'exterior'], leadImageIndex: 1 });
  assert.deepEqual(JSON.parse(data.get('categories')), ['German', 'Coffee']);
  assert.equal(data.has('category'), false);
  assert.deepEqual(JSON.parse(data.get('openingHours')), hours);
  assert.deepEqual(JSON.parse(data.get('existingImages')), ['https://example.com/old.png']);
  assert.deepEqual(JSON.parse(data.get('photoCategories')), ['interior', 'exterior']);
  assert.equal(data.get('leadImageIndex'), '1');
  assert.equal(data.get('contactEmail'), 'hello@example.com');
  assert.equal(data.has('price'), false);
  assert.equal(data.has('signatureDishes'), false);
});

test('dish updates retain labels and selected lead image through multipart serialization', () => {
  const data = buildDishFormData({ name: 'Cake', price: 8, tags: ['Vegan', 'Contains nuts'], ingredients: ['Almonds'], images: ['https://example.com/existing.png'], imageFiles: [photo('new-dish.png')], leadImageIndex: 1, isSignatureDish: true, isActive: false });
  assert.deepEqual(JSON.parse(data.get('tags')), ['Vegan', 'Contains nuts']);
  assert.equal(data.get('leadImageIndex'), '1');
  assert.equal(data.get('isActive'), 'false');
  assert.equal(data.get('isSignatureDish'), 'true');
  assert.deepEqual(data.getAll('images').map((file) => file.name), ['new-dish.png']);
});
