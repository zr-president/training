# -*- coding: utf-8 -*-
"""给 Python 任务标记 scipy 依赖"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\python.js'
c = open(FP, 'r', encoding='utf-8').read()

pairs = [
    ("id:'py03', tag:'scipy · 统计检验', level:'进阶',",
     "id:'py03', tag:'scipy · 统计检验', level:'进阶', needs:'scipy',"),
    ("id:'py05', tag:'scipy · 相关性', level:'进阶',",
     "id:'py05', tag:'scipy · 相关性', level:'进阶', needs:'scipy',"),
]
n = 0
for a, b in pairs:
    if a in c:
        c = c.replace(a, b, 1); n += 1
    else:
        print('MISS:', a[:50])
open(FP, 'w', encoding='utf-8').write(c)
print(f'OK 标记 {n} 处')
