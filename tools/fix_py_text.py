# -*- coding: utf-8 -*-
"""修正 py 模块的体积提示文案"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\python.js'
c = open(FP, 'r', encoding='utf-8').read()

# 修正 loadNote
c = re.sub(r"loadNote: '[^']*'",
           "loadNote: '首次启动需加载 Python 内核（约 10MB，30 秒内可用）；pandas 与 scipy 在用到对应题目时按需加载（合计约 60MB），浏览器会缓存，只需一次。'",
           c, count=1)

# 修正 intro 里的体积描述
c = c.replace('在浏览器里跑真实 Python（Pyodide + pandas + scipy），不需要安装任何环境。',
              '在浏览器里跑真实 Python（Pyodide + pandas + scipy），不需要安装任何环境。内核加载完成后，<b>纯 Python 题可立即开练</b>；涉及 pandas / scipy 的题会在首次使用时按需加载对应库。')

open(FP, 'w', encoding='utf-8').write(c)
print('OK 文案已修正')
for m in re.finditer(r"(loadNote|intro): '([^']{0,120})", c):
    print('  ' + m.group(1) + ': ' + m.group(2) + '…')
