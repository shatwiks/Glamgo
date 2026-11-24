import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const matchesAudience ='), source.indexOf('const generalCatalogueNote ='));
const context = vm.createContext({state:{audience:'men'}});
vm.runInContext(code + '\nglobalThis.matchesAudience = matchesAudience; globalThis.isVisibleInAudience = isVisibleInAudience;', context);

test('men and women each include only their own and unisex listings', () => {
  assert.equal(context.matchesAudience({audience:'men'}),true);
  assert.equal(context.matchesAudience({audience:'women'}),false);
  assert.equal(context.matchesAudience({audience:'unisex'}),true);
  context.state.audience='women';
  assert.equal(context.matchesAudience({audience:'women'}),true);
  assert.equal(context.matchesAudience({audience:'men'}),false);
  assert.equal(context.matchesAudience({audience:'unisex'}),true);
});

test('missing or legacy unspecified listings default to unisex across men and women', () => {
  context.state.audience='men';
  assert.equal(context.matchesAudience({}),true);
  assert.equal(context.matchesAudience({audience:'unspecified'}),true);
  assert.equal(context.isVisibleInAudience({}),true);
  context.state.audience='women';
  assert.equal(context.isVisibleInAudience({}),true);
  assert.equal(context.isVisibleInAudience({audience:'unspecified'}),true);
  assert.equal(context.isVisibleInAudience({audience:'men'}),false);
});
