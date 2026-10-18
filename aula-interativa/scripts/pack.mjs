import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { args } from './lib.mjs';
const options = args();
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };
function local(reference, base) {
  if (/^(https?:|\/\/)/i.test(reference)) throw new Error(`External asset must be acquired separately before packing: ${reference}`);
  if (/^[a-z]+:/i.test(reference)) throw new Error(`Unsupported asset scheme: ${reference}`);
  return resolve(base, decodeURIComponent(reference.split(/[?#]/)[0]));
}
async function data(reference, base) {
  if (reference.startsWith('data:') || reference.startsWith('#')) return reference;
  const file = local(reference, base), bytes = await readFile(file), type = mime[extname(file).toLowerCase()];
  if (!type) throw new Error(`Unsupported embedded asset: ${file}`);
  return `data:${type};base64,${bytes.toString('base64')}`;
}
async function replaceAsync(input, regex, fn) {
  const matches = [...input.matchAll(regex)];
  const values = await Promise.all(matches.map(fn));
  let i = 0; return input.replace(regex, () => values[i++]);
}
async function cssAssets(css, base) {
  if (/@import\b/i.test(css)) throw new Error('Resolve CSS @import before packing');
  return replaceAsync(css, /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi, async m => `url("${await data(m[2].trim(), base)}")`);
}
try {
  if (!options._[0] || !options.out) throw new Error('Usage: pack.mjs source.html --out output.html');
  const input = resolve(options._[0]), out = resolve(String(options.out)), base = dirname(input);
  let html = await readFile(input, 'utf8');
  if (/\bsrcset\s*=/i.test(html)) throw new Error('Resolve srcset to explicit embedded assets before packing');
  html = await replaceAsync(html, /<link\b[^>]*\brel=['"]stylesheet['"][^>]*>/gi, async m => {
    const href = /\bhref=['"]([^'"]+)['"]/i.exec(m[0]);
    if (!href) throw new Error('Stylesheet without href');
    const path = local(href[1], base);
    const css = await cssAssets(await readFile(path, 'utf8'), dirname(path));
    return `<style>\n${css}\n</style>`;
  });
  html = await replaceAsync(html, /<script\b([^>]*?)\bsrc=['"]([^'"]+)['"]([^>]*)>\s*<\/script>/gi, async m => {
    if (/\btype=['"]module['"]/i.test(m[1] + m[3])) throw new Error('Bundle module scripts before packing; this packer supports classic local scripts');
    const js = await readFile(local(m[2], base), 'utf8');
    return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });
  html = await replaceAsync(html, /(<(?:img|source|video|audio)\b[^>]*?\bsrc=)(['"])([^'"]+)\2/gi, async m => `${m[1]}${m[2]}${await data(m[3], base)}${m[2]}`);
  html = await replaceAsync(html, /<style\b[^>]*>([\s\S]*?)<\/style>/gi, async m => `<style>${await cssAssets(m[1], base)}</style>`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  console.log(JSON.stringify({ output: out, bytes: Buffer.byteLength(html), note: 'Open and capture the packed file offline; packing alone is not validation' }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
