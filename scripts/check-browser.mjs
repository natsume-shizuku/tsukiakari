import { build } from 'vite';
import { chromium } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tsukiakari-fsrs-'));
let browser;
try {
  await build({
    configFile: false, logLevel: 'warn',
    build: {
      outDir: temporaryDirectory, emptyOutDir: false,
      lib: { entry: path.resolve('src/feasibility/fsrs.ts'), name: 'TsukiakariProbe', formats: ['iife'], fileName: () => 'probe.js' },
    },
  });
  const script = await readFile(path.join(temporaryDirectory, 'probe.js'), 'utf8');
  browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><title>Isolated FSRS check</title>');
  await page.addScriptTag({ content: script });
  const result = await page.evaluate(() => window.TsukiakariProbe.checkFsrsCompatibility());
  if (!Number.isFinite(result.againDueAt) || !Number.isFinite(result.rightDueAt) || result.rightDueAt <= result.againDueAt) {
    throw new Error('Browser scheduler compatibility check failed.');
  }
  console.log(JSON.stringify({ browser: 'Microsoft Edge', ...result }, null, 2));
} finally {
  await browser?.close();
  // mkdtemp produced this exact isolated directory; never remove other paths.
  const resolved = path.resolve(temporaryDirectory);
  if (path.dirname(resolved) !== path.resolve(tmpdir()) || !path.basename(resolved).startsWith('tsukiakari-fsrs-')) {
    throw new Error('Refusing cleanup outside the isolated probe directory.');
  }
  await rm(resolved, { recursive: true, force: true });
}
