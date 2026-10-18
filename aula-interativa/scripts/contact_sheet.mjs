import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { args, dependency, hash } from './lib.mjs';
const options = args();
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
try {
  if (!options._[0]) throw new Error('Usage: contact_sheet.mjs CAPTURE/manifest.json [--stride 1]');
  const path = resolve(options._[0]), dir = dirname(path);
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const sharp = dependency('sharp');
  const stride = Number(options.stride || 1);
  if (!Number.isInteger(stride) || stride < 1) throw new Error('stride must be a positive integer');
  const width = 360, height = 265, columns = 3, perSheet = 12;
  const index = { artifactHash: manifest.artifactHash, stride, groups: [] };
  for (const group of manifest.groups) {
    const selected = group.frames.filter((_, i) => i % stride === 0 || i === group.frames.length - 1);
    const record = { id: group.id, totalFrames: group.frames.length, representedFrames: selected.length, sheets: [] };
    for (let first = 0; first < selected.length; first += perSheet) {
      const batch = selected.slice(first, first + perSheet), tiles = [];
      for (let j = 0; j < batch.length; j++) {
        const frame = manifest.frames[batch[j]], image = await readFile(join(dir, frame.file));
        if (hash(image) !== frame.imageHash) throw new Error(`Frame modified since capture: ${frame.file}`);
        const left = j % columns * width, top = Math.floor(j / columns) * height;
        tiles.push({ input: await sharp(image).resize(width, height - 35, { fit: 'contain', background: '#ffffff' }).toBuffer(), left, top });
        const caption = `${frame.index} · ${frame.state.time.toFixed(3)}s · ${frame.layout.problems.length ? 'LAYOUT ERROR' : 'inspect'}`;
        const label = `<svg width="${width}" height="35"><rect width="100%" height="100%" fill="#e5edf7"/><text x="10" y="23" font-family="sans-serif" font-size="13" fill="#17304c">${escape(caption)}</text></svg>`;
        tiles.push({ input: Buffer.from(label), left, top: top + height - 35 });
      }
      const filename = `sheet-${hash(group.id).slice(0, 12)}-${String(first / perSheet).padStart(3, '0')}.png`;
      const buffer = await sharp({ create: { width: width * columns, height: height * Math.ceil(batch.length / columns), channels: 3, background: '#f1f5fb' } }).composite(tiles).png().toBuffer();
      await writeFile(join(dir, filename), buffer);
      record.sheets.push({ file: filename, hash: hash(buffer), frames: batch });
    }
    index.groups.push(record);
  }
  await writeFile(join(dir, 'sheets.json'), JSON.stringify(index, null, 2));
  const reviewPath = join(dir, 'review.json');
  const review = JSON.parse(await readFile(reviewPath, 'utf8'));
  if (review.artifactHash !== index.artifactHash) throw new Error('Review belongs to another artifact; recapture first');
  for (const group of review.groups) group.sheets = index.groups.find(g => g.id === group.id)?.sheets.map(s => s.file) || [];
  await writeFile(reviewPath, JSON.stringify(review, null, 2));
  console.log(JSON.stringify({ groups: index.groups.length, sheets: index.groups.reduce((n, g) => n + g.sheets.length, 0), stride, visualReview: 'pending: inspect sheets and record findings in review.json' }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
