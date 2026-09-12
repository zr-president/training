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
    'AGENT_CONTENT:typeof AGENT_CONTENT!=="undefined"?AGENT_CONTENT:null,' +
    'RADAR_DIMS:typeof RADAR_DIMS!=="undefined"?RADAR_DIMS:null,' +
    'AIPM_QUIZZES:typeof AIPM_QUIZZES!=="undefined"?AIPM_QUIZZES:null,' +
    'AIPM_PRD_TASKS:typeof AIPM_PRD_TASKS!=="undefined"?AIPM_PRD_TASKS:null,' +
    'AIPM_SKILL_MAP:typeof AIPM_SKILL_MAP!=="undefined"?AIPM_SKILL_MAP:null,' +
    'PY_CASES:typeof PY_CASES!=="undefined"?PY_CASES:null,' +
    'PY_TASK_REFS:typeof PY_TASK_REFS!=="undefined"?PY_TASK_REFS:null,' +
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
/* ---------- data/agent.js ---------- */
const ag = load('data/agent.js');
const AC = ag.AGENT_CONTENT;
if (!AC) err('AGENT_CONTENT 未加载');
else {
  if (!AC.intro) err('Agent 缺 intro');
  /* 场景判读（多选） */
  const s = AC.suitability;
  if (!s) err('Agent 缺 suitability');
  else {
    if (!s.options || s.options.length < 4) err('Agent 场景判读选项应 >=4');
    const okN = (s.options || []).filter(o => o.ok).length;
    const badN = (s.options || []).filter(o => !o.ok).length;
    if (okN < 2) err(`Agent 场景判读正确项应 >=2（现 ${okN}）`);
    if (badN < 1) err('Agent 场景判读应有不合适项（合规/低频/高影响）');
    (s.options || []).forEach((o, i) => { if (!o.t || !o.note) err(`Agent 场景判读选项#${i + 1} 缺 t/note`); });
    if (!s.keyPoints || s.keyPoints.length < 2) warn('Agent 场景判读建议 >=2 条要点');
  }
  /* 设计判读（单选多题） */
  if (!AC.designs || AC.designs.length < 3) err('Agent 设计题应 >=3');
  else {
    const ids = new Set();
    AC.designs.forEach(d => {
      if (ids.has(d.id)) err(`Agent 设计题 id 重复: ${d.id}`);
      ids.add(d.id);
      ['tag','title','scenario','ask','takeaway'].forEach(k => { if (!d[k]) err(`Agent ${d.id} 缺字段 ${k}`); });
      if (!d.options || d.options.length < 3) err(`Agent ${d.id} 选项应 >=3`);
      const o1 = (d.options || []).filter(o => o.ok).length;
      if (o1 !== 1) err(`Agent ${d.id} 单选正确项应恰好 1（现 ${o1}）`);
      (d.options || []).forEach((o, i) => { if (!o.t || !o.note) err(`Agent ${d.id} 选项#${i + 1} 缺 t/note`); });
      if (!d.keyPoints || d.keyPoints.length < 2) warn(`Agent ${d.id} 要点建议 >=2`);
    });
  }
  /* 计算器 */
  if (!AC.calc || !AC.calc.fields || AC.calc.fields.length < 6) err('Agent 计算器字段应 >=6');
  if (AC.calc && AC.calc.presets) {
    AC.calc.presets.forEach((p, i) => {
      if (p.freq === undefined || p.manual === undefined || p.agent === undefined ||
          p.review === undefined || p.upkeep === undefined || p.rate === undefined) {
        err(`Agent 计算器预设#${i + 1} 字段不全`);
      }
    });
  } else warn('Agent 计算器建议提供预设');
  /* 实操任务 */
  if (!AC.tasks || AC.tasks.length < 3) err('Agent 实操任务应 >=3');
  else AC.tasks.forEach(t => {
    if (!t.id || !t.title || !t.goal || !t.standard) err(`Agent 任务 ${t.id || '?'} 字段不全`);
  });
  /* 模板 */
  if (!AC.templates || AC.templates.length < 2) err('Agent 模板应 >=2');
  else AC.templates.forEach((t, i) => {
    if (!t.name || !t.desc || !t.body) err(`Agent 模板#${i + 1} 字段不全`);
    if (t.body && t.body.length < 200) warn(`Agent 模板「${t.name}」内容偏短`);
  });
  console.log(`AI Agent 实操: 判读 ${1 + AC.designs.length} 题 · 实操任务 ${AC.tasks.length} 个 · 模板 ${AC.templates.length} 份`);
}

/* ---------- data/radar.js ---------- */
const rd = load('data/radar.js');
const DIMS = rd.RADAR_DIMS;
if (!DIMS) err('RADAR_DIMS 未加载');
else {
  const ids = new Set();
  DIMS.forEach(d => {
    if (ids.has(d.id)) err(`Radar 维度 id 重复: ${d.id}`);
    ids.add(d.id);
    ['id','n','short','jd','target','module','modName','how'].forEach(k => { if (d[k] === undefined) err(`Radar ${d.id} 缺字段 ${k}`); });
    if (!(d.target >= 1 && d.target <= 5)) err(`Radar ${d.id} target 应在 1-5`);
    if (typeof d.hard !== 'boolean') err(`Radar ${d.id} hard 应为布尔`);
  });
  const hardN = DIMS.filter(d => d.hard).length;
  if (DIMS.length !== 9) warn(`Radar 维度为 ${DIMS.length} 个（原设计 9 个）`);
  console.log(`能力雷达: ${DIMS.length} 维（硬性要求 ${hardN} 项）`);
}

/* ---------- data/pycase.js / pytask_ref.js ---------- */
const pyc = load('data/pycase.js');
const PCASES = pyc.PY_CASES;
if (!PCASES) err('PY_CASES 未加载');
else {
  const ids = new Set();
  PCASES.forEach(p => {
    if (ids.has(p.id)) err(`Python 案例 id 重复: ${p.id}`);
    ids.add(p.id);
    ['group','title','scenario','code','output'].forEach(k => { if (!p[k] || !String(p[k]).trim()) err(`Python 案例 ${p.id} 缺字段 ${k}`); });
    if (!p.notes || p.notes.length < 2) err(`Python 案例 ${p.id} 讲解应 >=2 条`);
    if (!p.pitfalls || p.pitfalls.length < 1) err(`Python 案例 ${p.id} 应有常见坑`);
    if (p.code && p.code.indexOf('import pandas') < 0) warn(`Python 案例 ${p.id} 代码里似乎没有 import pandas`);
  });
  const groups = new Set(PCASES.map(p => p.group));
  console.log(`Python 数据分析案例: ${PCASES.length} 个案例 / ${groups.size} 个分组（均含真实运行输出）`);
}
const pyt = load('data/pytask_ref.js');
const PREFS = pyt.PY_TASK_REFS;
if (!PREFS) err('PY_TASK_REFS 未加载');
else {
  PREFS.forEach(r => {
    if (!r.id || !r.code) err(`练习题参考解 ${r.id || '?'} 字段不全`);
    if (r.answer === undefined || r.answer === '' || r.answer === 'NOT_FOUND') err(`练习题参考解 ${r.id} 未取到 answer`);
    if (!r.ok) err(`练习题参考解 ${r.id} 运行失败: ${r.err}`);
  });
  console.log(`练习题参考解: ${PREFS.length} 题（answer 均已真实运行得到）`);
}

/* ---------- data/aipm.js ---------- */
const ap = load('data/aipm.js');
const PMQ = ap.AIPM_QUIZZES;
if (!PMQ) err('AIPM_QUIZZES 未加载');
else {
  const ids = new Set();
  PMQ.forEach(q => {
    if (ids.has(q.id)) err(`AIPM 判读题 id 重复: ${q.id}`);
    ids.add(q.id);
    ['tag','scenario','ask','takeaway'].forEach(k => { if (!q[k]) err(`AIPM ${q.id} 缺字段 ${k}`); });
    if (!q.options || q.options.length < 3) err(`AIPM ${q.id} 选项应 >=3`);
    const okN = (q.options || []).filter(o => o.ok).length;
    const badN = (q.options || []).filter(o => !o.ok).length;
    if (q.type === 'multi') {
      if (okN < 2) err(`AIPM ${q.id} 多选正确项应 >=2（现 ${okN}）`);
      if (badN < 1) err(`AIPM ${q.id} 多选应有错误项`);
    } else {
      if (okN !== 1) err(`AIPM ${q.id} 单选正确项应恰好 1（现 ${okN}）`);
    }
    (q.options || []).forEach((o, i) => { if (!o.t || !o.note) err(`AIPM ${q.id} 选项#${i + 1} 缺 t/note`); });
    if (!q.keyPoints || q.keyPoints.length < 2) warn(`AIPM ${q.id} 要点建议 >=2`);
  });
  const PPRD = ap.AIPM_PRD_TASKS;
  if (!PPRD || PPRD.length < 2) err('AIPM_PRD_TASKS 应 >=2');
  else PPRD.forEach(t => {
    ['title','ctx','deliverable','takeaway'].forEach(k => { if (!t[k]) err(`PRD ${t.id} 缺字段 ${k}`); });
    if (!t.fields || t.fields.length < 3) err(`PRD ${t.id} 字段应 >=3`);
    else {
      t.fields.forEach(f => { if (!f.k || !f.label) err(`PRD ${t.id} 字段定义不全`); });
      if (!t.reference) err(`PRD ${t.id} 缺参考 PRD`);
      else t.fields.forEach(f => { if (!t.reference[f.k]) err(`PRD ${t.id} 参考 PRD 缺 ${f.k} 段`); });
    }
    if (!t.pitfalls || t.pitfalls.length < 2) warn(`PRD ${t.id} 常见错误建议 >=2`);
  });
  const PSM = ap.AIPM_SKILL_MAP;
  if (!PSM || !PSM.rows || PSM.rows.length < 5) err('AIPM_SKILL_MAP 行数应 >=5');
  else PSM.rows.forEach((r, i) => {
    ['n','ops','pm','level','how'].forEach(k => { if (!r[k]) err(`能力对照第 ${i + 1} 行缺 ${k}`); });
  });
  console.log(`AI 产品经理: 判读 ${PMQ.length} 题 · PRD 工坊 ${(PPRD || []).length} 题 · 能力对照 ${PSM && PSM.rows ? PSM.rows.length : 0} 维`);
}

console.log('');
if (warns.length) { console.log('⚠️ 提醒 (' + warns.length + '):'); warns.forEach(w => console.log('   ' + w)); }
if (errors.length) { console.log('❌ 错误 (' + errors.length + '):'); errors.forEach(e => console.log('   ' + e)); process.exit(1); }
console.log('✅ 内容结构校验全部通过');
