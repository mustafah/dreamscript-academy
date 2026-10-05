// JSON-friendly view of the parse tree (for the "Under the hood" panel).
export function simplifyAst(node) {
  if (Array.isArray(node)) return node.map(simplifyAst);
  if (node instanceof Error) return { error: node.message };
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k !== 'loc' && k !== 'src' && v !== undefined) out[k] = simplifyAst(v);
    }
    return out;
  }
  return node;
}
