import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const extract = (start, end) => {
  const s = source.indexOf(start);
  const e = source.indexOf(end, s);
  assert.ok(s >= 0 && e > s, `Failed to extract ${start}..${end}`);
  return source.slice(s, e);
};

function makeCtx(overrides = {}) {
  const ctx = vm.createContext({
    state: {
      location: 'Bandra West, Mumbai',
      locationCity: 'Mumbai',
      userCoords: null,
      salonCategory: 'All',
      salonDistanceFilter: 'all',
      salonSort: 'distance-asc',
      salonMinPrice: '',
      salonMaxPrice: '',
      ...(overrides.state || {}),
    },
    Number,
    Math,
    Array,
    String,
    Object,
    Set,
    Infinity,
  });
  vm.runInContext(extract('const NEAR_SALON_RADIUS_KM', 'function nearestKnownCityForCoords'), ctx);
  vm.runInContext(
    extract('const SORT_OPTIONS', 'const getFilteredShopProducts') + '\nthis.getFilteredSalons = getFilteredSalons;',
    ctx
  );
  return ctx;
}

test('salons compute distance in km from selected area or live GPS and sort near-to-far', () => {
  const ctx = makeCtx({ state: { location: 'Bandra West, Mumbai', locationCity: 'Mumbai', userCoords: null } });
  const raw = [
    { id: 'far', name: 'Powai Studio', city: 'Mumbai', area: 'Powai, Mumbai', lat: 19.1176, lng: 72.9060, price: 850, services: ['Hair'] },
    { id: 'near', name: 'Ivory Room', city: 'Mumbai', area: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, price: 800, services: ['Hair'] },
    { id: 'mid', name: 'Juhu House', city: 'Mumbai', area: 'Juhu, Mumbai', lat: 19.1075, lng: 72.8263, price: 650, services: ['Hair'] },
  ];
  const enriched = raw.map(s => ctx.enrichSalonWithDistance(s));
  assert.equal(enriched[1].distanceKm, 0);
  assert.equal(enriched[1].distanceLabel, '0.0 km away');
  assert.ok(enriched[2].distanceKm > 4 && enriched[2].distanceKm < 6);
  assert.ok(enriched[0].distanceKm > 9);

  const nearToFar = ctx.getFilteredSalons(enriched, { category: 'All', distance: 'all', sort: 'distance-asc', minPrice: '', maxPrice: '' });
  assert.deepEqual(Array.from(nearToFar, x => x.id), ['near', 'mid', 'far']);

  const within8 = ctx.getFilteredSalons(enriched, { category: 'All', distance: 'nearest', sort: 'distance-asc', minPrice: '', maxPrice: '' });
  assert.deepEqual(Array.from(within8, x => x.id), ['near', 'mid']);

  assert.equal(ctx.normalizeCity('Pune, Maharashtra, India'), 'Pune');
  assert.equal(ctx.normalizeCity('Manipal, Karnataka, India'), 'Manipal');
});

test('at-home professionals strictly match only the selected city without fallback leakage', () => {
  const ctx = makeCtx();
  assert.equal(ctx.isProAvailableInCity({ name: 'Nisha', city: 'Mumbai' }, 'Mumbai'), true);
  assert.equal(ctx.isProAvailableInCity({ name: 'Ananya', city: 'Bengaluru' }, 'Mumbai'), false);
  assert.equal(ctx.isProAvailableInCity({ name: 'Ananya', city: 'Bangalore' }, 'Bengaluru'), true);
  assert.equal(ctx.isProAvailableInCity({ name: 'Unknown' }, 'Mumbai'), false);
});
