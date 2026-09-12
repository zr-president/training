# -*- coding: utf-8 -*-
"""用真实 SQLite 校验生成的 dataset SQL，定位语法错误"""
import io, sys, re, sqlite3
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
p = r'C:\Users\ZR\Desktop\钟锐的训练场\data\dataset.js'
src = open(p, 'r', encoding='utf-8').read()
m = re.search(r'var DATASET_SQL = `\n([\s\S]*)\n`;', src)
if not m:
    print('未提取到 DATASET_SQL'); sys.exit()
sql = m.group(1)
print('SQL 长度:', len(sql))
lines = sql.split('\n')
print('总行数:', len(lines))
con = sqlite3.connect(':memory:')
try:
    con.executescript(sql)
    print('✅ 全部执行成功')
    for t in ['users', 'events', 'orders', 'channels']:
        print('  ', t, con.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0])
except Exception as e:
    print('❌ 错误:', e)
    # 逐行定位：找第一个出错的语句
    stmts = [s.strip() for s in sql.split(';') if s.strip()]
    print('语句数:', len(stmts))
    for i, s in enumerate(stmts):
        try:
            con.execute(s)
        except Exception as e2:
            head = s[:120].replace('\n', ' ')
            print(f'  第 {i+1} 条语句失败: {e2}')
            print('  语句开头:', head)
            # 打印更精确位置
            if 'syntax error' in str(e2):
                # 尝试二分：逐字符定位
                print('  语句长度:', len(s))
                print('  语句结尾:', s[-160:].replace('\n', ' '))
            break
