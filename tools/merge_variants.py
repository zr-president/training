# -*- coding: utf-8 -*-
"""通用变式合并器：先单独校验数组语法，再合并（防止 rubric 收尾写成 }, 这类错误）
   用法：python tools/merge_variants.py data/_workflow_variants2.js
"""
import io, sys, os, re, subprocess, tempfile
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MAIN = os.path.join(T, 'data', 'workflow.js')
SRC = os.path.join(T, sys.argv[1] if len(sys.argv) > 1 else 'data/_workflow_variants2.js')

src = open(SRC, encoding='utf-8').read()
i = src.find('['); j = src.rfind('];')
if i < 0 or j < 0:
    print('❌ 无法解析源文件'); raise SystemExit(1)
body = src[i + 1:j].strip()

# ---------- 步骤 1：单独校验数组内容语法 ----------
probe = 'var __V = [' + body + '];\nconsole.log(__V.length);'
tmp = os.path.join(T, 'tools', '_probe.js')
open(tmp, 'w', encoding='utf-8').write(probe)
r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True,
                   encoding='utf-8', errors='replace')
if r.returncode != 0:
    print('❌ 变式数组本身有语法错误，已中止合并：')
    print((r.stderr or '')[:800])
    os.remove(tmp)
    raise SystemExit(1)
print('✅ 变式数组语法通过')

# ---------- 步骤 2：结构检查（rubric 是否被 } 收尾） ----------
lines = body.split('\n')
bad = []
for k in range(len(lines) - 1):
    if lines[k].rstrip() == '  },' and lines[k + 1].strip().startswith('reference:'):
        bad.append(k + 1)
if bad:
    print('❌ 发现 rubric 用 }, 收尾的行：%s，已中止' % bad)
    os.remove(tmp)
    raise SystemExit(1)
print('✅ rubric 收尾结构正确')

# ---------- 步骤 3：数一数条目 ----------
r2 = subprocess.run(['node', '-e',
                     'const V=require("fs").readFileSync(%s,"utf8");'
                     'eval(V);'
                     'console.log("items="+__V.length);'
                     'console.log("ids="+__V.map(x=>x.id).join(","));'
                     'const noReq=__V.filter(x=>!x.id||!x.family||x.kind!=="variant");'
                     'console.log("缺 id/family/kind 的条目="+noReq.length);'
                     % repr(tmp).replace("'", '"')],
                    capture_output=True, text=True, encoding='utf-8', errors='replace')
# 上面的 eval 方式不稳，改用直接执行
r2 = subprocess.run(['node', tmp], capture_output=True, text=True,
                    encoding='utf-8', errors='replace')
print('  数组长度：' + (r2.stdout or '').strip())

# ---------- 步骤 4：合并 ----------
main = open(MAIN, encoding='utf-8').read()
if any(('id: \'%s\'' % x) in main for x in re.findall(r"id: '(\w+)'", body)):
    print('⚠️  主文件中已存在同 id 条目，请检查；仍继续合并')

k = main.rfind('];')
head = main[:k].rstrip()
if not head.endswith(','):
    head += ','
banner = '\n\n/* ============ 变式题库（%s）============ */\n' % os.path.basename(SRC).replace('_', '').replace('.js', '')
new = head + banner + body + '\n\n' + main[k:]
open(MAIN, 'w', encoding='utf-8').write(new)
os.remove(SRC)
os.remove(tmp)
print('✅ 已合并：workflow.js %d → %d 字节' % (len(main), len(new)))
print('   已删除 %s' % os.path.basename(SRC))

r3 = subprocess.run(['node', '--check', MAIN], capture_output=True, text=True,
                    encoding='utf-8', errors='replace')
print('  合并后语法：', 'OK' if r3.returncode == 0 else 'FAIL ' + (r3.stderr or '')[:300])
