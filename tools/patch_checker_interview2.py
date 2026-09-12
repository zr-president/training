# -*- coding: utf-8 -*-
"""在 check_content.js 的 AIPM 段末尾补上面试题库校验"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\check_content.js'
c = open(FP, 'r', encoding='utf-8').read()

if 'AIPM_INTERVIEW 未加载' in c:
    print('已存在，跳过'); sys.exit(0)

marker = "  console.log(`AI 产品经理: 判读 ${PMQ.length} 题 · PRD 工坊 ${(PPRD || []).length} 题 · 能力对照 ${PSM && PSM.rows ? PSM.rows.length : 0} 维`);"
block = marker + """
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
  }"""

if marker in c:
    c = c.replace(marker, block, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK 面试题校验已补上')
else:
    print('MISS')
