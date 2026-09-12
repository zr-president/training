# -*- coding: utf-8 -*-
"""把模块内联样式里写死的深色系颜色改成主题变量，适配亮/暗双主题"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# 通用替换：深色系硬编码 → 主题变量
REPL = [
    ('#22d3ee', 'var(--accent)'),      # 青色强调 → 主题色
    ('#a78bfa', 'var(--purple)'),      # 紫色 → 主题紫
    ('#98a1bd', 'var(--text2)'),
    ('#3d4763', 'var(--text3)'),
    ('#c8f5ff', 'var(--code-text)'),
    ('rgba(255,255,255,.03)', 'var(--bg2)'),
    ('rgba(255,255,255,.05)', 'var(--border)'),
    ('rgba(255,255,255,.08)', 'var(--border)'),
    ('rgba(255,255,255,.10)', 'var(--border2)'),
    ('rgba(255,255,255,.12)', 'var(--border2)'),
    ('rgba(255,255,255,.14)', 'var(--border2)'),
    ('rgba(255,255,255,.18)', 'var(--border2)'),
]

files = ['js/radar-module.js', 'js/agent-module.js', 'js/sql-module.js',
         'js/lab-module.js', 'js/quiz-module.js', 'js/case-module.js', 'js/app.js']
for rel in files:
    p = BASE + '\\' + rel.replace('/', '\\')
    c = open(p, 'r', encoding='utf-8').read()
    orig = c
    n = 0
    for a, b in REPL:
        if a in c:
            n += c.count(a)
            c = c.replace(a, b)
    if c != orig:
        open(p, 'w', encoding='utf-8').write(c)
        print(f'{rel}: 替换 {n} 处')
    else:
        print(f'{rel}: 无需替换')
