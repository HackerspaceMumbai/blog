import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const client = new URL('../dist/client/', import.meta.url);
const blog = new URL('blog/', client);
let postCount = 0;

for (const file of await readdir(new URL('assets/', client))) {
  if (!file.endsWith('.css')) continue;
  assert.match(file, /^[a-zA-Z0-9._-]+$/, `${file}: stylesheet name must not trigger Cloudflare's encoded-path redirect`);
}

for (const entry of await readdir(blog, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = new URL(`${entry.name}/index.html`, blog);
  const html = await readFile(path, 'utf8');
  const document = new JSDOM(html).window.document;
  assert.ok(document.querySelector('article.blog-content'), `${entry.name}: missing article`);
  assert.ok(document.querySelector('link[rel="stylesheet"][href^="/assets/"]'), `${entry.name}: CSS must be cacheable`);
  const inlineBytes = [...document.querySelectorAll('style')].reduce((sum, style) => sum + style.textContent.length, 0);
  assert.ok(inlineBytes < 20_000, `${entry.name}: excessive inline CSS (${inlineBytes} bytes)`);
  for (const script of document.scripts) {
    assert.ok(script.src || script.type === 'application/ld+json', `${entry.name}: executable inline script blocked by CSP`);
  }
  for (const image of document.querySelectorAll('article img, img.cover-image')) {
    assert.ok(!image.src.startsWith('/_image'), `${entry.name}: image must be optimized at build time`);
    if (image.src.startsWith('/')) {
      await stat(new URL(`.${image.src}`, client));
    }
  }
  if (entry.name === 'hacktoberfest-hack-day-mumbai-2026-recap') {
    const images = document.querySelectorAll('article img');
    assert.equal(images.length, 26, 'Recap must retain every body image');
    for (const image of images) {
      assert.equal(image.loading || image.getAttribute('loading'), 'lazy');
      assert.equal(image.getAttribute('sizes'), '(min-width: 800px) 768px, calc(100vw - 32px)');
      for (const variant of image.srcset.split(',')) {
        const [src, descriptor] = variant.trim().split(/\s+/);
        assert.ok(Number.parseInt(descriptor, 10) <= 1600, 'Unnecessary oversized image variant');
        const asset = new URL(`.${src}`, client);
        const metadata = await sharp(fileURLToPath(asset)).metadata();
        assert.equal(metadata.format, 'webp');
        assert.ok((await stat(asset)).size < 400_000, `${src}: recap variant exceeds 400 KB budget`);
      }
    }
    const first = images[0];
    const bytes = (await stat(new URL(`.${first.src}`, client))).size;
    assert.ok(bytes < 150_000, 'First body image exceeds 150 KB budget');
    console.log(`Recap: ${html.length} HTML characters, ${inlineBytes} inline CSS bytes, first body image ${bytes} bytes.`);
  }
  postCount++;
}

assert.ok(postCount > 0, 'No prerendered blog posts found; run pnpm build first');
const worker = JSON.parse(await readFile(new URL('../dist/server/wrangler.json', import.meta.url), 'utf8'));
assert.ok(worker.main, 'Dynamic Worker entry point must be retained for APIs');
assert.equal(worker.assets.binding, 'ASSETS');
console.log(`Verified ${postCount} prerendered blog posts, static images, external scripts/CSS, and Worker entry point.`);

const previewUrl = process.argv[2];
if (previewUrl) {
  const stylesheets = new Set();
  for (const path of ['/', '/about/', '/blog/', '/events/', '/past-events/', '/gallery/', '/blog/hacktoberfest-hack-day-mumbai-2026-recap/']) {
    const response = await fetch(new URL(path, previewUrl), { redirect: 'manual' });
    assert.equal(response.status, 200, `${path}: preview page must load directly`);
    const document = new JSDOM(await response.text()).window.document;
    for (const link of document.querySelectorAll('link[rel="stylesheet"][href^="/"]')) {
      stylesheets.add(link.getAttribute('href'));
    }
  }
  for (const path of stylesheets) {
    const response = await fetch(new URL(path, previewUrl), { redirect: 'manual' });
    assert.equal(response.status, 200, `${path}: stylesheet must load without redirects`);
    assert.ok(response.headers.get('Content-Type')?.startsWith('text/css'), `${path}: expected CSS`);
    assert.ok((await response.text()).length > 0, `${path}: empty stylesheet`);
  }
  console.log(`Verified ${stylesheets.size} linked stylesheets across seven preview routes without redirects.`);
}
