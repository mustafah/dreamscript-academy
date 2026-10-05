// Shared helpers for the core tests.
import { compile } from '../src/core/index.js';
import { valueOf } from '../src/lessons/helpers.js';

export const run = (src, opts) => compile(src, opts);
export const prompt = (src) => compile(src).variants[0].prompt;
export const prompts = (src, opts) => compile(src, opts).variants.map((v) => v.prompt);
export const errors = (r) => r.diagnostics.filter((d) => d.severity === 'error').map((d) => d.message);
export const warnings = (r) => r.diagnostics.filter((d) => d.severity === 'warning').map((d) => d.message);
export const value = (src, name) => valueOf(compile(src), name);
export const files = (map, main) => compile({ files: map, main: main || Object.keys(map)[0] });
