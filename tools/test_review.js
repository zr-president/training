/* 间隔复习队列 · 回归测试
   用法：node tools/test_review.js  （退出码 0 = 通过）
   测的是 wfReview 的分类与排序逻辑（纯逻辑，不依赖 DOM）。 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const store = {};
const sandbox = {
  window: {}, console, String, Number, Object, Array, Math, JSON, RegExp, Date,
  parseInt, parseFloat, isNaN,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  document: { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({}) }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/progress.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/workflow-module.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/workflow.js'), 'utf8'), sandbox);
const WF = sandbox.WorkflowModule;
const TP = sandbox.TP;
const Q = sandbox.WORKFLOW_QUESTIONS;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}
function dateStr(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function score(id, values, daysAgo) {
  // values: [a,b,c] for 3-dim, or [a,b,c,d,e] for 5-dim
  const keys = values.length === 5 ? ['problem','evidence','method','result','limit'] : ['a','b','c'];
  values.forEach((v, i) => TP.setNote('workflow', id + '_score_' + keys[i], String(v)));
  if (daysAgo !== undefined) TP.setNote('workflow', id + '_ts', dateStr(daysAgo));
}
function find(id) { return WF._review().filter(x => x.q.id === id)[0]; }

console.log('=== T1 \u521d\u59cb\u72b6\u6001 ===');
let all = WF._review();
chk('\u9898\u6570\u4e0e\u9898\u5e93\u4e00\u81f4', all.length, Q.length);
chk('\u5168\u90e8\u4e3a\u300c\u672a\u81ea\u8bc4\u300d', all.filter(x => x.status === '未自评').length, Q.length);
chk('\u65e0\u5230\u671f\u9879', all.filter(x => x.due).length, 0);

console.log('');
console.log('=== T2 \u4f4e\u5206 \u2192 \u9700\u91cd\u505a\uff08<60%\uff09===');
score('w01', [0, 0, 0], 0);          // 0/6 = 0%
let x = find('w01');
chk('w01 \u72b6\u6001', x.status, '需重做');
chk('w01 \u81ea\u8bc4\u5206', x.score + '/' + x.max, '0/6');
chk('w01 \u5230\u671f', x.due, true);

console.log('');
console.log('=== T3 60-80% \u2192 \u5efa\u8bae\u590d\u67e5\uff0c3 \u5929\u540e\u624d\u50ac ===');
score('w02', [1, 1, 1], 0);          // 3/6 = 50% → 需重做
chk('w02 3/6 \u72b6\u6001', find('w02').status, '需重做');
score('w02', [2, 1, 1], 0);          // 4/6 = 66.7%
chk('w02 4/6 \u72b6\u6001', find('w02').status, '建议复查');
chk('w02 \u4eca\u5929\u4e0d\u50ac', find('w02').due, false);
score('w02', [2, 1, 1], 3);          // 3 天前
chk('w02 3 \u5929\u524d\u2192\u50ac', find('w02').due, true);
score('w02', [2, 1, 1], 2);          // 2 天前
chk('w02 2 \u5929\u524d\u2192\u4e0d\u50ac', find('w02').due, false);

console.log('');
console.log('=== T4 \u226580% \u2192 \u5df2\u638c\u63e1\uff0c14 \u5929\u540e\u624d\u50ac ===');
score('w03', [2, 2, 2], 0);          // 6/6 = 100%
chk('w03 \u72b6\u6001', find('w03').status, '已掌握');
chk('w03 \u4eca\u5929\u4e0d\u50ac', find('w03').due, false);
score('w03', [2, 2, 2], 10);
chk('w03 10 \u5929\u524d\u2192\u4e0d\u50ac', find('w03').due, false);
score('w03', [2, 2, 2], 14);
chk('w03 14 \u5929\u524d\u2192\u50ac', find('w03').due, true);

console.log('');
console.log('=== T5 \u6392\u5e8f\uff1a\u9700\u91cd\u505a\u5728\u524d\uff0c\u5df2\u638c\u63e1\u5728\u540e ===');
all = WF._review();
chk('\u9996\u4f4d\u662f\u9700\u91cd\u505a', all[0].pri, 0);
chk('\u672b\u5c3e\u662f\u672a\u81ea\u8bc4', all[all.length - 1].pri, 3);
// pri 单调不降
let mono = true;
for (let i = 1; i < all.length; i++) if (all[i].pri < all[i - 1].pri) mono = false;
chk('pri \u5355\u8c03\u4e0d\u964d', mono, true);

console.log('');
console.log('=== T6 \u6311\u6218\u9898\u7528 5 \u7ef4\uff08\u6ee1\u5206 10\uff09===');
TP.setNote('workflow', 'ch01_score_problem', '2');
TP.setNote('workflow', 'ch01_score_evidence', '2');
TP.setNote('workflow', 'ch01_score_method', '1');
TP.setNote('workflow', 'ch01_score_result', '1');
TP.setNote('workflow', 'ch01_score_limit', '0');
TP.setNote('workflow', 'ch01_ts', dateStr(0));
x = find('ch01');
chk('ch01 \u81ea\u8bc4\u5206\u6ee1\u5206\u662f 10', x.max, 10);
chk('ch01 \u81ea\u8bc4\u5206', x.score + '/' + x.max, '6/10');
chk('ch01 60% \u2192 \u5efa\u8bae\u590d\u67e5', x.status, '建议复查');

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
