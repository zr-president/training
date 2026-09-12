# -*- coding: utf-8 -*-
"""提取 data/questions.js 的所有参考解 SQL，用真实 SQLite 逐条执行校验"""
import io, sys, re, sqlite3
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

src_ds = open(BASE + r'\data\dataset.js', 'r', encoding='utf-8').read()
dataset_sql = re.search(r'var DATASET_SQL = `\n([\s\S]*)\n`;', src_ds).group(1)

src_q = open(BASE + r'\data\questions.js', 'r', encoding='utf-8').read()
ids = re.findall(r"id:'(q\d+)'", src_q)
print('题目数:', len(ids))

con = sqlite3.connect(':memory:')
con.executescript(dataset_sql)

fails = []
for i, qid in enumerate(ids):
    start = src_q.find("id:'" + qid + "'")
    end = src_q.find("id:'" + ids[i + 1] + "'") if i + 1 < len(ids) else len(src_q)
    seg = src_q[start:end]
    m = re.search(r"solution:`([\s\S]*?)`", seg)
    if not m:
        fails.append((qid, '未找到 solution'))
        print(f'❌ {qid}: 未找到 solution')
        continue
    sql = m.group(1)
    try:
        rows = con.execute(sql).fetchall()
        if len(rows) == 0:
            fails.append((qid, '返回 0 行'))
            print(f'❌ {qid}: 返回 0 行')
        else:
            print(f'✅ {qid}: rows={len(rows)}')
    except Exception as e:
        fails.append((qid, str(e)))
        print(f'❌ {qid}: {e}')

print()
print(f'共 {len(ids)} 题，失败 {len(fails)} 题')
for qid, err in fails:
    print(f'   - {qid}: {err}')
