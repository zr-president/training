# -*- coding: utf-8 -*-
"""答案区统一视觉：①绿色醒目样式 ②标签加"参考答案 ·"前缀 ③首页加"答案在哪看\""""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ============ 1) CSS：答案折叠区样式 ============
FP = BASE + r'\css\style.css'
c = open(FP, 'r', encoding='utf-8').read()
if 'details.acc.answer' not in c:
    css = """/* ---------- 参考答案折叠区（统一醒目样式，方便查找） ---------- */
details.acc.answer{border-color:rgba(5,150,105,.38);background:linear-gradient(180deg,rgba(5,150,105,.07),transparent 70%)}
details.acc.answer>summary{color:var(--green);font-weight:800}
details.acc.answer>summary::before{content:'▸ ';color:var(--green)}
details.acc.answer[open]>summary::before{content:'▾ '}
details.acc.answer>summary:hover{color:var(--green)}
.ans-badge{display:inline-block;font-size:9px;font-weight:800;padding:1px 7px;border-radius:20px;
  background:rgba(5,150,105,.15);color:var(--green);margin-left:7px;vertical-align:1px;letter-spacing:.3px}
/* 顶部"答案提示条" */
.ans-tip{display:flex;align-items:center;gap:8px;background:rgba(5,150,105,.07);border:1px solid rgba(5,150,105,.28);
  border-radius:var(--radius-sm);padding:9px 13px;font-size:11.5px;color:var(--text2);line-height:1.7;margin-bottom:12px}
.ans-tip b{color:var(--green)}

*{box-sizing:border-box;margin:0;padding:0}"""
    c = c.replace('*{box-sizing:border-box;margin:0;padding:0}', css, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK CSS 已加答案样式')
else:
    print('CSS 已存在')

# ============ 2) 各模块：答案折叠区加 answer 类 + 标签前缀 ============
files = ['sql-module.js', 'lab-module.js', 'case-module.js', 'aipm-module.js', 'pycase-module.js']
total = 0
for f in files:
    p = BASE + r'\js' + '\\' + f
    s = open(p, 'r', encoding='utf-8').read()
    # 给"参考"类 summary 的 details 加 answer 类
    s2, n = re.subn(r'<details class="acc"([^>]*)><summary>([^<]*?参考)',
                    r'<details class="acc answer"\1><summary>\2', s)
    # 标签前缀
    labels = [
        ('✅ 参考解 + 业务解读', '✅ 参考答案 · SQL 参考解 + 业务解读'),
        ('📖 参考分析路径（', '📖 参考答案 · 分析路径（'),
        ('🎯 参考结论（先自己写，再对照）', '🎯 参考答案 · 参考结论'),
        ('📖 参考拆解（', '📖 参考答案 · 参考拆解（'),
        ('📖 参考 PRD（先自己写完再看）', '📖 参考答案 · 参考 PRD'),
        ('✅ 参考解 + 预期结果（真实运行）', '✅ 参考答案 · 参考解 + 预期结果（真实运行）'),
        ('✅ 参考解 + 业务解读', '✅ 参考答案 · 参考解 + 业务解读'),
    ]
    m = 0
    for a, b in labels:
        if a in s2:
            s2 = s2.replace(a, b); m += 1
    if s2 != s:
        open(p, 'w', encoding='utf-8').write(s2)
    print(f'{f}: 答案区 class +{n} · 标签 +{m}')
    total += n

print(f'合计处理 {total} 个答案折叠区')
