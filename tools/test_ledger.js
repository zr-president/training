/* 事件账本 · 回归测试
   用法：node tools/test_ledger.js  （退出码 0 = 通过）
   重点测三件容易错的事：
   ① 学习日 04:00 边界（凌晨 3 点算前一天）
   ② 周一切周（周日属于上一个周一）
   ③ 幂等（刷新/重复点击/重复导入都不能多发一次） */
const path = require('path');
const Ledger = require(path.join(__dirname, '..', 'js', 'ledger.js'));

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}
function t(name, cond) { chk(name, !!cond, true); }

function mockStore() {
  const m = {};
  return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    _dump: () => m
  };
}

/* 上海时间 → UTC 毫秒 */
function sh(y, mo, d, h, mi) {
  return Date.UTC(y, mo - 1, d, h - 8, mi || 0);
}

console.log('=== T1 \u5b66\u4e60\u65e5 04:00 \u8fb9\u754c ===');
chk('03:59 \u7b97\u524d\u4e00\u5929', Ledger.learningDay(sh(2026, 10, 25, 3, 59)), '2026-10-24');
chk('04:00 \u7b97\u5f53\u5929', Ledger.learningDay(sh(2026, 10, 25, 4, 0)), '2026-10-25');
chk('00:30 \u7b97\u524d\u4e00\u5929', Ledger.learningDay(sh(2026, 10, 25, 0, 30)), '2026-10-24');
chk('23:00 \u7b97\u5f53\u5929', Ledger.learningDay(sh(2026, 10, 25, 23, 0)), '2026-10-25');
chk('12:00 \u7b97\u5f53\u5929', Ledger.learningDay(sh(2026, 10, 25, 12, 0)), '2026-10-25');
chk('\u8de8\u6708\u8fb9\u754c 11/1 02:00', Ledger.learningDay(sh(2026, 11, 1, 2, 0)), '2026-10-31');

console.log('');
console.log('=== T2 \u5468\u4e00\u5207\u5468 ===');
const ws = Ledger.weekStart('2026-10-25');
chk('2026-10-25 \u7684\u5468\u4e00', ws, '2026-10-19');
chk('\u5468\u4e00\u672c\u8eab\u8fd4\u56de\u81ea\u5df1', Ledger.weekStart('2026-10-19'), '2026-10-19');
/* 返回的日期必须是周一 */
const dow = new Date(ws + 'T00:00:00Z').getUTCDay();
chk('weekStart \u662f\u5468\u4e00 (getUTCDay=1)', dow, 1);
/* 任意一天到 weekStart 的差都在 0-6 */
let okDiff = true;
for (let i = 0; i < 14; i++) {
  const d = Ledger.shiftDay('2026-10-19', i);
  const w = Ledger.weekStart(d);
  const diff = Ledger.dayDiff(d, w);
  if (diff < 0 || diff > 6) okDiff = false;
  if (new Date(w + 'T00:00:00Z').getUTCDay() !== 1) okDiff = false;
}
t('14 \u5929\u4e2d\u4efb\u610f\u4e00\u5929\u7684 weekStart \u5747\u4e3a\u5468\u4e00\u4e14\u5dee 0-6', okDiff);
chk('\u661f\u671f\u5929\u7684\u5468\u4e00\u662f 6 \u5929\u524d', Ledger.dayDiff('2026-10-25', Ledger.weekStart('2026-10-25')), 6);

console.log('');
console.log('=== T3 add + \u5e42\u7b49\uff08ever\uff09===');
const s1 = mockStore();
let r = Ledger.add('practice', 'workflow::w01', 30, { day: '2026-10-25' }, s1);
t('\u9996\u6b21\u8bb0\u8d26\u6210\u529f', r.ok);
r = Ledger.add('practice', 'workflow::w01', 30, { day: '2026-10-25' }, s1);
chk('\u540c\u4e00\u9898\u65cf\u518d\u6b21\u8bb0\u8d26\u88ab\u62d2', r.ok, false);
chk('\u62d2\u7edd\u539f\u56e0\u662f duplicate', r.reason, 'duplicate');
/* \u6362\u4e00\u5929\u4e5f\u4e0d\u884c\uff08ever \u8303\u56f4\uff09*/
r = Ledger.add('practice', 'workflow::w01', 30, { day: '2026-10-26' }, s1);
chk('ever \u8303\u56f4\uff1a\u6362\u4e00\u5929\u4ecd\u88ab\u62d2', r.ok, false);
/* \u6362\u4e00\u9898\u53ef\u4ee5 */
r = Ledger.add('practice', 'workflow::w02', 30, { day: '2026-10-25' }, s1);
t('\u4e0d\u540c\u9898\u65cf\u53ef\u4ee5\u8bb0\u8d26', r.ok);
chk('\u5171 2 \u7b14', Ledger.events(s1).length, 2);

console.log('');
console.log('=== T4 \u5e42\u7b49\uff08day / week\uff09===');
const s2 = mockStore();
r = Ledger.add('daily', 'taskgroup', 10, { day: '2026-10-25' }, s2);
t('\u4eca\u65e5\u4efb\u52a1\u7ec4\u9996\u6b21', r.ok);
r = Ledger.add('daily', 'taskgroup', 10, { day: '2026-10-25' }, s2);
chk('\u540c\u4e00\u5929\u91cd\u590d\u9886\u53d6\u88ab\u62d2', r.reason, 'duplicate');
r = Ledger.add('daily', 'taskgroup', 10, { day: '2026-10-26' }, s2);
t('\u6b21\u65e5\u53ef\u4ee5\u518d\u9886', r.ok);

const s3 = mockStore();
r = Ledger.add('boss', 'ch01', 40, { day: '2026-10-19' }, s3);
t('\u5468\u4e00\u9886\u5173\u5e95\u5956\u52b1', r.ok);
r = Ledger.add('boss', 'ch01', 40, { day: '2026-10-22' }, s3);
chk('\u540c\u4e00\u5468\u5185\u91cd\u590d\u9886\u53d6\u88ab\u62d2', r.reason, 'duplicate');
r = Ledger.add('boss', 'ch01', 40, { day: '2026-10-26' }, s3);
t('\u4e0b\u4e00\u5468\u53ef\u4ee5\u518d\u9886', r.ok);
chk('\u4e24\u7b14 boss', Ledger.events(s3).filter(e => e.kind === 'boss').length, 2);

console.log('');
console.log('=== T5 \u6d88\u8d39\u4e0e\u4f59\u989d ===');
const s4 = mockStore();
Ledger.add('practice', 'a', 30, { day: '2026-10-25' }, s4);
Ledger.add('daily', 'tg', 10, { day: '2026-10-25' }, s4);
chk('\u8d5a\u5230 40', Ledger.coinBalance(s4), 40);
Ledger.add('spend', 'movie', -30, { day: '2026-10-25' }, s4);
chk('\u82b1\u6389 30 \u540e\u4f59\u989d', Ledger.coinBalance(s4), 10);
chk('\u7d2f\u8ba1\u8d5a', Ledger.coinEarned(s4), 40);
chk('\u7d2f\u8ba1\u82b1', Ledger.coinSpent(s4), 30);
/* spend \u662f free \u8303\u56f4\uff1a\u540c\u4e00\u4e2a key \u53ef\u4ee5\u82b1\u591a\u6b21 */
Ledger.add('spend', 'movie', -10, { day: '2026-10-25' }, s4);
chk('\u540c\u4e00\u9879\u53ef\u91cd\u590d\u82b1\u5e01', Ledger.coinBalance(s4), 0);

console.log('');
console.log('=== T6 \u5b66\u4e60\u65e5\u4e0e\u8fde\u7eed ===');
const s5 = mockStore();
['2026-10-19', '2026-10-20', '2026-10-22'].forEach(function (d) {
  Ledger.add('practice', 'k' + d, 30, { day: d }, s5);
});
chk('\u672c\u5468\u6709\u6d3b\u52a8\u7684\u5929\u6570', Ledger.activeDaysInWeek('2026-10-25', s5).length, 3);
chk('\u672c\u5468\u6d3b\u52a8\u65e5\u5217\u8868', Ledger.activeDaysInWeek('2026-10-25', s5).join(','), '2026-10-19,2026-10-20,2026-10-22');
chk('10-22 \u8fde\u7eed\u5929\u6570', Ledger.streakDays('2026-10-22', s5), 1);
chk('10-20 \u8fde\u7eed\uff08\u5f80\u524d\u6570\uff09', Ledger.streakDays('2026-10-20', s5), 2);
chk('\u4eca\u5929\u6ca1\u5b66\u4e0d\u7b97\u65ad\uff0810-23 \u770b\uff09', Ledger.streakDays('2026-10-23', s5), 1);
chk('\u5b8c\u5168\u6ca1\u5b66\u8fc7\u2192 0', Ledger.streakDays('2026-11-30', s5), 0);

console.log('');
console.log('=== T7 \u5468\u76ee\u6807 ===');
const s6 = mockStore();
const g0 = Ledger.weekGoalProgress(4, '2026-10-25', s6);
chk('\u521d\u59cb active', g0.active, 0);
chk('\u521d\u59cb\u672a\u8fbe\u6210', g0.done, false);
['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'].forEach(function (d) {
  Ledger.add('practice', 'g' + d, 30, { day: d }, s6);
});
const g1 = Ledger.weekGoalProgress(4, '2026-10-25', s6);
chk('\u56db\u5929\u540e active', g1.active, 4);
chk('\u8fbe\u6210\u76ee\u6807', g1.done, true);

console.log('');
console.log('=== T8 \u5bfc\u5165\u5e42\u7b49 ===');
const s7 = mockStore();
Ledger.add('practice', 'x', 30, { day: '2026-10-25' }, s7);
const dump = Ledger.exportJSON(s7);
let ir = Ledger.importJSON(dump, s7);
chk('\u5bfc\u5165\u81ea\u5df1\u7684\u5feb\u7167\uff1a\u65b0\u589e 0', ir.added, 0);
chk('\u5bfc\u5165\u81ea\u5df1\u7684\u5feb\u7167\uff1a\u8df3\u8fc7 1', ir.skipped, 1);
chk('\u4ecd\u53ea\u6709 1 \u7b14', Ledger.events(s7).length, 1);
chk('\u5bfc\u5165\u540e\u4f59\u989d\u4e0d\u53d8', Ledger.coinBalance(s7), 30);

const s8 = mockStore();
ir = Ledger.importJSON('{"not":"array"}', s8);
chk('\u975e\u6570\u7ec4\u62d2\u7edd', ir.reason, 'not-array');
ir = Ledger.importJSON('not json', s8);
chk('\u975e JSON \u62d2\u7edd', ir.reason, 'bad-json');
ir = Ledger.importJSON('[{"id":"e1","kind":"daily","coin":10},{"bad":1}]', s8);
chk('\u6709\u6548 1 \u7b14', ir.added, 1);
chk('\u65e0\u6548 1 \u7b14', ir.bad, 1);

console.log('');
console.log('=== T9 removeById \u4e0e\u6e05\u7a7a ===');
const s9 = mockStore();
const rr = Ledger.add('daily', 'tg', 10, { day: '2026-10-25' }, s9);
chk('\u65b0\u589e\u540e\u4f59\u989d', Ledger.coinBalance(s9), 10);
Ledger.removeById(rr.event.id, s9);
chk('\u5220\u9664\u540e\u4f59\u989d', Ledger.coinBalance(s9), 0);
Ledger.add('daily', 'tg', 10, { day: '2026-10-25' }, s9);
chk('\u5220\u9664\u540e\u53ef\u91cd\u65b0\u9886', Ledger.coinBalance(s9), 10);

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
