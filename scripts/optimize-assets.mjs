import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const assetDir = path.resolve('public/assets');
const files = (await readdir(assetDir)).filter(name => name.endsWith('.png'));

for (const file of files) {
  const input = path.join(assetDir, file);
  const output = path.join(assetDir, file.replace(/\.png$/, '.webp'));
  await sharp(input)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);
  console.log(path.basename(output));
}
