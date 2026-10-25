/* 指挥台 · 每日任务排程测试
   用法：node tools/test_command.js  （退出码 0 = 通过）
   测 buildPlan：按时间预算给任务、优先级顺序、排除生效、字段完整 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const store = {};
const sandbox = {
  window: {}, console, String, Number, Object, Array, Math, JSON, RegExp, Date,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    key: i => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; }
  },
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, textContent: '', classList: { add() {}, remove() {} }, appendChild() {} }),
    head: { appendChild() {} },
    body: { setAttribute() {} }
  }
};
vm.createContext(sandbox);
['js/progress.js', 'js/ledger.js', 'js/workflow-module.js', 'data/workflow.js', 'js/command.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox));

const CP = sandbox.CommandPanel;
const TP = sandbox.TP;
const Q = sandbox.WORKFLOW_QUESTIONS;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}
function t(name, cond) { chk(name, !!cond, true); }

function reset() {
  Object.keys(store).forEach(k => delete store[k]);
}

console.log('=== T1 \u4e09\u4e2a\u65f6\u95f4\u6863\u7684\u91cf\u4e0e\u603b\u65f6\u957f ===');
reset();
[15, 30, 60].forEach(function (b) {
  const p = CP.buildPlan(b);
  const budget = b;
  t(b + ' \u5206\u949f\u6863\u81f3\u5c11 1 \u9879', p.items.length >= 1);
  t(b + ' \u5206\u949f\u6863\u603b\u65f6\u957f\u4e0d\u8d85\u9884\u7b97+6', p.total <= budget + 6);
  t(b + ' \u5206\u949f\u6863\u603b\u65f6\u957f\u63a5\u8fd1\u9884\u7b97', p.total >= Math.min(budget, 10));
  console.log('     \u2192 ' + b + 'min: ' + p.items.length + ' \u9879, \u5171 ' + p.total + ' \u5206\u949f');
});
const p15 = CP.buildPlan(15), p30 = CP.buildPlan(30), p60 = CP.buildPlan(60);
t('60 \u5206\u949f\u6863\u7684\u9898\u6570\u4e0d\u5c11\u4e8e 15 \u5206\u949f\u6863', p60.items.length >= p15.items.length);
t('30 \u5206\u949f\u6863\u603b\u65f6\u957f\u4e0d\u5c11\u4e8e 15 \u5206\u949f\u6863', p30.total >= p15.total);

console.log('');
console.log('=== T2 \u5b57\u6bb5\u5b8c\u6574\u4e0e\u65e0\u91cd\u590d ===');
[[15, p15], [30, p30], [60, p60]].forEach(function (pair) {
  const b = pair[0], p = pair[1];
  let bad = 0, dup = false;
  const seen = {};
  p.items.forEach(function (it) {
    if (!it.qid || !it.title || !it.minutes || !it.reason || !it.kind) bad++;
    if (seen[it.qid]) dup = true;
    seen[it.qid] = 1;
  });
  chk(b + 'min \u5b57\u6bb5\u7f3a\u5931\u6570', bad, 0);
  chk(b + 'min \u91cd\u590d\u9898', dup, false);
  t(b + 'min \u6bcf\u9879\u90fd\u6709\u63a8\u8350\u539f\u56e0', p.items.every(it => it.reason.length > 3));
});

console.log('');
console.log('=== T3 \u8584\u5f31\u9898\u4f18\u5148 ===');
reset();
/* w01 自评 0/6 → 需重做 */
TP.setNote('workflow', 'w01_score_a', '0');
TP.setNote('workflow', 'w01_score_b', '0');
TP.setNote('workflow', 'w01_score_c', '0');
const pw = CP.buildPlan(30);
const first = pw.items[0];
chk('\u9996\u4f4d\u662f\u8584\u5f31\u9898', first.qid, 'w01');
chk('\u9996\u4f4d kind', first.kind, 'weak');
t('\u9996\u4f4d\u63a8\u8350\u539f\u56e0\u63d0\u5230\u81ea\u8bc4', /自评/.test(first.reason));

console.log('');
console.log('=== T4 \u5230\u671f\u590d\u67e5\u4f18\u5148\u4e8e\u65b0\u9898 ===');
reset();
/* w02 自评 4/6=66.7% 且 5 天前 → 建议复查且到期 */
TP.setNote('workflow', 'w02_score_a', '2');
TP.setNote('workflow', 'w02_score_b', '1');
TP.setNote('workflow', 'w02_score_c', '1');
const d5 = new Date(Date.now() - 5 * 86400000);
TP.setNote('workflow', 'w02_ts', d5.toISOString().slice(0, 10));
const pr = CP.buildPlan(30);
chk('\u9996\u4f4d\u662f\u590d\u67e5\u9898', pr.items[0].qid, 'w02');
chk('\u9996\u4f4d kind', pr.items[0].kind, 'review');
t('\u590d\u67e5\u9898\u53ea\u5360 4 \u5206\u949f', pr.items[0].minutes <= 5);

console.log('');
console.log('=== T5 \u6392\u9664\u751f\u6548\uff08\u6362\u4e00\u9879\uff09===');
reset();
TP.setNote('workflow', 'w03_score_a', '2');
TP.setNote('workflow', 'w03_score_b', '2');
TP.setNote('workflow', 'w03_score_c', '2');   /* w03 已掌握，不进计划 */
const base = CP.buildPlan(30);
const blocked = base.items[0].qid;
/* 写 excluded */
store['tp_cmd_state'] = JSON.stringify({ day: sandbox.Ledger.learningDay(), offset: 0, excluded: [blocked] });
const after = CP.buildPlan(30);
t('\u88ab\u6392\u9664\u7684\u9898\u4e0d\u518d\u51fa\u73b0', !after.items.some(it => it.qid === blocked));

console.log('');
console.log('=== T6 offset \u8f6e\u6362\uff08\u6362\u4e00\u7ec4\uff09===');
reset();
const before = CP.buildPlan(30).items.map(it => it.qid);
store['tp_cmd_state'] = JSON.stringify({ day: sandbox.Ledger.learningDay(), offset: 1, excluded: [] });
const rot = CP.buildPlan(30).items.map(it => it.qid);
chk('offset=1 \u540e\u987a\u5e8f\u4e0d\u540c', rot.join(',') !== before.join(','), true);
chk('offset=1 \u540e\u96c6\u5408\u76f8\u540c\uff08\u53ea\u662f\u987a\u5e8f\u53d8\uff09', rot.slice().sort().join(','), before.slice().sort().join(','));

console.log('');
console.log('=== T7 \u5df2\u638c\u63e1\u9898\u4e0d\u8fdb\u8ba1\u5212 ===');
reset();
for (let i = 1; i <= 6; i++) {
  const id = 'w0' + i;
  TP.setNote('workflow', id + '_score_a', '2');
  TP.setNote('workflow', id + '_score_b', '2');
  TP.setNote('workflow', id + '_score_c', '2');
}
const pm = CP.buildPlan(30);
const mastered = new Set(['w01', 'w02', 'w03', 'w04', 'w05', 'w06']);
t('\u5df2\u638c\u63e1\u7684 6 \u9898\u4e0d\u5728\u8ba1\u5212\u91cc', !pm.items.some(it => mastered.has(it.qid)));

console.log('');
console.log('=== T8 \u65f6\u95f4\u6863\u8fb9\u754c ===');
reset();
chk('getBudget \u9ed8\u8ba4 30', CP.getBudget(), 30);
CP.setBudget(60);
chk('setBudget(60) \u751f\u6548', CP.getBudget(), 60);
CP.setBudget(99);
chk('\u65e0\u6548\u6863\u4f4d\u4e0d\u751f\u6548\uff08\u4ecd 60\uff09', CP.getBudget(), 60);

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
