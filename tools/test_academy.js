/* 学习学院 + 预测日志 · 回归测试
   用法：node tools/test_academy.js  （退出码 0 = 通过）

   测两类东西：
   A. 内容结构（ACADEMY）—— 防止「少一步」「提示不够三级」「正确答案不是唯一」这类结构缺陷
   B. Brier 与校准的数学 —— 防止算错分（这是整个预测日志的可信度基础） */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const store = {};
const sandbox = {
  window: {}, console, String, Number, Object, Array, Math, JSON, RegExp, Date,
  parseInt, parseFloat, isNaN, confirm: () => true,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
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
['js/progress.js', 'js/ledger.js', 'data/academy.js', 'data/academy_courses.js', 'js/predict.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox));

const ACADEMY = sandbox.ACADEMY;
const COURSES = sandbox.ACADEMY_COURSES;
const Predict = sandbox.Predict;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}
function t(name, cond) { chk(name, !!cond, true); }
function near(name, actual, expected, eps) {
  const ok = Math.abs(actual - expected) < (eps || 1e-9);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  ' + actual + ' / ' + expected);
  if (ok) pass++; else fail++;
}

console.log('');
console.log('=== A1 \u5c42\u7ea7\u4e0e\u8bfe\u7a0b\u603b\u4f53 ===');
chk('\u5c42\u6570', ACADEMY.layers.length, 3);
chk('\u5c42\u7684 id', ACADEMY.layers.map(l => l.id).join(','), 'L0,L1,L2');
t('\u6bcf\u5c42\u90fd\u6709 name \u4e0e note', ACADEMY.layers.every(l => l.name && l.note));
chk('\u8bfe\u7a0b\u6570', COURSES.length, 15);
t('\u6bcf\u95e8\u8bfe\u90fd\u6709 id/layer/name/goal/why', COURSES.every(c => c.id && c.layer && c.name && c.goal && c.why));
t('\u8bfe\u7a0b id \u552f\u4e00', new Set(COURSES.map(c => c.id)).size === COURSES.length);
t('\u8bfe\u7a0b\u7684 layer \u90fd\u5408\u6cd5', COURSES.every(c => ['L0', 'L1', 'L2'].indexOf(c.layer) >= 0));
t('\u6bcf\u95e8\u8bfe\u81f3\u5c11 4 \u4e2a\u5355\u5143', COURSES.every(c => c.units.length >= 4));

const ALLU = [];
COURSES.forEach(c => c.units.forEach(u => ALLU.push({ c, u })));
t('\u5355\u5143 id \u5168\u5c40\u552f\u4e00', new Set(ALLU.map(x => x.u.id)).size === ALLU.length);
t('\u6bcf\u4e2a\u5355\u5143\u90fd\u6709 title/depth/status/goal', ALLU.every(x => x.u.title && x.u.depth && x.u.status && x.u.goal));
t('status \u53ea\u80fd\u662f ready/outline/planned', ALLU.every(x => ['ready', 'outline', 'planned'].indexOf(x.u.status) >= 0));
t('depth \u53ea\u80fd\u662f \u5165\u95e8/\u8fdb\u9636/\u5b9e\u6218', ALLU.every(x => ['\u5165\u95e8', '\u8fdb\u9636', '\u5b9e\u6218'].indexOf(x.u.depth) >= 0));

t('\u6bcf\u95e8\u8bfe\u90fd\u6709\u8fdb\u9636\u6216\u5b9e\u6218\u5355\u5143\uff08\u4e0d\u5141\u8bb8\u53ea\u505c\u5728\u5165\u95e8\uff09',
  COURSES.every(c => c.units.some(u => u.depth === '\u8fdb\u9636' || u.depth === '\u5b9e\u6218')));
t('\u6bcf\u95e8\u8bfe\u7684\u6700\u540e\u4e00\u4e2a\u5355\u5143\u662f\u5b9e\u6218', COURSES.every(c => c.units[c.units.length - 1].depth === '\u5b9e\u6218'));

const readyIds = ALLU.filter(x => x.u.status === 'ready').map(x => x.u.id);
chk('ready \u5355\u5143\u6570\u4e0e\u5185\u5bb9\u6570\u4e00\u81f4', readyIds.length, ACADEMY.units.length);
t('ready \u5355\u5143\u6570 \u2265 10\uff08\u91d1\u878d 9 + \u7ecf\u8425\u5206\u6790 1\uff09', readyIds.length >= 10);
t('\u6bcf\u4e2a ready \u5355\u5143\u90fd\u6709\u5185\u5bb9', readyIds.every(id => ACADEMY.units.some(u => u.id === id)));
t('ACADEMY.units \u91cc\u7684\u6bcf\u4e2a\u90fd\u80fd\u5728\u8bfe\u7a0b\u91cc\u627e\u5230', ACADEMY.units.every(u => readyIds.indexOf(u.id) >= 0));
console.log('');
console.log('=== A2 \u6bcf\u4e00\u8bfe\u7684 7 \u6b65\u7ed3\u6784 ===');
const ORDER = ['scene', 'figure', 'example', 'guided', 'variant', 'artifact', 'retest'];
ACADEMY.units.forEach(function (u) {
  const types = u.steps.map(s => s.type);
  chk(u.id + ' \u6b65\u9aa4\u6570', u.steps.length, 7);
  chk(u.id + ' \u6b65\u9aa4\u987a\u5e8f', types.join(','), ORDER.join(','));
  t(u.id + ' \u6709 goal/prereq/minutes', u.goal && u.prereq && u.minutes > 0);
  t(u.id + ' \u6709 concepts', Array.isArray(u.concepts) && u.concepts.length >= 3);
  t(u.id + ' \u6709 pitfalls', Array.isArray(u.pitfalls) && u.pitfalls.length >= 2);
});

console.log('');
console.log('=== A3 \u5f15\u5bfc\u7ec3\u4e60\u7684\u63d0\u793a\u9636\u68af ===');
ACADEMY.units.forEach(function (u) {
  const g = u.steps.filter(s => s.type === 'guided')[0];
  t(u.id + ' \u6709\u63d0\u793a', Array.isArray(g.hints) && g.hints.length >= 3);
  chk(u.id + ' \u63d0\u793a\u6570', g.hints.length, 3);
  t(u.id + ' \u63d0\u793a\u9010\u7ea7\u52a0\u7801\uff08\u6bcf\u6761\u90fd\u957f\u4e8e\u4e0a\u4e00\u6761\uff09',
    g.hints[1].length > g.hints[0].length && g.hints[2].length > g.hints[1].length);
  const correct = g.options.filter(o => o.correct);
  chk(u.id + ' \u6b63\u786e\u9009\u9879\u6570', correct.length, 1);
  chk(u.id + ' answer \u4e0e\u6b63\u786e\u9009\u9879\u4e00\u81f4', g.answer, correct[0].text);
  t(u.id + ' \u6709 explain', g.explain && g.explain.length > 50);
});

console.log('');
console.log('=== A4 \u5176\u4f59\u6b65\u9aa4\u7684\u5fc5\u5907\u5b57\u6bb5 ===');
ACADEMY.units.forEach(function (u) {
  const v = u.steps.filter(s => s.type === 'variant')[0];
  t(u.id + ' \u53d8\u5f0f\u6709\u53c2\u8003', v.reference && v.reference.length > 80);
  t(u.id + ' \u53d8\u5f0f\u6709\u5360\u4f4d\u63d0\u793a', !!v.placeholder);
  const a = u.steps.filter(s => s.type === 'artifact')[0];
  t(u.id + ' \u4ea7\u7269\u6709\u81ea\u67e5\u6e05\u5355', Array.isArray(a.selfCheck) && a.selfCheck.length >= 3);
  const r = u.steps.filter(s => s.type === 'retest')[0];
  t(u.id + ' \u590d\u6d4b\u6709\u9898\u76ee', Array.isArray(r.questions) && r.questions.length >= 2);
  chk(u.id + ' \u590d\u6d4b\u95f4\u9694\u5929\u6570', r.days, 3);
});

console.log('');
console.log('=== A5 \u7981\u6b62\u9879\uff1a\u4e0d\u5f97\u5199\u672a\u6807\u6ce8\u7684\u5047\u6570\u636e ===');
ACADEMY.units.forEach(function (u) {
  const all = JSON.stringify(u);
  const hasFakeData = /虚\u6784|\u5047\u8bbe|\u793a\u4f8b/.test(all);
  t(u.id + ' \u7528\u5230\u6570\u5b57\u65f6\u6709\u300c\u865a\u6784/\u5047\u8bbe\u300d\u6807\u6ce8\u6216\u4e0d\u542b\u5177\u4f53\u4e1a\u7ee9\u6570\u5b57', hasFakeData || !/\d+\s*\u4e07|\d+%/.test(all));
});

console.log('');
console.log('=== B1 Brier \u6570\u5b66 ===');
chk('\u7a7a\u5217\u8868\u2192 n=0', Predict.brier([]).n, 0);
chk('\u7a7a\u5217\u8868\u2192 score=null', Predict.brier([]).score, null);

near('\u5b8c\u7f8e\u9884\u6d4b\uff08\u6982\u73871\u7ed3\u679c1\uff09', Predict.brier([{ resolved: true, p: 1, outcome: 1 }]).score, 0);
near('\u5b8c\u5168\u9519\uff08\u6982\u73871\u7ed3\u679c0\uff09', Predict.brier([{ resolved: true, p: 1, outcome: 0 }]).score, 1);
near('\u6c38\u8fdc\u62bc 50%', Predict.brier([{ resolved: true, p: 0.5, outcome: 1 }]).score, 0.25);

/* 手算：(0.7-1)^2=0.09  (0.7-0)^2=0.49  (0.3-1)^2=0.49 → (0.09+0.49+0.49)/3 */
near('\u4e09\u6761\u6df7\u5408', Predict.brier([
  { resolved: true, p: 0.7, outcome: 1 },
  { resolved: true, p: 0.7, outcome: 0 },
  { resolved: true, p: 0.3, outcome: 1 }
]).score, (0.09 + 0.49 + 0.49) / 3, 1e-9);

chk('\u672a\u5224\u5b9a\u7684\u4e0d\u8ba1\u5165', Predict.brier([
  { resolved: true, p: 1, outcome: 1 },
  { resolved: false, p: 0.1, outcome: null }
]).n, 1);

console.log('');
console.log('=== B2 \u6821\u51c6\u8868 ===');
const cal = Predict.calibration([
  { resolved: true, p: 0.9, outcome: 1 },
  { resolved: true, p: 0.85, outcome: 1 },
  { resolved: true, p: 0.5, outcome: 0 },
  { resolved: true, p: 0.1, outcome: 0 },
  { resolved: false, p: 0.9, outcome: null }
]);
const byLabel = {};
cal.forEach(b => { byLabel[b.label] = b; });
chk('80\u2013100% \u6876\u6761\u6570', byLabel['80\u2013100%'].n, 2);
chk('80\u2013100% \u6876\u547d\u4e2d', byLabel['80\u2013100%'].hits, 2);
near('80\u2013100% \u5b9e\u9645\u547d\u4e2d\u7387', byLabel['80\u2013100%'].actual, 1);
near('80\u2013100% \u5e73\u5747\u9884\u6d4b', byLabel['80\u2013100%'].avgP, 0.875, 1e-9);
chk('40\u201360% \u6876\u6761\u6570', byLabel['40\u201360%'].n, 1);
chk('0\u201320% \u6876\u6761\u6570', byLabel['0\u201320%'].n, 1);
chk('\u672a\u5224\u5b9a\u4e0d\u8ba1\u5165\u4efb\u4f55\u6876', cal.reduce((a, b) => a + b.n, 0), 4);
chk('\u6876\u6570\u56fa\u5b9a 5 \u4e2a', cal.length, 5);

console.log('');
console.log('=== B3 validate \u4e0e add/resolve ===');
const v1 = Predict.validate('', 50, Predict._shift(3));
chk('\u7a7a\u5185\u5bb9\u62d2\u7edd', v1.ok, false);
const v2 = Predict.validate('\u6d4b\u8bd5\u5224\u65ad\u5185\u5bb9', 150, Predict._shift(3));
chk('\u6982\u7387\u8d85 100 \u62d2\u7edd', v2.ok, false);
const v3 = Predict.validate('\u6d4b\u8bd5\u5224\u65ad\u5185\u5bb9', 50, '2020-01-01');
chk('\u8fc7\u53bb\u65e5\u671f\u62d2\u7edd', v3.ok, false);
const v4 = Predict.validate('\u6d4b\u8bd5\u5224\u65ad\u5185\u5bb9', 70, Predict._shift(5));
t('\u5408\u6cd5\u901a\u8fc7', v4.ok);
near('70% \u8f6c 0.7', v4.p, 0.7);

Object.keys(store).forEach(k => delete store[k]);
const a1 = Predict.add('\u672c\u5468\u6caa\u6307\u6536\u5728 3900 \u4ee5\u4e0a', 60, Predict._shift(7));
t('add \u6210\u529f', a1.ok);
chk('1 \u6761\u8bb0\u5f55', Predict.load().length, 1);
chk('\u521d\u59cb\u672a\u5224\u5b9a', Predict.load()[0].resolved, false);

Predict.resolve(a1.item.id, true);
chk('\u5224\u5b9a\u540e resolved', Predict.load()[0].resolved, true);
chk('\u5224\u5b9a\u540e outcome', Predict.load()[0].outcome, 1);
near('\u5224\u5b9a\u540e Brier', Predict.brier(Predict.load()).score, 0.16, 1e-9);  /* (0.6-1)^2 */

const st = Predict.stats(Predict.load());
chk('stats.total', st.total, 1);
chk('stats.resolved', st.resolved, 1);
chk('stats.pending', st.pending, 0);

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
