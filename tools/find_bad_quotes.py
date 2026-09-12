# -*- coding: utf-8 -*-
"""找出 data/questions.js 中单引号数量为奇数的 hint 行（未转义导致语法错误）"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\questions.js'
lines = open(FP, 'r', encoding='utf-8').read().split('\n')
for idx, ln in enumerate(lines, 1):
    s = ln.strip()
    if s.startswith('hint:') or s.startswith('why:') or s.startswith('ctx:') or s.startswith('task:') or s.startswith('title:'):
        # 统计单引号数量（排除转义的 \'）
        cleaned = re.sub(r"\\'", '', s)
        n = cleaned.count("'")
        if n % 2 == 1:
            print(f'L{idx} (单引号 {n} 个): {s[:150]}')
