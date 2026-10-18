// Offline: the client must handle every shape the service is known to
// return, WITHOUT the network.  This is the test that can run in CI
// when the service is down, and it is the one that would have caught
// the original defect on the day it was written.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { fetchCanon, renderGraph } = require('../index.js');

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'canon.json'), 'utf8')
);

const LIST_SHAPE = { papers: fixture.papers, count: fixture.count };
const MAP_SHAPE = Object.fromEntries(
  fixture.papers.map(p => [p.id, p])
);

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failures++; console.log('  FAIL ' + name + ': ' + e.message); }
}

// fetchCanon() is the only thing that talks to the network, so the
// shape handling is exercised by stubbing fetch.  The point is that
// the client must not need the service to be up in order to be
// tested.
async function fetchWith(payload) {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => payload });
  try { return await fetchCanon(); }
  finally { global.fetch = original; }
}

(async () => {
  console.log('canon-graph shape tests (offline)');

  for (const [label, payload] of [['list', LIST_SHAPE], ['map', MAP_SHAPE]]) {
    const canon = await fetchWith(payload);
    check(`the ${label} shape yields ${fixture.papers.length} papers`, () => {
      assert.strictEqual(Object.keys(canon).length, fixture.papers.length);
    });
    check(`the ${label} shape yields a map of papers`, () => {
      for (const p of Object.values(canon)) {
        assert.ok(p && typeof p.number === 'number',
          'a value has no numeric `number`');
      }
    });
    check(`the ${label} shape renders a graph`, () => {
      const g = renderGraph(canon, { start: 470, depth: 1 });
      assert.ok(g.includes('paper-470'), 'the graph did not mention paper-470');
    });
  }

  console.log(failures ? `  ${failures} checks FAILED` : '  all checks passed');
  process.exit(failures ? 1 : 0);
})();
