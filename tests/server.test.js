import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const academyDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => {
    probe.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function startServer(port, token, maxAge = '300') {
  const child = spawn(process.execPath, ['serve.js'], {
    cwd: academyDirectory,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      ACADEMY_SHARE_TOKEN: token,
      ACADEMY_SHARE_MAX_AGE: maxAge,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/dreamscript-academy/`);
      if (response.status === 401) return { child, baseUrl };
    } catch {
      // Wait for the server to bind its test port.
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error('server did not become ready');
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await once(child, 'close');
}

test('share protection gates the Academy and accepts a temporary token cookie', async () => {
  const port = await freePort();
  const token = 'test-share-token';
  const { child, baseUrl } = await startServer(port, token);
  try {
    const gate = await fetch(`${baseUrl}/dreamscript-academy/`);
    assert.equal(gate.status, 401);
    assert.match(await gate.text(), /Private Academy preview/);

    const wrongToken = await fetch(`${baseUrl}/dreamscript-academy/?access=wrong`);
    assert.equal(wrongToken.status, 401);

    const authorized = await fetch(
      `${baseUrl}/dreamscript-academy/?access=${encodeURIComponent(token)}`,
    );
    assert.equal(authorized.status, 200);
    assert.match(authorized.headers.get('set-cookie') || '', /dreamscript_academy_access=test-share-token/);
    assert.match(await authorized.text(), /<!doctype html>/i);

    const cookie = (authorized.headers.get('set-cookie') || '').split(';', 1)[0];
    const asset = await fetch(`${baseUrl}/dreamscript-academy/src/styles/base.css`, {
      headers: { cookie },
    });
    assert.equal(asset.status, 200);
    assert.match(await asset.text(), /color-scheme: dark/);
  } finally {
    await stopServer(child);
  }
});

test('persistent sharing omits automatic cookie expiry', async () => {
  const port = await freePort();
  const token = 'persistent-share-token';
  const { child, baseUrl } = await startServer(port, token, '0');
  try {
    const authorized = await fetch(
      `${baseUrl}/dreamscript-academy/?access=${encodeURIComponent(token)}`,
    );
    assert.equal(authorized.status, 200);
    const cookie = authorized.headers.get('set-cookie') || '';
    assert.match(cookie, /dreamscript_academy_access=persistent-share-token/);
    assert.doesNotMatch(cookie, /Max-Age=/);
  } finally {
    await stopServer(child);
  }
});
