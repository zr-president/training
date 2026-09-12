# -*- coding: utf-8 -*-
"""提取 data/lab.js 里所有参考 SQL，用真实 SQLite 逐条执行校验"""
import io, sys, re, sqlite3
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# 载入数据集 SQL
src_ds = open(BASE + r'\data\dataset.js', 'r', encoding='utf-8').read()
m = re.search(r'var DATASET_SQL = `\n([\s\S]*)\n`;', src_ds)
dataset_sql = m.group(1)

# 提取 lab 里的 sql:`...`
src_lab = open(BASE + r'\data\lab.js', 'r', encoding='utf-8').read()
blocks = re.findall(r"sql:`([\s\S]*?)`", src_lab)
print('提取到参考 SQL 条数:', len(blocks))

# 提取题号，便于报错定位
ids = re.findall(r"id:'(lab\d+)'", src_lab)
print('题目数:', len(ids), ids)

con = sqlite3.connect(':memory:')
con.executescript(dataset_sql)

fails = 0
qidx = 0
for i in range(len(ids)):
    # 该题包含的 query 数
    seg_start = src_lab.find("id:'" + ids[i] + "'")
    seg_end = src_lab.find("id:'" + ids[i + 1] + "'") if i + 1 < len(ids) else len(src_lab)
    seg = src_lab[seg_start:seg_end]
    qs = re.findall(r"sql:`([\s\S]*?)`", seg)
    for j, q in enumerate(qs):
        qidx += 1
        tag = f'{ids[i]}-{j+1}'
        try:
            rows = con.execute(q).fetchall()
            flag = 'OK ' if len(rows) > 0 else '空 '
            if len(rows) == 0:
                fails += 1
                flag = '❌空结果 '
            print(f'{flag}{tag}  rows={len(rows)}')
        except Exception as e:
            fails += 1
            print(f'❌FAIL {tag}: {e}')
            print('   SQL 片段:', q.strip().replace('\n', ' ')[:150])

print()
print(f'共 {qidx} 条参考 SQL，失败 {fails} 条')
