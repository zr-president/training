# -*- coding: utf-8 -*-
"""生成暗色模式测试页（在主题初始化脚本之前写入 localStorage.theme=dark）"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'
h = open(BASE + r'\index.html', 'r', encoding='utf-8').read()
i = h.find('<head>')
if i < 0:
    print('MISS head'); sys.exit(1)
seed = '<script>try{localStorage.setItem("theme","dark");localStorage.setItem("themeColor","indigo");}catch(e){}</script>'
out = h[:i + 6] + '\n' + seed + h[i + 6:]
open(BASE + r'\_dark.html', 'w', encoding='utf-8').write(out)
print('OK 已生成 _dark.html')
