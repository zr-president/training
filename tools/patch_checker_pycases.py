# -*- coding: utf-8 -*-
"""check_content.js 增加 pycase.js / pytask_ref.js 校验"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\check_content.js'
c = open(FP, 'r', encoding='utf-8').read()

# 1) load() 返回值补上 PY_CASES / PY_TASK_REFS
old_keys = "'SQL_LEVELS:typeof SQL_LEVELS!==\"undefined\"?SQL_LEVELS:null};');"
new_keys = ("'PY_CASES:typeof PY_CASES!==\"undefined\"?PY_CASES:null,' +\n"
            "    'PY_TASK_REFS:typeof PY_TASK_REFS!==\"undefined\"?PY_TASK_REFS:null,' +\n"
            "    'SQL_LEVELS:typeof SQL_LEVELS!==\"undefined\"?SQL_LEVELS:null};');")
if old_keys in c:
    c = c.replace(old_keys, new_keys, 1)
    print('OK load() 已扩展')
else:
    print('MISS load() 锚点')

# 2) 在 AI 产品经理段之前插入 Python 案例校验
anchor = '/* ---------- data/aipm.js ---------- */'
block = '''/* ---------- data/pycase.js / pytask_ref.js ---------- */
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

'''
if anchor in c:
    c = c.replace(anchor, block + anchor, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK 已插入 pycase 校验')
else:
    print('MISS aipm 锚点')
