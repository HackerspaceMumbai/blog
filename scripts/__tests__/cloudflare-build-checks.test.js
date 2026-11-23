import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyImageDialogs, verifyWorkerExport } from '../cloudflare-build-checks.mjs';

describe('Cloudflare artifact checks', () => {
  it('accepts empty pages and one trigger per dialog', () => {
    expect(() => verifyImageDialogs(document, 'page')).not.toThrow();
    document.body.innerHTML = `
      <button data-blog-image-open="a" aria-controls="a"></button>
      <button data-blog-image-open="b" aria-controls="b"></button>
      <dialog class="blog-image-dialog" id="a"></dialog>
      <dialog class="blog-image-dialog" id="b"></dialog>`;
    expect(() => verifyImageDialogs(document, 'page')).not.toThrow();
  });

  it('rejects missing IDs and dialogs without exactly one trigger', () => {
    document.body.innerHTML = '<dialog class="blog-image-dialog"></dialog>';
    expect(() => verifyImageDialogs(document, 'page')).toThrow('must have an ID');
    document.body.innerHTML = `
      <button data-blog-image-open="a" aria-controls="a"></button>
      <button data-blog-image-open="a" aria-controls="a"></button>
      <dialog class="blog-image-dialog" id="a"></dialog>
      <dialog class="blog-image-dialog" id="b"></dialog>`;
    expect(() => verifyImageDialogs(document, 'page')).toThrow('exactly one opening trigger');
  });

  const temporaryDirectories = [];
  afterEach(() => {
    for (const path of temporaryDirectories.splice(0)) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  it('inspects actual exports rather than import aliases or comments', () => {
    const dir = mkdtempSync(join(tmpdir(), 'worker-export-test-'));
    temporaryDirectories.push(dir);
    const path = join(dir, 'entry.mjs');
    writeFileSync(join(dir, 'other.mjs'), 'export class Other {}');
    for (const source of [
      'const NewsletterRateLimiter = class {}; export { NewsletterRateLimiter };',
      'class Local {} export { Local as NewsletterRateLimiter };',
      'export class NewsletterRateLimiter {}',
      "export { Other as NewsletterRateLimiter } from './other.mjs';",
    ]) {
      writeFileSync(path, source);
      expect(() => verifyWorkerExport(path, 'NewsletterRateLimiter')).not.toThrow();
    }
    writeFileSync(path, "import { Other as NewsletterRateLimiter } from './other.mjs'; export default NewsletterRateLimiter;");
    expect(() => verifyWorkerExport(path, 'NewsletterRateLimiter')).toThrow('Worker must export NewsletterRateLimiter');
    writeFileSync(path, 'export default {}; // export { anything as NewsletterRateLimiter }');
    expect(() => verifyWorkerExport(path, 'NewsletterRateLimiter')).toThrow('Worker must export NewsletterRateLimiter');
  });
});
