const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({performance});
vm.runInContext(script.slice(0, script.indexOf('const $ =')), context);
const fixture = fs.readFileSync('tests/fixtures/height-puzzle.py', 'utf8');
context.code = fixture;
const result = vm.runInContext(`
const fi = analyze(code);
const core = solverCore();
const fns = core.buildFns(fi);
const neighbors = [];
fns.nbrs(fi.start, neighbors, 1);
({neighbors, heuristic: fns.hfn(neighbors[0][0], fi.goal, 1)});
`, context);
const reference = JSON.parse(execFileSync('python', ['-c', fixture.slice(0, fixture.indexOf('m=main')) + '\nimport json\nprint(json.dumps([jjs(p, p.index(i)) for i in range(1,11)]))'], {encoding:'utf8'}));
const expected = [];
for (let tile = 1; tile <= 10; tile++) {
  for (const [destination] of reference[tile - 1]) {
    const start = [5,99,7,1,4,10,8,99,99,0,6,3,0,2,99,9];
    const source = start.indexOf(tile);
    [start[source],start[destination]] = [start[destination],start[source]];
    expected.push(start);
  }
}
assert.ok(expected.length);
assert.deepEqual(JSON.parse(JSON.stringify(result.neighbors.map(x=>x[0]))), expected);
assert.ok(Number.isFinite(result.heuristic));
for (const [expr, expectedValue] of [
  ['{1: 0}.get(1, 9)', 0], ['{1: None}.get(1, 9)', null],
  ['{1: 2}.get(8)', null], ['{1: 2}.get(8, 9)', 9],
  ['{1: 2}.get(1)', 2], ['{1: 2}.get(8, {2: 3}.get(2))', 3],
]) {
  context.expr = expr;
  const actual = vm.runInContext(`core.buildFns({goal: [], goalVar: 'end', prevName: 'ast', stateVar: 'asd', moveJs: '', heurJs: 'var h = ' + translateExpr(expr) + ';'}).hfn([], [], 1)`, context);
  assert.equal(actual, expectedValue, expr);
}
console.log('PASS: Python-equivalent puzzle neighbors and heuristic; dict.get present/missing/default/null/zero/nested cases');
const workerResult = vm.runInContext(`
const messages = [];
const worker = workerBody(m => messages.push(m));
worker({type:'init', fi, boards:[fi.start], precise:false});
worker({type:'eval', id:1, hh:1, idx:[0], cap:2000, prune:'none', tl:1000});
messages;
`, context);
assert.equal(workerResult[0].type, 'ready');
assert.equal(workerResult[1].type, 'result');
assert.equal(workerResult[1].per.length, 1);
console.log('PASS: worker initialization and bounded puzzle evaluation');
