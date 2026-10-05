// Decision oracles. A variation is a decision point; the oracle decides which
// alternative a run takes. Replaying with different decisions enumerates every
// dream a script can produce.

const allowed = (weights, n, j) => (weights ? weights[j] > 0 : j < n);
const firstAllowed = (weights, n) => {
  for (let j = 0; j < n; j++) if (allowed(weights, n, j)) return j;
  return 0;
};

function entry(index, n, weights, meta) {
  const total = weights ? weights.reduce((a, b) => a + b, 0) : n;
  const p = weights ? weights[index] / total : 1 / n;
  return { index, n, weights, p, ...meta };
}

export class ReplayOracle {
  constructor(path = []) {
    this.path = path;
    this.cursor = 0;
    this.log = [];
  }

  choose(n, weights, meta = {}) {
    const k = this.cursor++;
    let idx = k < this.path.length ? this.path[k] : firstAllowed(weights, n);
    if (idx >= n || !allowed(weights, n, idx)) idx = firstAllowed(weights, n);
    this.log.push(entry(idx, n, weights, meta));
    return idx;
  }
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks randomly (respecting weights) instead of systematically.
export class SampleOracle {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.log = [];
  }

  choose(n, weights, meta = {}) {
    let idx = 0;
    if (weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = this.rng() * total;
      for (let j = 0; j < n; j++) {
        r -= weights[j];
        if (r < 0) {
          idx = j;
          break;
        }
      }
    } else idx = Math.floor(this.rng() * n);
    this.log.push(entry(idx, n, weights, meta));
    return idx;
  }
}

// The path that follows `log` in depth-first order, or null when exhausted.
function nextPath(log) {
  for (let i = log.length - 1; i >= 0; i--) {
    const d = log[i];
    for (let j = d.index + 1; j < d.n; j++) {
      if (allowed(d.weights, d.n, j)) return [...log.slice(0, i).map((x) => x.index), j];
    }
  }
  return null;
}

const countOf = (d) => (d.weights ? d.weights.filter((w) => w > 0).length : d.n);

/**
 * Run a program once per possible set of choices (up to `max`).
 * `total` is exact when everything was enumerated and an estimate otherwise.
 */
export function explore(runOnce, { max = 36, budgetMs = 600 } = {}) {
  const variants = [];
  const started = Date.now();
  let path = [];
  let estimate = 1;
  for (;;) {
    const oracle = new ReplayOracle(path);
    const result = runOnce(oracle);
    if (variants.length === 0) estimate = oracle.log.reduce((acc, d) => acc * countOf(d), 1);
    variants.push({ ...result, decisions: oracle.log, probability: oracle.log.reduce((a, d) => a * d.p, 1) });
    path = result.aborted ? null : nextPath(oracle.log);
    if (!path || variants.length >= max || Date.now() - started > budgetMs) break;
  }
  const exact = !path;
  return { variants, exact, total: exact ? variants.length : Math.max(estimate, variants.length + 1) };
}
