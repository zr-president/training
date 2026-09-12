# -*- coding: utf-8 -*-
"""check_content.js 增加 AIPM_INTERVIEW 校验 + PY_CASES 的 exam 字段校验"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\check_content.js'
c = open(FP, 'r', encoding='utf-8').read()

# 1) load() 补 AIPM_INTERVIEW
old = "'AIPM_SKILL_MAP:typeof AIPM_SKILL_MAP!==\"undefined\"?AIPM_SKILL_MAP:null,' +"
new = ("'AIPM_SKILL_MAP:typeof AIPM_SKILL_MAP!==\"undefined\"?AIPM_SKILL_MAP:null,' +\n"
       "    'AIPM_INTERVIEW:typeof AIPM_INTERVIEW!==\"undefined\"?AIPM_INTERVIEW:null,' +")
if old in c and 'AIPM_INTERVIEW' not in c:
    c = c.replace(old, new, 1)
    print('OK load() 已扩展 AIPM_INTERVIEW')
else:
    print('SKIP load()')

# 2) exam 字段校验（加进 PY_CASES 循环）
old2 = "    if (p.code && p.code.indexOf('import pandas') < 0) warn(`Python 案例 ${p.id} 代码里似乎没有 import pandas`);"
new2 = ("    if (p.code && p.code.indexOf('import pandas') < 0) warn(`Python 案例 ${p.id} 代码里似乎没有 import pandas`);\n"
        "    if (!Array.isArray(p.exam)) warn(`Python 案例 ${p.id} 缺 exam 标签数组`);")
if old2 in c:
    c = c.replace(old2, new2, 1)
    print('OK exam 校验已加')
else:
    print('MISS exam 锚点')

# 3) 面试题库校验（插在 aipm 段之后）
anchor = "  console.log(`AI 产品经理: 判读 ${AQ.length} 题 · PRD 工坊 ${(PPRD || []).length} 题 · 能力对照 ${PSM && PSM.rows ? PSM.rows.length : 0} 维`);\n}"
block = """  console.log(`AI 产品经理: 判读 ${PMQ.length} 题 · PRD 工坊 ${(PPRD || []).length} 题 · 能力对照 ${PSM && PSM.rows ? PSM.rows.length : 0} 维`);
  const PIV = ap.AIPM_INTERVIEW;
  if (!PIV) err('AIPM_INTERVIEW 未加载');
  else {
    const ivIds = new Set();
    PIV.forEach(v => {
      if (ivIds.has(v.id)) err(`面试题 id 重复: ${v.id}`);
      ivIds.add(v.id);
      ['cat','q','intent','good','bad'].forEach(k => { if (!v[k]) err(`面试题 ${v.id} 缺字段 ${k}`); });
      if (!v.frame || v.frame.length < 3) err(`面试题 ${v.id} 回答框架应 >=3 步`);
      if (!v.points || v.points.length < 3) err(`面试题 ${v.id} 参考要点应 >=3 条`);
      if (typeof v.hot !== 'boolean') warn(`面试题 ${v.id} hot 建议用布尔值`);
    });
    const cats = new Set(PIV.map(v => v.cat));
    console.log(`AI PM 面试题库: ${PIV.length} 题 / ${cats.size} 个分类（高频 ${PIV.filter(v => v.hot).length} 题）`);
  }
}"""
if anchor in c:
    c = c.replace(anchor, block, 1)
    print('OK 面试题校验已加')
else:
    print('MISS aipm console 锚点')

open(FP, 'w', encoding='utf-8').write(c)
print('done')
