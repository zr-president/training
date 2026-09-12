# -*- coding: utf-8 -*-
"""给 index.html 中所有本地 css/js 引用加缓存破坏参数（避免浏览器缓存旧代码）"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\index.html'
c = open(FP, 'r', encoding='utf-8').read()

V = 'v5'
# 1) 去掉已有的 ?v=N，再加新的
c = re.sub(r'(src="(?:js|data)/[^"]+?)\?v=\d+(")', r'\1\2', c)
c = re.sub(r'(href="css/[^"]+?)\?v=\d+(")', r'\1\2', c)

# 2) 加版本
c = re.sub(r'src="((?:js|data)/[^"]+\.js)"', lambda m: 'src="' + m.group(1) + '?v=' + V + '"', c)
c = re.sub(r'href="(css/[^"]+\.css)"', lambda m: 'href="' + m.group(1) + '?v=' + V + '"', c)

open(FP, 'w', encoding='utf-8').write(c)

print('已加版本参数 v' + V + '：')
for m in re.finditer(r'(?:src|href)="((?:js|data|css)/[^"]+)"', c):
    print('  ' + m.group(1))
