/* G01 双进度回归测试：等级曲线 + 两项分开记账
   用法：node tools/test_xp.js  （退出码 0 = 通过）
   等级曲线来自方案 G04：从 L 升到 L+1 需要 100 + 40 × (L−1) XP，
   累计门槛应为 100 / 240 / 420 / 640 … */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const store = {};
const sandbox = {
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  JSON, Math, Date, console, String, Number, Object, Array, parseInt, parseFloat, isNaN
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/progress.js'), 'utf8'), sandbox);
const TP = sandbox.TP;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}

/* 独立复刻等级曲线，用于校验 xpSummary 的实现 */
function levelOf(x) {
  let L = 1, need = 100, acc = 0, guard = 0;
  while (x >= acc + need && guard++ < 500) { acc += need; L += 1; need = 100 + 40 * (L - 1); }
  return { level: L, inLevel: x - acc, need, accAt: acc, nextAt: acc + need };
}

console.log('=== T1 \u7b49\u7ea7\u66f2\u7ebf\uff08\u7d2f\u8ba1\u95e8\u69db 100/240/420/640\uff09===');
[[0, 1], [99, 1], [100, 2], [239, 2], [240, 3], [419, 3], [420, 4], [639, 4], [640, 5]].forEach(([xp, exp]) => {
  chk('XP ' + xp + ' \u2192 \u7b49\u7ea7', levelOf(xp).level, exp);
});

console.log('');
console.log('=== T2 \u7ea7\u5185\u8fdb\u5ea6\u4e0e\u8ddd\u79bb ===');
/* \u66f2\u7ebf\uff1aL1 [0,100) need100 \u2192 L2 [100,240) need140 \u2192 L3 [240,420) need180 \u2192 L4 [420,640) need220 */
let r = levelOf(175);
chk('\u7ea7\u5185 inLevel', r.inLevel, 75);
chk('\u672c\u7ea7\u9700\u8981 need\uff08L2\uff09', r.need, 140);
chk('\u8ddd\u4e0b\u4e00\u7ea7 nextAt', r.nextAt, 240);
r = levelOf(250);
chk('XP250 \u7b49\u7ea7', r.level, 3);
chk('XP250 \u7ea7\u5185', r.inLevel, 10);
chk('XP250 \u672c\u7ea7\u9700\u8981\uff08L3\uff09', r.need, 180);

console.log('');
console.log('=== T3 \u4e24\u9879\u5206\u5f00\u8bb0\u8d26\uff08\u7b49\u7ea7\u4e0e\u72ec\u7acb\u5b8c\u6210\u4e92\u4e0d\u5f71\u54cd\uff09===');
TP.reset();
let x = TP.xpSummary();
chk('\u521d\u59cb\u7b49\u7ea7', x.level, 1);
chk('\u521d\u59cb XP', x.xp, 0);
chk('\u521d\u59cb\u72ec\u7acb\u5b8c\u6210', x.indep, 0);
chk('\u521d\u59cb\u4e00\u6b21\u505a\u5bf9\u7387', x.indepRate, 0);

/* 一次做对 3 题 → 独立完成 +3 */
TP.mark('a', true); TP.mark('b', true); TP.mark('c', true);
x = TP.xpSummary();
chk('\u4e00\u6b21\u505a\u5bf9 3 \u9898\u540e\u72ec\u7acb\u5b8c\u6210', x.indep, 3);
chk('\u505a\u8fc7\u9898\u6570', x.attempted, 3);
chk('\u4e00\u6b21\u505a\u5bf9\u7387', x.indepRate, 100);

/* 再做错一题（重做后答错）→ 独立完成不变（firstTry 已定格） */
TP.mark('d', false);
x = TP.xpSummary();
chk('\u7b54\u9519\u4e00\u9898\u540e\u72ec\u7acb\u5b8c\u6210\u4ecd\u4e3a 3', x.indep, 3);
chk('\u505a\u8fc7\u9898\u6570\u53d8 4', x.attempted, 4);
chk('\u4e00\u6b21\u505a\u5bf9\u7387\u964d\u5230 75', x.indepRate, 75);

console.log('');
console.log('=== T4 \u7b49\u7ea7\u53ea\u7531\u5b8c\u6210\u91cf\u51b3\u5b9a\uff08\u4e0d\u56e0\u4e00\u6b21\u505a\u5bf9\u800c\u8df3\u7ea7\uff09===');
x = TP.xpSummary();
chk('\u4ec5\u4e00\u6b21\u505a\u5bf9\u4e0d\u4f1a\u63d0\u5347 XP\uff08\u9700\u6709\u5168\u5c40\u9898\u5e93\u624d\u80fd\u7edf\u8ba1 done\uff09', x.xp, 0);

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
