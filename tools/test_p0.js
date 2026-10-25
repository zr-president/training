/* P0 回归测试：掌握度口径 / 通过后答错 / SQL 行比较歧义
   用法：node tools/test_p0.js
   退出码 0 = 全部通过 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* ---------- 用 Node 模拟浏览器环境，加载 progress.js ---------- */
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
const TP = sandbox.TP || sandbox.tp;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}

console.log('=== T1 \u638c\u63e1\u5ea6\u5206\u6bcd\uff08\u6838\u5fc3 bug\uff1a\u5206\u6bcd\u66fe\u7528\u300c\u5df2\u901a\u8fc7\u9898\u6570\u300d\uff0c\u5bfc\u81f4\u6052\u7b49\u4e8e 100%\uff09===');
TP.reset();
TP.mark('q1', true);    // 一次做对
TP.mark('q2', false);   // 一次做错
TP.mark('q2', true);    // 后来做对（非一次做对）
const s = TP.stats(2);
chk('done（两题都曾通过）', s.done, 2);
chk('firstTry（一次做对数）', s.firstTry, 1);
chk('mastery（一次做对 ÷ 总题数 = 1/2）', s.mastery, 50);
chk('firstTryRate（一次做对 ÷ 做过的 = 1/2）', s.firstTryRate, 50);

console.log('');
console.log('=== T2 \u901a\u8fc7\u540e\u518d\u7b54\u9519 ===');
TP.reset();
TP.mark('q1', true);
chk('通过后 isDone', TP.isDone('q1'), true);
chk('通过后 isWrong', TP.isWrong('q1'), false);
TP.mark('q1', false);
chk('答错后 isDone（进度不回退）', TP.isDone('q1'), true);
chk('答错后 isWrong（重新进错题本）', TP.isWrong('q1'), true);
chk('答错后 wrongList 长度', TP.wrongList().length, 1);
chk('答错后 done 仍算 1（历史通过）', TP.stats(1).done, 1);

console.log('');
console.log('=== T3 quizStats \u540c\u53e3\u5f84 ===');
TP.reset();
TP.markQuiz('metrics', 'm1', true, 100, false);
TP.markQuiz('metrics', 'm2', false, 0, false);
const q = TP.quizStats('metrics', 2);
chk('quiz mastery（1/2）', q.mastery, 50);
chk('quiz firstTryRate（1/2）', q.firstTryRate, 50);

console.log('');
console.log('=== T4 SQL \u884c\u6bd4\u8f83\u6b67\u4e49 ===');
/* 直接加载 sql-runner.js 暴露的 norm / isMutating（不依赖 sql.js 初始化） */
const srSandbox = {
  document: { createElement: () => ({}), head: { appendChild: () => {} } },
  Promise, JSON, Math, String, Number, Object, Array, console, isNaN
};
vm.createContext(srSandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sql-runner.js'), 'utf8'), srSandbox);
const SR = srSandbox.SQLRunner;

/* 复刻 rowKey 逻辑做对比（rowKey 未导出，用 norm 重建两种写法） */
function oldKey(row, d) { const a = []; for (let i = 0; i < row.length; i++) a.push(SR.norm(row[i], d)); return a.join('|'); }
function newKey(row, d) { const a = []; for (let i = 0; i < row.length; i++) a.push(SR.norm(row[i], d)); return JSON.stringify(a); }

const r1 = ['a|s:b', 'c'];
const r2 = ['a', 'b|s:c'];
chk('旧写法是否碰撞（应为 true = 曾有 bug）', oldKey(r1, 3) === oldKey(r2, 3), true);
chk('新写法是否不同（应为 false = 已修复）', newKey(r1, 3) === newKey(r2, 3), false);
chk('数字型字符串 vs 数字仍等价', newKey(['3'], 3) === newKey([3], 3), true);
chk('3.0 vs 3 等价', newKey(['3.0'], 3) === newKey([3], 3), true);

console.log('');
console.log('=== T5 \u6267\u884c\u9694\u79bb\u5173\u952e\u5b57\u8bc6\u522b ===');
const iso = [
  ['SELECT * FROM orders', false],
  ["select id from users where name='delete'", false],
  ['-- DELETE FROM x\nSELECT 1', false],
  ['WITH d AS (SELECT 1) SELECT * FROM d', false],
  ['SELECT deleted_at FROM users', false],
  ['DELETE FROM orders', true],
  ['UPDATE orders SET amt=0', true],
  ['INSERT INTO orders VALUES (1)', true],
  ['DROP TABLE orders', true],
  ['CREATE TABLE t(a)', true],
  ['select * from t; drop table t', true],
  ['PRAGMA table_info(orders)', true]
];
for (const [sql, expect] of iso) {
  chk('拦截判定：' + sql.slice(0, 34).replace(/\n/g, ' '), SR.isMutating(sql), expect);
}

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
