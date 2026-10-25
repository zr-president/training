# -*- coding: utf-8 -*-
"""审计修复：
   1) 训练场 3 处 <12px 字号 → 12px（符合 DESIGN.md 第 2 节硬规则）
   2) 脚本 ?v= 统一到 v8（原来 v5/v6/v7 混乱，改一个文件要记它的版本号，容易漏）
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------- 1) 字号 ----------
CP = os.path.join(T, 'css', 'style.css')
c = open(CP, encoding='utf-8').read()
FIX = [
    ('.brand small{display:block;font-size:11px;', '.brand small{display:block;font-size:12px;'),
    ('.badge{font-size:11px;', '.badge{font-size:12px;'),
    ('.ring em{font-size:8.5px;', '.ring em{font-size:12px;'),
]
n = 0
for a, b in FIX:
    if a in c:
        c = c.replace(a, b, 1); n += 1
        print('  ✅ ' + a[:44] + '… → 12px')
open(CP, 'w', encoding='utf-8').write(c)
print('字号修复 %d 处' % n)

sz = [float(m.group(1)) for m in re.finditer(r'font-size:\s*([0-9.]+)px', c)]
low = [v for v in sz if v < 12]
print('  修复后 <12px: %d 处' % len(low))

# ---------- 2) 脚本版本统一 ----------
HP = os.path.join(T, 'index.html')
h = open(HP, encoding='utf-8').read()
before = sorted(set(re.findall(r'\.js\?v=(v\d+)', h)))
h2 = re.sub(r'\.js\?v=v\d+', '.js?v=v8', h)
open(HP, 'w', encoding='utf-8').write(h2)
after = sorted(set(re.findall(r'\.js\?v=(v\d+)', h2)))
print()
print('脚本版本：%s → %s' % (','.join(before), ','.join(after)))

# ---------- 3) 语法 ----------
print()
for f in ['css/style.css']:
    print('  %-18s （CSS 无需 node --check）' % f)
for f in ['js/app.js', 'js/progress.js', 'js/speech-module.js', 'js/workflow-module.js',
          'js/sql-runner.js', 'data/workflow.js', 'data/speech.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        print('  ❌ %s FAIL %s' % (f, (r.stderr or '')[:160]))
print('  其余 JS 语法全部 OK')
