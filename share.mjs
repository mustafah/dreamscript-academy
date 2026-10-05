#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const academyDirectory = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 5177;
const shareMinutesInput = process.env.ACADEMY_SHARE_MINUTES;
const persistent = shareMinutesInput === undefined || shareMinutesInput === '' || shareMinutesInput === '0';
const configuredMinutes = Number(shareMinutesInput);
const minutes = persistent ? null : configuredMinutes;
const token = randomBytes(24).toString('base64url');
const localUrl = `http://127.0.0.1:${port}`;
const tunnelPreference = String(process.env.ACADEMY_TUNNEL || '').trim().toLowerCase();
let academyProcess;
let tunnelProcess;
let shuttingDown = false;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT must be an integer between 1 and 65535 (received ${port})`);
}
if (!persistent && (!Number.isFinite(minutes) || minutes < 5)) {
  throw new Error('ACADEMY_SHARE_MINUTES must be 0 or a number >= 5');
}

function commandAvailable(command) {
  return spawnSync('which', [command], { stdio: 'ignore' }).status === 0;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function stopProcess(child) {
  if (child && child.exitCode === null && !child.killed) child.kill('SIGTERM');
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopProcess(tunnelProcess);
  stopProcess(academyProcess);
  await wait(100);
  process.exit(exitCode);
}

function startAcademy() {
  const child = spawn(process.execPath, ['serve.js'], {
    cwd: academyDirectory,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      ACADEMY_SHARE_TOKEN: token,
      ACADEMY_SHARE_MAX_AGE: persistent ? '0' : String(minutes * 60),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[academy] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[academy] ${chunk}`));
  child.on('error', (error) => {
    if (!shuttingDown) console.error(`Academy server error: ${error.message}`);
  });
  return child;
}

async function waitForAcademy() {
  const accessUrl = `${localUrl}/dreamscript-academy/?access=${encodeURIComponent(token)}`;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (academyProcess.exitCode !== null) {
      throw new Error(`Academy server exited before it was ready (code ${academyProcess.exitCode})`);
    }
    try {
      const response = await fetch(accessUrl);
      if (response.ok) return;
    } catch {
      // The server may need a moment to bind its port.
    }
    await wait(150);
  }
  throw new Error(`Academy server did not become ready at ${localUrl}`);
}

function tunnelCommand() {
  const cloudflared = {
    command: 'cloudflared',
    args: ['tunnel', '--url', localUrl],
    label: 'Cloudflare Quick Tunnel',
    domains: ['trycloudflare.com'],
  };
  const npxCloudflared = {
    command: 'npx',
    args: ['--yes', 'cloudflared', 'tunnel', '--url', localUrl],
    label: 'Cloudflare Quick Tunnel via npx',
    domains: ['trycloudflare.com'],
  };
  if (tunnelPreference === 'cloudflared') {
    if (commandAvailable('cloudflared')) return cloudflared;
    if (commandAvailable('npx')) return npxCloudflared;
    throw new Error('ACADEMY_TUNNEL=cloudflared requires cloudflared or npx');
  }
  if (!tunnelPreference && commandAvailable('cloudflared')) {
    return cloudflared;
  }
  if (!tunnelPreference && commandAvailable('npx')) {
    return npxCloudflared;
  }
  if (tunnelPreference === 'localtunnel') {
    if (!commandAvailable('npx')) {
      throw new Error('npx is required for the temporary localtunnel fallback');
    }
    return {
      command: 'npx',
      args: ['--yes', 'localtunnel', '--port', String(port), '--local-host', '127.0.0.1'],
      label: 'temporary localtunnel',
      domains: ['loca.lt'],
    };
  }
  if (tunnelPreference) {
    throw new Error(`Unsupported ACADEMY_TUNNEL value: ${tunnelPreference}`);
  }
  throw new Error('npx is required to start the temporary Cloudflare Quick Tunnel');
}

function openTunnel() {
  const config = tunnelCommand();
  const child = spawn(config.command, config.args, {
    cwd: academyDirectory,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let outputTail = '';
  let settled = false;
  let timer;

  const result = new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const inspectOutput = (chunk) => {
      const output = chunk.toString();
      outputTail = `${outputTail}${output}`.slice(-500);
      const candidates = [...output.matchAll(/https:\/\/[a-z0-9][a-z0-9.-]*(?::\d+)?/gi)];
      for (const candidate of candidates) {
        try {
          const url = new URL(candidate[0]);
          if (url.protocol !== 'https:') continue;
          if (!config.domains.some((domain) => (
            url.hostname === domain || url.hostname.endsWith(`.${domain}`)
          ))) continue;
          finish(resolve, url.origin);
          return;
        } catch {
          // Ignore malformed URL-like output until a valid tunnel URL appears.
        }
      }
    };
    child.stdout.on('data', inspectOutput);
    child.stderr.on('data', inspectOutput);
    child.on('error', (error) => finish(reject, error));
    child.on('close', (code) => {
      if (!settled) {
        finish(reject, new Error(`${config.label} exited before returning a URL (code ${code})`));
      } else if (!shuttingDown && code !== 0) {
        console.error(`${config.label} closed unexpectedly (code ${code})`);
        void shutdown(1);
      }
    });
    timer = setTimeout(() => {
      const detail = outputTail.trim().replace(/\s+/g, ' ');
      finish(reject, new Error(
        `${config.label} did not return a public HTTPS URL within 30 seconds${detail ? `: ${detail}` : ''}`,
      ));
      stopProcess(child);
    }, 30_000);
  });

  return { child, result };
}

process.once('SIGINT', () => void shutdown(0));
process.once('SIGTERM', () => void shutdown(0));

async function main() {
  academyProcess = startAcademy();
  try {
    await waitForAcademy();
    const tunnel = openTunnel();
    tunnelProcess = tunnel.child;
    const publicOrigin = await tunnel.result;
    const shareUrl = `${publicOrigin}/dreamscript-academy/?access=${encodeURIComponent(token)}#/prose`;
    console.log('');
    console.log('DreamScript Academy temporary share is ready');
    console.log(`URL: ${shareUrl}`);
    if (persistent) {
      console.log('This URL stays available until you press Ctrl+C. Anyone with this URL can open the preview.');
    } else {
      console.log(`Expires in ${minutes} minutes. Anyone with this URL can open the preview.`);
    }
    console.log('Press Ctrl+C to stop the Academy and close the tunnel.');
  } catch (error) {
    console.error(`Unable to create the Academy share: ${error.message}`);
    await shutdown(1);
  }
}

void main();
