/* 单元合并工具（可复用）
   用法：node tools/merge_units.js data/_fin_b1.js

   做四件事：
   1) 校验片段：7 步顺序、提示 3 级且逐级加长、正确选项唯一、answer 与之一致、
      变式有参考、产物有自查、复测 3 天、concepts≥3、pitfalls≥2、id 不重复
   2) 合并进 data/academy.js 的 ACADEMY.units
   3) 把 data/academy_courses.js 里对应单元的 status 从 outline 改成 ready
   4) 回读确认
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const FRAG = process.argv[2];
if (!FRAG) { console.log('用法: node tools/merge_units.js <片段文件>'); process.exit(1); }

const ORDER = ['scene', 'figure', 'example', 'guided', 'variant', 'artifact', 'retest'];

/* ---------- 1) 加载片段 ---------- */
const sb = { console, JSON, Object, Array, Math, String, Number, Date, RegExp };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, FRAG), 'utf8'), sb);
const NEW = sb.NEW_UNITS;
if (!Array.isArray(NEW) || !NEW.length) { console.log('❌ 片段里没有 NEW_UNITS 数组'); process.exit(1); }

/* ---------- 2) 校验 ---------- */
const errs = [];
NEW.forEach(u => {
  const id = u.id || '(无 id)';
  const need = ['id', 'layer', 'domain', 'title', 'subtitle', 'minutes', 'level', 'prereq', 'goal', 'concepts', 'steps', 'pitfalls'];
  need.forEach(k => { if (!u[k]) errs.push(id + ' 缺字段 ' + k); });
  if (!Array.isArray(u.steps) || u.steps.length !== 7) { errs.push(id + ' steps 不是 7 个'); return; }
  const types = u.steps.map(s => s.type);
  if (types.join(',') !== ORDER.join(',')) errs.push(id + ' 步骤顺序错：' + types.join(','));

  const g = u.steps.find(s => s.type === 'guided');
  if (!g) { errs.push(id + ' 缺 guided'); return; }
  if (!Array.isArray(g.hints) || g.hints.length !== 3) errs.push(id + ' 提示不是 3 级');
  else {
    if (!(g.hints[1].length > g.hints[0].length)) errs.push(id + ' 提示 2 不比 1 长');
    if (!(g.hints[2].length > g.hints[1].length)) errs.push(id + ' 提示 3 不比 2 长');
  }
  const correct = (g.options || []).filter(o => o.correct);
  if (correct.length !== 1) errs.push(id + ' 正确选项数 = ' + correct.length);
  else if (g.answer !== correct[0].text) errs.push(id + ' answer 与正确选项不一致');
  if (!g.explain || g.explain.length < 100) errs.push(id + ' explain 太短');

  const v = u.steps.find(s => s.type === 'variant');
  if (!v || !v.reference || v.reference.length < 150) errs.push(id + ' 变式参考太短或缺失');
  if (!v || !v.placeholder) errs.push(id + ' 变式缺 placeholder');

  const a = u.steps.find(s => s.type === 'artifact');
  if (!a || !Array.isArray(a.selfCheck) || a.selfCheck.length < 3) errs.push(id + ' 自查清单不足 3 条');

  const r = u.steps.find(s => s.type === 'retest');
  if (!r || !Array.isArray(r.questions) || r.questions.length < 2) errs.push(id + ' 复测题不足 2 道');
  if (!r || r.days !== 3) errs.push(id + ' 复测天数不是 3');

  if (!Array.isArray(u.concepts) || u.concepts.length < 3) errs.push(id + ' concepts 不足 3 个');
  if (!Array.isArray(u.pitfalls) || u.pitfalls.length < 2) errs.push(id + ' pitfalls 不足 2 条');
});

/* id 不能与已有重复 */
const AF = path.join(ROOT, 'data', 'academy.js');
let ac = fs.readFileSync(AF, 'utf8');
NEW.forEach(u => {
  const re = new RegExp("id:\\s*'" + u.id + "'");
  if (re.test(ac)) errs.push('id 已存在：' + u.id);
});

if (errs.length) {
  console.log('❌ 校验失败 ' + errs.length + ' 项：');
  errs.forEach(e => console.log('   · ' + e));
  process.exit(1);
}
console.log('✅ 片段校验通过：' + NEW.length + ' 个单元（' + NEW.map(u => u.id).join(', ') + '）');

/* ---------- 3) 插入 ACADEMY.units ---------- */
const insStart = ac.indexOf('units: [');
if (insStart < 0) { console.log('❌ 找不到 units: ['); process.exit(1); }
const openBr = ac.indexOf('[', insStart);
let depth = 0, i = openBr, inStr = null, closeBr = -1;
while (i < ac.length) {
  const c = ac[i];
  if (inStr) {
    if (c === '\\') { i += 2; continue; }
    if (c === inStr) inStr = null;
    i++; continue;
  }
  if (c === '"' || c === "'") { inStr = c; i++; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { closeBr = i; break; } }
  i++;
}
if (closeBr < 0) { console.log('❌ units 数组没闭合'); process.exit(1); }

/* 关键：去掉 JSON 数组的外层 [ ]，只插入元素
   —— 否则整个数组会作为一个元素被塞进去（表现为 units.length 少很多） */
const rawJson = JSON.stringify(NEW, null, 2).trim();
const innerJson = rawJson.slice(1, rawJson.lastIndexOf(']')).trim();
const body = innerJson.split('\n').map(l => '    ' + l).join('\n');
const before = ac.slice(0, closeBr).replace(/[\s,]*$/, '');
const after = ac.slice(closeBr);
ac = before + ',\n' + body + '\n  ' + after;
fs.writeFileSync(AF, ac, 'utf8');
console.log('✅ 已插入 data/academy.js');

/* ---------- 4) 翻转 status ---------- */
const CF = path.join(ROOT, 'data', 'academy_courses.js');
let cs = fs.readFileSync(CF, 'utf8');
let flipped = 0;
NEW.forEach(u => {
  const re = new RegExp("(\\{ id: '" + u.id + "'[^}]*?status: ')outline(')", 's');
  if (re.test(cs)) { cs = cs.replace(re, '$1ready$2'); flipped++; }
});
fs.writeFileSync(CF, cs, 'utf8');
console.log('✅ status 翻转 outline → ready：' + flipped + ' 个');

/* ---------- 5) 回读 ---------- */
try {
  execFileSync(process.execPath, ['--check', AF]);
  execFileSync(process.execPath, ['--check', CF]);
  const sb2 = { console, JSON, Object, Array, Math, String, Number, Date, RegExp };
  vm.createContext(sb2);
  vm.runInContext(fs.readFileSync(AF, 'utf8'), sb2);
  vm.runInContext(fs.readFileSync(CF, 'utf8'), sb2);
  const units = sb2.ACADEMY.units;
  const all = [];
  sb2.ACADEMY_COURSES.forEach(c => c.units.forEach(x => all.push(x)));
  console.log('   语法 OK · ACADEMY.units = ' + units.length + ' · 大纲 ready = ' +
    all.filter(x => x.status === 'ready').length + ' / ' + all.length);
  const missing = all.filter(x => x.status === 'ready' && !units.some(u => u.id === x.id));
  if (missing.length) console.log('   ⚠️ 标了 ready 但没有内容：' + missing.map(x => x.id).join(', '));
} catch (e) {
  console.log('❌ 回读失败：' + (e.message || e).slice(0, 300));
  process.exit(1);
}
