// index.js — canon-graph: dump the entire live canon as a text graph
//
// Usage:
//   const { renderGraph, fetchCanon } = require('@superinstance/canon-graph');
//   const g = await renderGraph({ start: 470, depth: 2 });
//   console.log(g);

const DEFAULT_BASE = 'https://live-canon.superinstance.dev';

async function fetchCanon(base) {
  const url = new URL('/api/canon', base || DEFAULT_BASE);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderGraph(papers, opts = {}) {
  const start = opts.start;
  const depth = opts.depth || 1;
  const maxFNumber = opts.maxFNumber || 200;
  const visited = new Set();
  const lines = [];
  const byId = new Map();
  for (const p of Object.values(papers)) {
    byId.set(p.number, p);
  }
  function visit(num, d) {
    if (visited.has(num) || d > depth) return;
    visited.add(num);
    const p = byId.get(num);
    if (!p) return;
    if (p.f_number > maxFNumber) return;
    const indent = '  '.repeat(d);
    const refs = (p.ref_papers || [])
      .filter(r => byId.has(r))
      .filter(r => byId.get(r).f_number <= maxFNumber)
      .map(r => `paper-${r}`);
    const fRefs = (p.ref_f_numbers || [])
      .filter(f => f <= maxFNumber)
      .map(f => `F${f}`);
    const allRefs = [...refs, ...fRefs];
    const arrow = allRefs.length ? ' → ' + allRefs.join(', ') : '';
    lines.push(`${indent}paper-${p.number} (F${p.f_number})${arrow}  ${p.title}`);
    for (const ref of (p.ref_papers || [])) {
      visit(ref, d + 1);
    }
  }
  if (start) {
    visit(start, 0);
  } else {
    for (const p of Object.values(papers)) {
      visit(p.number, 0);
      if (lines.length > 200) break;
    }
  }
  return lines.join('\n');
}

module.exports = { fetchCanon, renderGraph, DEFAULT_BASE };
