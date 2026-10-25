# -*- coding: utf-8 -*-
"""修两处语法错误：
   1) app.js：m11 行缺逗号导致 m12 插入后语法错误
   2) speech-module.js：PUNCT 字符串里的单引号把字符串截断 → 改用正则字面量
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------- 1) app.js ----------
AP = os.path.join(T, 'js', 'app.js')
a = open(AP, encoding='utf-8').read()
OLD = "    { m: 11, icon: '🔄', t: 'AI 工作流实验室', d: '110 题（36 核心 + 72 变式 + 2 关底挑战，按题族组织）：给真实场景+约束，自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 前 4 题来自真实项目', r: '#/workflow', ready: true, hot: true }\n"
NEW = "    { m: 11, icon: '🔄', t: 'AI 工作流实验室', d: '110 题（36 核心 + 72 变式 + 2 关底挑战，按题族组织）：给真实场景+约束，自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 前 4 题来自真实项目', r: '#/workflow', ready: true, hot: true },\n"
if OLD in a:
    a = a.replace(OLD, NEW, 1)
    open(AP, 'w', encoding='utf-8').write(a)
    print('✅ app.js：m11 行已补逗号')
elif re.search(r"m: 11,[^\n]*\},?\n\s*\{ m: 12", a):
    # 兜底：直接把 m11 行尾的 } 后面加逗号
    a2 = re.sub(r"(m: 11,[^\n]*?\})(\n\s*\{ m: 12)", r"\1,\2", a, count=1)
    if a2 != a:
        open(AP, 'w', encoding='utf-8').write(a2)
        print('✅ app.js：用兜底正则补了逗号')
    else:
        print('⚠️ app.js 兜底也没匹配')
else:
    print('⚠️ app.js 锚点未匹配，检查实际内容')
    i = a.find('m: 12')
    print(repr(a[max(0, i - 300):i + 60]))

# ---------- 2) speech-module.js ----------
SP = os.path.join(T, 'js', 'speech-module.js')
s = open(SP, encoding='utf-8').read()

# 删掉旧的 PUNCT 两行，换成正则字面量
old_block = re.search(r"  var PUNCT = [^\n]*\n  var PUNCT_RE = [^\n]*\n", s)
if old_block:
    new_block = "  var PUNCT_RE = /[\\s，。！？、；：\"\"''（）《》【】…—·,.!?;:'\"()\\[\\]{}<>~`\\-_+=|\\\\\\/@#$%^&*]/;\n"
    s = s[:old_block.start()] + new_block + s[old_block.end():]
    open(SP, 'w', encoding='utf-8').write(s)
    print('✅ speech-module.js：PUNCT 改为正则字面量')
else:
    print('⚠️ 未匹配 PUNCT 定义块')
    i = s.find('PUNCT')
    print(repr(s[max(0, i - 60):i + 200]))

# ---------- 3) 语法 ----------
print()
for f in ['js/app.js', 'js/speech-module.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
