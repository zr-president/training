# -*- coding: utf-8 -*-
"""把答案区从"绿色醒目折叠块"改成低调的「显示参考答案」按钮"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ============ 1) 移除各模块顶部的"答案怎么看"提示条 ============
files = ['quiz-module.js', 'sql-module.js', 'lab-module.js', 'case-module.js',
         'pycase-module.js', 'aipm-module.js', 'agent-module.js']
removed = 0
for f in files:
    p = BASE + '\\js\\' + f
    s = open(p, 'r', encoding='utf-8').read()
    s2 = re.sub(r"[ \t]*'<div class=\"ans-tip\">[\s\S]*?</div>' \+\n", '', s)
    if s2 != s:
        open(p, 'w', encoding='utf-8').write(s2)
        removed += 1
        print(f'{f}: 已移除提示条')
print(f'共移除 {removed} 个提示条')

# ============ 2) CSS：答案区改为低调按钮样式 ============
FP = BASE + r'\css\style.css'
c = open(FP, 'r', encoding='utf-8').read()

start = c.find('/* ---------- 参考答案折叠区（统一醒目样式，方便查找） ---------- */')
end = c.find('/* 顶部"答案提示条" */')
if start >= 0 and end > start:
    old_block = c[start:end]
    new_block = '''/* ---------- 参考答案折叠区（低调按钮式：点一下才展开） ---------- */
details.acc.answer{border:none;background:transparent;box-shadow:none;margin-top:13px}
details.acc.answer>summary{
  display:inline-flex;align-items:center;gap:6px;width:auto;
  padding:8px 17px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--card);color:var(--text2);font-size:12px;font-weight:700;
  box-shadow:var(--shadow);transition:.16s;list-style:none;
}
details.acc.answer>summary::before{content:'';margin:0}
details.acc.answer>summary:hover{color:var(--accent);border-color:var(--accent);background:var(--accent-light)}
details.acc.answer[open]>summary{color:var(--accent);border-color:var(--accent);background:var(--accent-light);margin-bottom:10px}
details.acc.answer .accbody{
  border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--card);
  padding:12px 15px;box-shadow:var(--shadow);
}
'''
    c = c[:start] + new_block + c[end:]
    print('OK CSS 已改为按钮式')
else:
    print('MISS CSS 块', start, end)

open(FP, 'w', encoding='utf-8').write(c)

# ============ 3) 标签改为按钮文案「显示参考答案：…」 ============
label_map = [
    ('✅ 参考答案 · SQL 参考解 + 业务解读', '📖 显示参考答案：SQL 参考解 + 业务解读'),
    ('📖 参考答案 · 分析路径（', '📖 显示参考答案：分析路径（'),
    ('🎯 参考答案 · 参考结论', '📖 显示参考答案：参考结论'),
    ('📖 参考答案 · 参考拆解（', '📖 显示参考答案：参考拆解（'),
    ('📖 参考答案 · 参考 PRD', '📖 显示参考答案：参考 PRD'),
    ('✅ 参考答案 · 参考解 + 预期结果（真实运行）', '📖 显示参考答案：参考解 + 预期结果（真实运行）'),
    ('✅ 参考答案 · 参考解 + 业务解读', '📖 显示参考答案：参考解 + 业务解读'),
]
for f in files:
    p = BASE + '\\js\\' + f
    s = open(p, 'r', encoding='utf-8').read()
    n = 0
    for a, b in label_map:
        if a in s:
            s = s.replace(a, b); n += 1
    if n:
        open(p, 'w', encoding='utf-8').write(s)
        print(f'{f}: 标签改为 {n} 处')

# ============ 4) 首页答案说明压缩为一行 ============
FP2 = BASE + r'\js\app.js'
a = open(FP2, 'r', encoding='utf-8').read()
m = re.search(r"    /\* ===== 答案在哪看 ===== \*/[\s\S]*?    /\* ===== 当前进度 ===== \*/", a)
if m:
    short = """    /* ===== 答案在哪看（一行提示） ===== */
    h += '<div class="ans-tip" style="margin-top:13px"><span style="font-size:13px">💡</span><span>' +
         '<b>答案：</b>每题下方都有「📖 显示参考答案」按钮，点一下才展开；判读题点「提交判分」或「直接看答案」。' +
         '</span></div>';

    /* ===== 当前进度 ===== */"""
    a = a[:m.start()] + short + a[m.end():]
    open(FP2, 'w', encoding='utf-8').write(a)
    print('首页: ✅ 答案说明已压缩为一行')
else:
    print('首页: MISS 答案说明块')
