const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const script = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const code = fs.readFileSync('tests/fixtures/two-floor-puzzle.py','utf8');
const c = vm.createContext({performance,code});
vm.runInContext(script.slice(0,script.indexOf('const $ =')),c);
vm.runInContext('var core=solverCore(); var fi=analyze(code); var fns=core.buildFns(fi);',c);
// Python generates full successor boards for a corpus including second-floor moves.
const reference = JSON.parse(execFileSync('python',['-c',code.slice(0,code.indexOf('m=main')) + `
import json
def neighbors(ast):
    out=[]
    for tile in range(1,15):
        dex=ast.index(tile)
        for dif,sw in jjs(ast,dex):
            b=list(ast)
            cs=[dex] if ast[dex]<13 else [dex,dex+(1 if ast[dex]==13 else 5)]
            for i in cs:b[i]=0
            for i in cs:b[i+dif-dex]=ast[dex]
            out.append(b)
    return out
boards=[p]
boards+=neighbors(p)
print(json.dumps([[b,neighbors(b)] for b in boards]))
`],{encoding:'utf8',timeout:20000}));
for (const [board,expected] of reference) {
  c.board=board;
  const actual=vm.runInContext('var out=[]; fns.nbrs(board,out,1); out.map(n=>n[0]);',c);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);
}
for(const weight of [0.7,0.7265625]) {
  const py=execFileSync('python',['-c',code.replace('0.7265625',String(weight))],{encoding:'utf8',timeout:20000}).trim().split('\n');
  c.weight=weight;
  const js=vm.runInContext(`var weighted=core.buildFns({...fi, knob:'hh',heurJs:fi.heurJs.replace('0.7265625','hh')});core.solve(weighted.cfg,fi.start,weight,1000000,true,{deadline:performance.now()+20000});`,c);
  assert.equal(js.mapping,Number(py[0]));
  assert.equal(js.moves,Number(py[1]));
  assert.equal(js.path.length-1,js.moves);
  assert.deepEqual(JSON.parse(JSON.stringify(js.path.at(-1))),JSON.parse(vm.runInContext('JSON.stringify(fi.goal)',c)));
  console.log(`PASS: hh=${weight}: Python and JS agree on ${js.moves} moves, ${js.mapping} states`);
}
console.log(`PASS: all successor boards match Python across ${reference.length} boards`);
// Membership must bind the whole arithmetic expression, including negation and logical boundaries.
for(const [expr,expected] of [['31-25 not in [6]',false],['31 - 25 in [6]',true],['2*3+1 in [7]',true],['-1 in [-1]',true],['False or 31-25 in [6]',true]]) {
  c.expr=expr;
  const actual=vm.runInContext(`core.buildFns({goal:[],goalVar:'end',prevName:'ast',stateVar:'asd',moveJs:'',heurJs:'var h = '+translateExpr(expr)+';'}).hfn([],[],1)`,c);
  assert.equal(actual,expected,expr);
}
// Copy uses the recommended numeric string, even if the graph is previewing another hh.
(async()=>{
  const copied=[],notices=[];
  const ui=vm.createContext({state:{best:{ok:true,rec:'0.7265625'},running:false},copyText:async text=>{copied.push(text);return true},toast:text=>notices.push(text)});
  vm.runInContext(script.slice(script.indexOf('async function copyRecommendedHH'),script.indexOf('function hashStr')),ui);
  await vm.runInContext('copyRecommendedHH()',ui);
  assert.deepEqual(copied,['0.7265625']);
  ui.state.running=true;
  await vm.runInContext('copyRecommendedHH()',ui);
  ui.state.running=false;ui.state.best=null;
  await vm.runInContext('copyRecommendedHH()',ui);
  assert.equal(copied.length,1);
  assert.equal(notices.length,1);
  console.log('PASS: HH copy uses recommendation and ignores missing/in-progress results');
})().catch(e=>{console.error(e);process.exitCode=1});
