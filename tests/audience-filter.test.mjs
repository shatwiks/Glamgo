import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const matchesAudience ='), source.indexOf('const generalCatalogueNote ='));
const context = vm.createContext({state:{audience:'men',includeUnspecified:false}});
context.isMenExperience = () => context.state.audience === 'men';
vm.runInContext(code + '\nglobalThis.matchesAudience = matchesAudience; globalThis.isUnclassified = isUnclassified; globalThis.isVisibleInAudience = isVisibleInAudience;', context);
test('men and women each include only their own and unisex listings', () => {
  assert.equal(context.matchesAudience({audience:'men'}),true);
  assert.equal(context.matchesAudience({audience:'women'}),false);
  assert.equal(context.matchesAudience({audience:'unisex'}),true);
  assert.equal(context.matchesAudience({}),false);
  context.state.audience='women';
  assert.equal(context.matchesAudience({audience:'women'}),true);
  assert.equal(context.matchesAudience({audience:'men'}),false);
  assert.equal(context.matchesAudience({audience:'unisex'}),true);
});
test('unclassified listings remain separate from both audience selections', () => {
  context.state.audience='men';
  assert.equal(context.matchesAudience({}),false);
  assert.equal(context.matchesAudience({audience:'unspecified'}),false);
  assert.equal(context.isUnclassified({}),true);
  assert.equal(context.isUnclassified({audience:'unspecified'}),true);
  assert.equal(context.isUnclassified({audience:'women'}),false);
});

test('legacy unclassified listings remain visible in Women without being reclassified', () => {
  context.state.audience='women';
  assert.equal(context.matchesAudience({}), false);
  assert.equal(context.isVisibleInAudience({}), true);
  assert.equal(context.isVisibleInAudience({audience:'men'}), false);
  context.state.audience='men';
  assert.equal(context.isVisibleInAudience({}), false);
});
