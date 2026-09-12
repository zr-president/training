# -*- coding: utf-8 -*-
"""修正两行 hint 中未转义的单引号（用原始字符串避免二次转义）"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\questions.js'
c = open(FP, 'r', encoding='utf-8').read()

fixes = [
    # q24
    (r"""  hint:'条件：o.order_date <= date(u.register_date, '+7 day')；用 COUNT(DISTINCT CASE WHEN ... THEN ... END)。',""",
     r"""  hint:'条件：o.order_date <= date(u.register_date, \'+7 day\')；用 COUNT(DISTINCT CASE WHEN ... THEN ... END)。',"""),
    # q30
    (r"""  hint:'分母要限定 register_date < '2026-09-04'（因为数据到 9/10，只有 9/4 之前注册的才能观察到第 7 天）；用 CASE WHEN + date(...,'+7 day') 判断。',""",
     r"""  hint:'分母要限定 register_date 小于 2026-09-04（因为数据到 9/10，只有 9/4 之前注册的才能观察到第 7 天）；用 CASE WHEN + date(..., \'+7 day\') 判断。',"""),
]

n = 0
for old, new in fixes:
    if old in c:
        c = c.replace(old, new, 1)
        n += 1
    else:
        print('MISS:', old[:80])
open(FP, 'w', encoding='utf-8').write(c)
print(f'OK 修正 {n} 处')
