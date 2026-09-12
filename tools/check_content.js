/* 内容结构校验：确保每道题都有正确答案、错误项、解析，且 id 唯一
   用法: node tools/check_content.js   （在项目根目录运行） */
const fs = require('fs');
const path = require('path');

function load(rel) {
  const code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const sandbox = {};
  const fn = new Function('window', code + '\nreturn {' +
    'SQL_QUESTIONS:typeof SQL_QUESTIONS!=="undefined"?SQL_QUESTIONS:null,' +
    'LAB_QUESTIONS:typeof LAB_QUESTIONS!=="undefined"?LAB_QUESTIONS:null,' +
    'METRICS_QUIZZES:typeof METRICS_QUIZZES!=="undefined"?METRICS_QUIZZES:null,' +
    'ABTEST_QUIZZES:typeof ABTEST_QUIZZES!=="undefined"?ABTEST_QUIZZES:null,' +
    'CASE_QUESTIONS:typeof CASE_QUESTIONS!=="undefined"?CASE_QUESTIONS:null,' +
    'SQL_LEVELS:typeof SQL_LEVELS!=="undefined"?SQL_LEVELS:null};');
  return fn(sandbox);
}

let errors = [];
let warns = [];
function err(m) { errors.push(m); }
function warn(m) { warns.push(m); }

/* ---------- data/questions.js ---------- */
const q = load('data/questions.js');
const SQ = q.SQL_QUESTIONS;
if (!SQ) err('SQL_QUESTIONS 未加载');
else {
  const ids = new Set();
  const levels = {};
  SQ.forEach(s => {
    if (ids.has(s.id)) err(`SQL 题 id 重复: ${s.id}`);
    ids.add(s.id);
    levels[s.level] = (levels[s.level] || 0) + 1;
    ['title','ctx','task','hint','solution','why','topic'].forEach(k => {
      if (!s[k] || !String(s[k]).trim()) err(`SQL ${s.id} 缺字段 ${k}`);
    });
    if (typeof s.order !== 'boolean') err(`SQL ${s.id} order 字段应为布尔`);
  });
  for (let L = 1; L <= 5; L++) if (!levels[L]) err(`SQL 缺少 L${L} 难度层`);
  console.log(`SQL 训练场: ${SQ.length} 题, 层级分布 ${JSON.stringify(levels)}`);
}

/* ---------- data/lab.js ---------- */
const lb = load('data/lab.js');
const LQ = lb.LAB_QUESTIONS;
if (!LQ) err('LAB_QUESTIONS 未加载');
else {
  const ids = new Set();
  LQ.forEach(s => {
    if (ids.has(s.id)) err(`Lab id 重复: ${s.id}`);
    ids.add(s.id);
    ['title','question','context','deliverable','conclusion','tag'].forEach(k => {
      if (!s[k] || !String(s[k]).trim()) err(`Lab ${s.id} 缺字段 ${k}`);
    });
    if (!s.steps || s.steps.length < 3) err(`Lab ${s.id} 分析步骤应 >=3 步`);
    if (!s.queries || s.queries.length < 1) err(`Lab ${s.id} 缺参考 SQL`);
    (s.queries || []).forEach((qq, i) => {
      if (!qq.sql || !qq.t) err(`Lab ${s.id} query#${i + 1} 缺 sql/t`);
      if (!qq.finding) warn(`Lab ${s.id} query#${i + 1} 缺关键发现`);
    });
  });
  console.log(`数据集实验室: ${LQ.length} 题, 参考SQL ${LQ.reduce((a, b) => a + b.queries.length, 0)} 条`);
}

/* ---------- data/metrics.js（多选） ---------- */
const mt = load('data/metrics.js');
const MQ = mt.METRICS_QUIZZES;
if (!MQ) err('METRICS_QUIZZES 未加载');
else {
  const ids = new Set();
  MQ.forEach(s => {
    if (ids.has(s.id)) err(`Metrics id 重复: ${s.id}`);
    ids.add(s.id);
    ['scenario','ask','north','takeaway'].forEach(k => { if (!s[k]) err(`Metrics ${s.id} 缺字段 ${k}`); });
    if (!s.options || s.options.length < 4) err(`Metrics ${s.id} 选项应 >=4`);
    const okN = (s.options || []).filter(o => o.ok).length;
    const badN = (s.options || []).filter(o => !o.ok).length;
    if (okN < 2) err(`Metrics ${s.id} 正确项应 >=2（现 ${okN}）`);
    if (badN < 1) err(`Metrics ${s.id} 应有至少 1 个错误项（虚荣指标陷阱）`);
    (s.options || []).forEach((o, i) => { if (!o.t || !o.note) err(`Metrics ${s.id} 选项#${i + 1} 缺 t/note`); });
    if (!s.tree || s.tree.length < 3) warn(`Metrics ${s.id} 指标树建议 >=3 条`);
    if (!s.pitfalls || s.pitfalls.length < 2) warn(`Metrics ${s.id} 常见陷阱建议 >=2 条`);
  });
  console.log(`指标设计工坊: ${MQ.length} 题, 候选指标 ${MQ.reduce((a, b) => a + b.options.length, 0)} 个`);
}

/* ---------- data/abtest.js（单选） ---------- */
const ab = load('data/abtest.js');
const AQ = ab.ABTEST_QUIZZES;
if (!AQ) err('ABTEST_QUIZZES 未加载');
else {
  const ids = new Set();
  AQ.forEach(s => {
    if (ids.has(s.id)) err(`ABTest id 重复: ${s.id}`);
    ids.add(s.id);
    ['scenario','ask','takeaway'].forEach(k => { if (!s[k]) err(`ABTest ${s.id} 缺字段 ${k}`); });
    if (!s.options || s.options.length < 3) err(`ABTest ${s.id} 选项应 >=3`);
    const okN = (s.options || []).filter(o => o.ok).length;
    if (okN !== 1) err(`ABTest ${s.id} 单选正确项应恰好 1 个（现 ${okN}）`);
    (s.options || []).forEach((o, i) => { if (!o.t || !o.note) err(`ABTest ${s.id} 选项#${i + 1} 缺 t/note`); });
    if (!s.keyPoints || s.keyPoints.length < 2) warn(`ABTest ${s.id} 判读要点建议 >=2 条`);
  });
  console.log(`实验分析训练: ${AQ.length} 题, 选项 ${AQ.reduce((a, b) => a + b.options.length, 0)} 个`);
}

/* ---------- data/cases.js（开放题） ---------- */
const cs = load('data/cases.js');
const CQ = cs.CASE_QUESTIONS;
if (!CQ) err('CASE_QUESTIONS 未加载');
else {
  const ids = new Set();
  CQ.forEach(s => {
    if (ids.has(s.id)) err(`Case id 重复: ${s.id}`);
    ids.add(s.id);
    ['title','symptom','deliverable','conclusion','takeaway','tag'].forEach(k => {
      if (!s[k]) err(`Case ${s.id} 缺字段 ${k}`);
    });
    if (!s.hypotheses || s.hypotheses.length < 3) err(`Case ${s.id} 假设应 >=3 个`);
    (s.hypotheses || []).forEach((h, i) => {
      ['h','how','verdict'].forEach(k => { if (!h[k]) err(`Case ${s.id} 假设#${i + 1} 缺 ${k}`); });
    });
    if (!s.actions || s.actions.length < 2) warn(`Case ${s.id} 参考动作建议 >=2 条`);
    if (!s.pitfalls || s.pitfalls.length < 2) warn(`Case ${s.id} 常见错误建议 >=2 条`);
  });
  console.log(`Case 拆解训练: ${CQ.length} 题, 假设共 ${CQ.reduce((a, b) => a + b.hypotheses.length, 0)} 个`);
}

/* ---------- 汇总 ---------- */
console.log('');
if (warns.length) { console.log('⚠️ 提醒 (' + warns.length + '):'); warns.forEach(w => console.log('   ' + w)); }
if (errors.length) { console.log('❌ 错误 (' + errors.length + '):'); errors.forEach(e => console.log('   ' + e)); process.exit(1); }
console.log('✅ 内容结构校验全部通过');
