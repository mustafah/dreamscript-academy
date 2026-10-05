const CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
const LOCAL = new URL('../dreamscript-extension/node_modules/monaco-editor/min/vs', location.href).href.replace(/\/$/, '');

function loadScript(src, timeout) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => reject(new Error(`Timeout loading ${src}`)), timeout);
    script.src = src;
    script.async = true;
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error(`Failed ${src}`)); };
    document.head.append(script);
  });
}

function workerUrl(base) {
  const js = `self.MonacoEnvironment={baseUrl:${JSON.stringify(`${base}/`)}};importScripts(${JSON.stringify(`${base}/base/worker/workerMain.js`)});`;
  return URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
}

async function loadBase(base, timeout) {
  if (!window.require) await loadScript(`${base}/loader.js`, timeout);
  const worker = workerUrl(base);
  self.MonacoEnvironment = { getWorkerUrl: () => worker };
  window.require.config({ paths: { vs: base } });
  return new Promise((resolve, reject) => {
    window.require(['vs/editor/editor.main'], () => resolve(window.monaco), reject);
  });
}

export async function loadMonaco(timeout = 2800) {
  if (window.monaco?.editor) return { monaco: window.monaco, fallback: false, base: LOCAL };
  for (const base of [LOCAL, CDN]) {
    try { return { monaco: await loadBase(base, timeout), fallback: false, base }; }
    catch { /* try next */ }
  }
  return { monaco: null, fallback: true, base: null };
}
