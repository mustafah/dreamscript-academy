import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { LESSONS } from '../src/lessons/index.js';

const academy = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 5189;
const baseUrl = `http://127.0.0.1:${port}/dreamscript-academy/`;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('The academy server did not start.');
}

async function settle(page) {
  await page.waitForTimeout(240);
}

async function chooseLocale(page, locale) {
  const nativePicker = page.getByRole('combobox', { name: /Choose language|اختر اللغة/ });
  if (await nativePicker.count()) {
    await nativePicker.selectOption(locale);
    return;
  }
  await page.locator('.language-trigger').click();
  await page.locator(`.language-option[data-locale="${locale}"]`).click();
}

async function selectedLocale(page) {
  const nativePicker = page.getByRole('combobox', { name: /Choose language|اختر اللغة/ });
  if (await nativePicker.count()) return nativePicker.inputValue();
  return page.evaluate(() => document.documentElement.lang === 'ar-EG' ? 'ar-EG' : '');
}

async function taskState(page) {
  return page.locator('[data-testid^="task-"]').evaluateAll((items) => items.map((item) => item.dataset.done === 'true'));
}

const server = spawn(process.execPath, ['serve.js'], {
  cwd: academy,
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
});

try {
  await waitForServer();
  const browser = await chromium.launch({ channel: 'chrome' });
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (error) => pageErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
  await page.goto(`${baseUrl}#/prose`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__academy.ready);
  assert.match(await page.getByTestId('lesson-pane').innerText(), /Generate AI art prompts with joyful code/, 'prose lesson should sell joyful prompt programming');
  assert.match(await page.getByTestId('lesson-pane').innerText(), /For artists first/, 'prose lesson should position artists first');
  assert.match(await page.getByTestId('lesson-pane').innerText(), /many image and video prompt variations/, 'prose lesson should sell prompt variations');
  assert.match(await page.getByTestId('lesson-pane').innerText(), /creative flow/i, 'prose lesson should keep code behind the artist workflow');
  assert.match(await page.getByTestId('lesson-pane').innerText(), /code working quietly/i, 'prose lesson should keep code behind the artist workflow');
  assert.equal(await page.getByTestId('artist-path').count(), 1, 'prose lesson should show the artist workflow');
  assert.match(await page.getByTestId('artist-path').innerText(), /image/i, 'artist workflow should mention image studies');
  assert.match(await page.getByTestId('artist-path').innerText(), /video/i, 'artist workflow should mention video studies');
  assert.equal(await page.getByTestId('artist-illustration').count(), 3, 'artist workflow should show three illustrations');
  for (const illustration of ['describe', 'explore', 'render']) {
    assert.equal(
      await page.locator(`[data-testid="artist-illustration"][data-illustration="${illustration}"]`).count(),
      1,
      `${illustration} illustration should be present`,
    );
  }
  await page.getByTestId('artist-explore').click();
  await settle(page);
  assert.equal(await page.evaluate(() => location.hash), '#/variations', 'artist workflow should link to variations');
  await page.evaluate(() => window.__academy.goTo('prose'));
  await settle(page);
  await page.getByTestId('artist-render').click();
  await settle(page);
  assert.equal(await page.evaluate(() => location.hash), '#/renderer', 'artist workflow should link to rendering');
  await page.evaluate(() => window.__academy.goTo('prose'));
  await settle(page);

  const editedFiles = await page.evaluate(() => {
    const files = window.__academy.getFiles();
    files['main.dream'] += '\n// locale switch should preserve this edit';
    window.__academy.setFiles(files);
    return files;
  });
  await settle(page);
  await chooseLocale(page, 'ar-EG');
  await settle(page);
  const localizedArtistPath = await page.getByTestId('artist-path').innerText();
  assert.match(localizedArtistPath, /مسار الفنان/, 'artist workflow should translate with the selected locale');
  assert.match(localizedArtistPath, /برومبت/, 'Arabic artist workflow should use برومبت terminology');
  assert.doesNotMatch(localizedArtistPath, /موجه/, 'Arabic artist workflow should not use the old prompt term');
  assert.doesNotMatch(localizedArtistPath, /Artist workflow/, 'artist workflow should not keep the English label after locale switch');
  assert.deepEqual(await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    files: window.__academy.getFiles(),
  })), { lang: 'ar-EG', dir: 'rtl', files: editedFiles }, 'locale switch should update metadata without losing edits');
  await page.getByRole('button', { name: 'فتح خريطة الدروس' }).click();
  assert.equal(await page.locator('.lesson-map').evaluate((node) => getComputedStyle(node).right), '0px', 'RTL lesson map should open from the inline-end side');
  await page.getByRole('button', { name: 'إغلاق خريطة الدروس' }).evaluate((button) => button.click());
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.__academy.ready);
  assert.equal(await selectedLocale(page), 'ar-EG', 'locale should persist across reloads');
  await page.evaluate(() => window.__academy.setLocale('en'));
  await settle(page);

  for (const lesson of LESSONS) {
    await page.evaluate((id) => window.__academy.goTo(id), lesson.id);
    await settle(page);
    await page.evaluate((files) => window.__academy.setFiles(files), lesson.files);
    await settle(page);
    const starterTasks = await taskState(page);
    assert.equal(starterTasks.length, lesson.tasks.length, `${lesson.id}: starter task count`);
    assert.ok(starterTasks.some((done) => !done), `${lesson.id}: starter is already complete`);

    await page.evaluate((files) => window.__academy.setFiles(files), lesson.solution);
    await settle(page);
    const solutionTasks = await taskState(page);
    assert.equal(solutionTasks.length, lesson.tasks.length, `${lesson.id}: solution task count`);
    assert.ok(solutionTasks.every(Boolean), `${lesson.id}: solution task failed`);
    assert.equal(
      (await page.evaluate(() => window.__academy.lastResult().diagnostics || [])).filter((item) => item.severity === 'error').length,
      0,
      `${lesson.id}: solution has compiler errors`,
    );
  }

  await page.getByTestId('lesson-map-toggle').click();
  assert.equal(await page.locator('.map-lesson').count(), LESSONS.length, 'lesson map should list every lesson');
  assert.equal(await page.locator('.map-lesson').filter({ hasText: 'undefined' }).count(), 0, 'lesson map should not show undefined labels');

  const capstoneTokens = await page.evaluate(() => window.monaco.editor.tokenize(
    '~( enum Light\n    Dawn = "dawn"\n)\nA ~Light.Dawn #ff8800',
    'dreamscript',
  ));
  assert.ok(capstoneTokens?.length, 'capstone source should tokenize');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mobileErrors = [];
  mobile.on('pageerror', (error) => mobileErrors.push(`pageerror: ${error.message}`));
  mobile.on('console', (message) => {
    if (message.type() === 'error') mobileErrors.push(`console: ${message.text()}`);
  });
  await mobile.goto(`${baseUrl}#/capstone`, { waitUntil: 'networkidle' });
  await mobile.evaluate(() => window.__academy.ready);
  await mobile.getByRole('button', { name: 'Result' }).click();
  await settle(mobile);
  const mobileWidth = await mobile.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(mobileWidth.scroll <= mobileWidth.client, `mobile page overflows horizontally: ${JSON.stringify(mobileWidth)}`);
  pageErrors.push(...mobileErrors);
  await mobile.close();
  await page.close();
  await browser.close();
  assert.deepEqual(pageErrors, [], `browser reported errors: ${pageErrors.join('; ')}`);
  console.log(`UI check passed: ${LESSONS.length} lessons, starter/solution tasks, tokenizer, map, and mobile layout.`);
} finally {
  server.kill('SIGTERM');
}
