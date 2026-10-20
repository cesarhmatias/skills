/* Storyboard: the endpoint of every step, four per sheet at a size where text can be judged.
   This is the first visual review of a lesson: read it as the learner would, screen by screen. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { args, dependency, hash } from './lib.mjs';
const options = args();
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
try {
  if (!options._[0]) throw new Error('Usage: storyboard.mjs CAPTURE/manifest.json [--scenario default] [--viewport 1440x900]');
  const path = resolve(options._[0]), dir = dirname(path), sharp = dependency('sharp');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const scenario = String(options.scenario || 'default'), viewport = String(options.viewport || `${manifest.groups[0]?.viewport.width}x${manifest.groups[0]?.viewport.height}`);
  // Screens without a default scenario (quizzes) show their first audit case, so the board covers every step.
  const inView = manifest.groups.filter(g => `${g.viewport.width}x${g.viewport.height}` === viewport);
  const ends = inView.filter(g => g.scenario.id === scenario || (scenario === 'default' && !inView.some(o => o.slide === g.slide && o.step === g.step && o.scenario.id === 'default') && g === inView.find(o => o.slide === g.slide && o.step === g.step)))
    .map(g => ({ group: g, frame: manifest.frames[g.frames[g.frames.length - 1]] }));
  if (!ends.length) throw new Error(`No groups for scenario ${scenario} at ${viewport}`);
  const W = 960, H = 600, label = 30, files = [];
  for (let i = 0; i < ends.length; i += 4) {
    const tiles = [];
    for (let j = 0; j < 4 && i + j < ends.length; j++) {
      const { group, frame } = ends[i + j], image = await readFile(join(dir, frame.file));
      if (hash(image) !== frame.imageHash) throw new Error(`Frame modified since capture: ${frame.file}`);
      const left = j % 2 * W, top = Math.floor(j / 2) * (H + label);
      const problems = [...new Set(frame.layout.problems.map(p => p.code))];
      const text = `${i + j + 1}. ${group.id.replace(`${viewport}--`, '')}${problems.length ? ' · ' + problems.join(', ') : ''}`;
      tiles.push({ input: Buffer.from(`<svg width="${W}" height="${label}"><rect width="100%" height="100%" fill="${problems.length ? '#a12e49' : '#1f2328'}"/><text x="12" y="21" font-family="sans-serif" font-size="16" fill="#fff">${escape(text)}</text></svg>`), left, top });
      tiles.push({ input: await sharp(image).resize(W, H, { fit: 'contain', position: 'top', background: '#ffffff' }).toBuffer(), left, top: top + label });
    }
    const name = `storyboard-${scenario}-${viewport}-${String(i / 4).padStart(2, '0')}.png`;
    await sharp({ create: { width: W * 2, height: (H + label) * 2, channels: 3, background: '#d0d0d0' } }).composite(tiles).png().toFile(join(dir, name));
    files.push(name);
  }
  await writeFile(join(dir, `storyboard-${scenario}-${viewport}.json`), JSON.stringify({ artifactHash: manifest.artifactHash, scenario, viewport, steps: ends.length, files }, null, 2));
  console.log(JSON.stringify({ steps: ends.length, sheets: files.length, files: files.map(f => join(dir, f)) }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
