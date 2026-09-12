# -*- coding: utf-8 -*-
"""Python 任务：新增 py00（纯 Python 无依赖，快速上手 + 验证通路），并标注各题依赖"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\python.js'
c = open(FP, 'r', encoding='utf-8').read()

# 1) 追加 py00（插到数组开头）
marker = 'var PY_TASKS = [\n'
if marker not in c:
    print('MISS marker'); sys.exit(1)

py00 = r'''
{
  id:'py00', tag:'纯 Python · 留存', level:'入门',
  title:'先不用 pandas：手算一遍次日留存率',
  ctx:'留存分析的核心逻辑其实很简单：对每个用户，判断他"注册次日"有没有回来。先用纯 Python 把逻辑走通，再学 pandas 会轻松很多。\n下面 records 里每个元素是 (user_id, 注册日期, 该用户登录过的日期列表)。',
  task:'计算这 8 个用户的次日留存率（注册次日出现在登录列表里的用户数 ÷ 总用户数），以百分数表示并保留 2 位小数，赋值给变量 answer。',
  starter:`from datetime import date, timedelta

records = [
    (1, '2026-08-01', ['2026-08-01', '2026-08-02', '2026-08-05']),
    (2, '2026-08-01', ['2026-08-01']),
    (3, '2026-08-02', ['2026-08-02', '2026-08-03']),
    (4, '2026-08-02', ['2026-08-02']),
    (5, '2026-08-03', ['2026-08-03', '2026-08-04']),
    (6, '2026-08-03', ['2026-08-03']),
    (7, '2026-08-04', ['2026-08-04']),
    (8, '2026-08-04', ['2026-08-04', '2026-08-05']),
]

# 提示：
# 1) 对每个用户，用 date.fromisoformat(注册日期) + timedelta(days=1) 算出"次日"
# 2) 判断这个次日是否在登录列表里
# 3) 留存率 = 命中人数 / 总人数 * 100

# 你的代码写在这里


answer = 0   # ← 把最终结果赋值给 answer
`,
  sol:`from datetime import date, timedelta

records = [
    (1, '2026-08-01', ['2026-08-01', '2026-08-02', '2026-08-05']),
    (2, '2026-08-01', ['2026-08-01']),
    (3, '2026-08-02', ['2026-08-02', '2026-08-03']),
    (4, '2026-08-02', ['2026-08-02']),
    (5, '2026-08-03', ['2026-08-03', '2026-08-04']),
    (6, '2026-08-03', ['2026-08-03']),
    (7, '2026-08-04', ['2026-08-04']),
    (8, '2026-08-04', ['2026-08-04', '2026-08-05']),
]

hit = 0
for uid, reg, logins in records:
    d1 = (date.fromisoformat(reg) + timedelta(days=1)).isoformat()
    if d1 in logins:
        hit += 1
answer = round(hit * 100 / len(records), 2)
`,
  check:'answer',
  hint:'日期在 Python 里用 datetime.date 对象做加减；转成字符串用 .isoformat() 方便和列表里的字符串比较。',
  why:'提前算一下：命中次日的是 1、3、5、8 四个人，所以答案是 50.0。**把逻辑先想清楚，再用 pandas 只是把这套逻辑批量、向量化地表达出来**——很多人学 pandas 卡住，是因为根本没想清楚要算什么。'
},
'''

c = c.replace(marker, marker + py00, 1)

# 2) 标注依赖
deps = [
    ("id:'py01', tag:'pandas · 留存', level:'基础',", "id:'py01', tag:'pandas · 留存', level:'基础', needs:'pandas',"),
    ("id:'py02', tag:'pandas · 趋势', level:'基础',", "id:'py02', tag:'pandas · 趋势', level:'基础', needs:'pandas',"),
    ("id:'py04', tag:'pandas · 单位经济', level:'进阶',", "id:'py04', tag:'pandas · 单位经济', level:'进阶', needs:'pandas',"),
    ("id:'py05', tag:'scipy · 相关性', level:'进阶', needs:'scipy',", "id:'py05', tag:'scipy · 相关性', level:'进阶', needs:['pandas','scipy'],"),
]
n = 0
for a, b in deps:
    if a in c:
        c = c.replace(a, b, 1); n += 1
    else:
        print('MISS:', a[:60])
open(FP, 'w', encoding='utf-8').write(c)
print(f'OK 新增 py00，标注依赖 {n} 处')
