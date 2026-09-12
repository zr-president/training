# -*- coding: utf-8 -*-
"""修正 check_content.js 里的变量名冲突（AQ 已被 abtest 使用）"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\check_content.js'
c = open(FP, 'r', encoding='utf-8').read()

# 只替换 AI PM 段内的变量名（该段以 '/* ---------- data/aipm.js ---------- */' 开始）
marker = '/* ---------- data/aipm.js ---------- */'
i = c.find(marker)
if i < 0:
    print('MISS'); sys.exit(1)
head, seg = c[:i], c[i:]

seg = seg.replace('const AQ = ap.AIPM_QUIZZES;', 'const PMQ = ap.AIPM_QUIZZES;')
seg = seg.replace('if (!AQ) err(', 'if (!PMQ) err(')
seg = seg.replace('AQ.forEach(q => {', 'PMQ.forEach(q => {')
seg = seg.replace('AQ.length', 'PMQ.length')
seg = seg.replace('const PRD = ap.AIPM_PRD_TASKS;', 'const PPRD = ap.AIPM_PRD_TASKS;')
seg = seg.replace('if (!PRD || PRD.length < 2)', 'if (!PPRD || PPRD.length < 2)')
seg = seg.replace('else PRD.forEach(t => {', 'else PPRD.forEach(t => {')
seg = seg.replace('(PRD || []).length', '(PPRD || []).length')
seg = seg.replace('const SM = ap.AIPM_SKILL_MAP;', 'const PSM = ap.AIPM_SKILL_MAP;')
seg = seg.replace('if (!SM || !SM.rows', 'if (!PSM || !PSM.rows')
seg = seg.replace('else SM.rows.forEach', 'else PSM.rows.forEach')
seg = seg.replace('SM && SM.rows ? SM.rows.length : 0', 'PSM && PSM.rows ? PSM.rows.length : 0')

open(FP, 'w', encoding='utf-8').write(head + seg)
print('OK 变量名已修正')
