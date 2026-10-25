# -*- coding: utf-8 -*-
"""合并第三批（w25-w36）到 workflow.js，并扩展 workflow-module.js 的 track 顺序"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MAIN = os.path.join(T, 'data', 'workflow.js')
B3 = os.path.join(T, 'data', '_workflow_batch3.js')
MOD = os.path.join(T, 'js', 'workflow-module.js')

main = open(MAIN, encoding='utf-8').read()
b3 = open(B3, encoding='utf-8').read()

i = b3.find('[')
j = b3.rfind('];')
if i < 0 or j < 0:
    print('❌ 无法解析 batch3'); raise SystemExit(1)
body = b3[i + 1:j].strip()

k = main.rfind('];')
if k < 0:
    print('❌ 主文件结构异常'); raise SystemExit(1)

head = main[:k].rstrip()
if not head.endswith(','):
    head += ','
new = head + '\n\n/* ============ 第三批：理解与表达 / 生活判断与决策 ============ */\n' + body + '\n\n' + main[k:]

open(MAIN, 'w', encoding='utf-8').write(new)
os.remove(B3)
print('✅ 已合并：workflow.js %d → %d 字节' % (len(main), len(new)))
print('   已删除临时文件')

# 扩展 track 顺序
m = open(MOD, encoding='utf-8').read()
OLD = "var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本'];"
NEW = "var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本', '表达', '生活'];"
if OLD in m:
    m = m.replace(OLD, NEW, 1)
    open(MOD, 'w', encoding='utf-8').write(m)
    print('✅ TRACK_ORDER 已扩展（补 表达 / 生活）')
elif "'表达', '生活'" in m:
    print('ℹ️  TRACK_ORDER 已含新 track')
else:
    print('⚠️  TRACK_ORDER 未匹配')

# 语法
for f in ['data/workflow.js', 'js/workflow-module.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
