# -*- coding: utf-8 -*-
"""修正新增题目中未转义的单引号"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\questions.js'
c = open(FP, 'r', encoding='utf-8').read()

old = "hint:'SQLite 用 strftime('%Y-%m', register_date) 取年月。',"
new = "hint:'SQLite 用 strftime 的 %Y-%m 格式取年月。',"
if old in c:
    c = c.replace(old, new, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK 已修正 hint 引号')
else:
    print('MISS')
    # 定位所有 hint 行，帮助排查
    for m in re.finditer(r"hint:'[^\n]*", c):
        print(repr(m.group(0)[:120]))
