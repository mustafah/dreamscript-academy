#!/usr/bin/env node
// Tiny static server for the academy. It serves the repository root so the
// editor can load Monaco from dreamscript-extension/node_modules.
//   npm start            ->  http://localhost:5177/dreamscript-academy/
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 5177;
const host = process.env.HOST || '127.0.0.1';
const shareToken = String(process.env.ACADEMY_SHARE_TOKEN || '').trim();
const shareMaxAgeInput = process.env.ACADEMY_SHARE_MAX_AGE;
const shareMaxAge = shareMaxAgeInput === '0'
  ? null
  : shareMaxAgeInput === undefined || shareMaxAgeInput === ''
    ? 3600
    : Number(shareMaxAgeInput);
const shareCookieName = 'dreamscript_academy_access';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

if (shareMaxAge !== null && (!Number.isFinite(shareMaxAge) || shareMaxAge < 60)) {
  throw new Error('ACADEMY_SHARE_MAX_AGE must be 0 or a number of seconds >= 60');
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function cookieValue(header, name) {
  const prefix = `${name}=`;
  return String(header || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

function tokenMatches(candidate) {
  if (!shareToken || !candidate) return false;
  const expected = Buffer.from(shareToken);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sendShareGate(res, pathname) {
  const safePath = escapeHtml(pathname || '/dreamscript-academy/');
  send(res, 401, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Private DreamScript Academy preview</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { min-height: 100dvh; margin: 0; display: grid; place-items: center; padding: 1rem; color: #edeaff; background: #14112b; }
      main { width: min(100%, 28rem); padding: clamp(1.4rem, 6vw, 2.4rem); border: 1px solid #50467d; border-radius: 1.4rem; background: #211b47; box-shadow: 0 1.5rem 4rem #08081899; }
      h1 { margin: 0 0 .7rem; font-size: clamp(1.35rem, 6vw, 1.9rem); }
      p { margin: 0 0 1.4rem; color: #bcb7de; line-height: 1.55; }
      label { display: grid; gap: .45rem; color: #edeaff; font-weight: 700; }
      input, button { width: 100%; min-height: 2.9rem; border: 1px solid #655b99; border-radius: .8rem; font: inherit; }
      input { padding: .7rem .8rem; color: #edeaff; background: #14112b; }
      button { margin-top: .8rem; color: #14112b; background: #ffc857; font-weight: 800; cursor: pointer; }
      input:focus-visible, button:focus-visible { outline: 2px solid #5eead4; outline-offset: 2px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Private Academy preview</h1>
      <p>Enter the temporary access code shared with you to view DreamScript Academy.</p>
      <form action="${safePath}" method="get">
        <label>Access code <input name="access" type="password" autocomplete="one-time-code" required autofocus></label>
        <button type="submit">Open preview</button>
      </form>
    </main>
  </body>
</html>`, 'text/html; charset=utf-8');
}

function authorizeShare(req, res, url) {
  if (!shareToken) return true;
  const queryToken = url.searchParams.get('access') || '';
  const cookieToken = cookieValue(req.headers.cookie, shareCookieName);
  const authorized = tokenMatches(queryToken) || tokenMatches(cookieToken);
  if (!authorized) {
    sendShareGate(res, url.pathname);
    return false;
  }
  if (tokenMatches(queryToken)) {
    const forwardedProtocol = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const secure = forwardedProtocol === 'https' || Boolean(req.socket.encrypted);
    const attributes = [
      `${shareCookieName}=${queryToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
    ];
    if (shareMaxAge !== null) attributes.push(`Max-Age=${shareMaxAge}`);
    if (secure) attributes.push('Secure');
    res.setHeader('Set-Cookie', attributes.join('; '));
  }
  return true;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!authorizeShare(req, res, url)) return;
  if (url.pathname === '/') {
    res.writeHead(302, { Location: '/dreamscript-academy/' });
    return res.end();
  }
  let file;
  try {
    file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
  } catch {
    return send(res, 400, 'Bad request');
  }
  if (file !== root && !file.startsWith(root + path.sep)) return send(res, 403, 'Forbidden');
  return fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (readErr, data) => {
      if (readErr) return send(res, 404, 'Not found');
      return send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream');
    });
  });
});

server.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`DreamScript Academy -> http://${displayHost}:${port}/dreamscript-academy/`);
});
