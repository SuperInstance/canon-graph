const { fetchCanon, renderGraph, DEFAULT_BASE } = require('../index.js');

async function run() {
  console.log('canon-graph self-test');
  console.log('  base:', DEFAULT_BASE);

  const canon = await fetchCanon();
  const paperCount = Object.keys(canon).length;
  console.log('  papers in canon:', paperCount);
  if (paperCount < 70) throw new Error('expected at least 70 papers, got ' + paperCount);

  // The shape check that actually matters: the caller must be able to
  // TELL an empty canon from a differently-shaped one. A count that
  // reads 2 when the canon holds 71 is a client bug, not a service
  // outage, and the two look identical if the client does not
  // normalise.
  const sample = Object.values(canon)[0];
  if (!sample || typeof sample.number !== 'number') {
    throw new Error('the canon is not a map of papers: a value has no numeric `number`');
  }

  const g = await renderGraph(canon, { start: 470, depth: 2 });
  console.log('  graph from paper-470:');
  for (const line of g.split('\n').slice(0, 8)) {
    console.log('   ', line);
  }
  console.log('  ✓ all checks passed');
}

run().catch(err => {
  console.error('  ✗ test failed:', err.message);
  process.exit(1);
});
