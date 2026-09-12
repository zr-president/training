# -*- coding: utf-8 -*-
"""把 add_pycases2.py 中定义的新案例（NEW）插入到 gen_pycases.py 的 CASES 列表末尾"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场\tools'
SRC = BASE + r'\add_pycases2.py'
DST = BASE + r'\gen_pycases.py'

src = open(SRC, 'r', encoding='utf-8').read()
m = re.search(r'NEW = r"""(.*?)"""', src, re.S)
if not m:
    print('MISS NEW 定义'); sys.exit(1)
NEW = m.group(1)
print('提取到新案例内容长度:', len(NEW))

dst = open(DST, 'r', encoding='utf-8').read()
if "('c17'" in dst:
    print('已存在 c17，无需插入'); sys.exit(0)

# 定位 CASES 列表结尾：在 “# 逐个真实运行” 之前最后一个单独的 ]
i = dst.find('# 逐个真实运行')
if i < 0:
    print('MISS 锚点'); sys.exit(1)
j = dst.rfind('\n]', 0, i)
if j < 0:
    print('MISS CASES 结尾'); sys.exit(1)

dst = dst[:j] + '\n' + NEW + dst[j + 2:]
open(DST, 'w', encoding='utf-8').write(dst)
print('OK 已插入 c17-c22')
