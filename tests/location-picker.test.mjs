import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

test('only the latest map lookup can update the selected location', async () => {
  const requests = [];
  const save = { disabled: false };
  const input = { value: '' };
  const ctx = vm.createContext({
    state: { modal: 'location' },
    locationDraft: { label: 'Original', city: 'Mumbai', coords: [1, 2], pending: false },
    locationLookupSeq: 0,
    activeLocationMarker: null,
    document: { querySelector: () => save, getElementById: () => input },
    reverseGeocodeCoords: (lat, lng) => new Promise(resolve => requests.push({lat, lng, resolve})),
    toast() {}, resolveSalonCoords: () => [1, 2],
  });
  vm.runInContext(extract('async function selectLocationCoords', 'async function mountLocationPickerMap'), ctx);
  const first = ctx.selectLocationCoords(10, 20);
  const second = ctx.selectLocationCoords(30, 40);
  assert.equal(save.disabled, true);
  requests[1].resolve({ label: 'New location', city: 'Pune' });
  await second;
  requests[0].resolve({ label: 'Old location', city: 'Mumbai' });
  await first;
  assert.equal(input.value, 'New location');
  assert.equal(ctx.locationDraft.city, 'Pune');
  assert.deepEqual(Array.from(ctx.locationDraft.coords), [30, 40]);
  assert.equal(save.disabled, false);
});

test('a lookup completing after the dialog closes cannot change the selection', async () => {
  let resolve;
  const input = { value: 'Original' };
  const ctx = vm.createContext({
    state: { modal: 'location' }, locationDraft: { label: 'Original', pending: false },
    locationLookupSeq: 0, activeLocationMarker: null,
    document: { querySelector: () => ({ disabled: false }), getElementById: () => input },
    reverseGeocodeCoords: () => new Promise(r => { resolve = r; }), toast() {},
  });
  vm.runInContext(extract('async function selectLocationCoords', 'async function mountLocationPickerMap'), ctx);
  const pending = ctx.selectLocationCoords(10, 20);
  ctx.state.modal = null;
  ctx.locationDraft = null;
  resolve({ label: 'Late result', city: 'Pune' });
  await pending;
  assert.equal(input.value, 'Original');
});

test('a Photon city result uses the city name instead of its county', async () => {
  const ctx = vm.createContext({
    state: { userCoords: null },
    fetch: async () => ({ ok: true, json: async () => ({ features: [{ properties: { name: 'Pune', type: 'city', county: 'Pune City Subdistrict', state: 'Maharashtra', country: 'India' }, geometry: { coordinates: [73.85, 18.52] } }] }) }),
    encodeURIComponent,
  });
  vm.runInContext(extract('async function searchLocationSuggestions', 'async function selectLocationCoords'), ctx);
  const [result] = await ctx.searchLocationSuggestions('Pune');
  assert.equal(result.city, 'Pune');
});
