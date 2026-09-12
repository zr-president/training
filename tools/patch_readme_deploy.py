# -*- coding: utf-8 -*-
"""README 补充：部署说明（gh-pages 分支）+ 线上地址"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\README.md'
c = open(FP, 'r', encoding='utf-8').read()

old = '线上地址（部署后）：https://zr-president.github.io/training/'
new = """线上地址：**https://zr-president.github.io/training/**（已上线）

> **部署方式**：GitHub Pages 从 `gh-pages` 分支发布。因此改完代码后除了提交到 `main`，
> 还要同步一次 gh-pages —— 直接运行 `python tools/deploy.py` 即可（它会检查工作区是否干净并自动同步）。
>
> 想改成从 `main` 直接发布也可以：仓库 Settings → Pages → Source 选 `main` / `/ (root)`，
> 之后就不需要这个脚本了。"""
if old in c:
    c = c.replace(old, new, 1)
    print('OK 已更新部署说明')
else:
    print('MISS 线上地址锚点')

open(FP, 'w', encoding='utf-8').write(c)
print('done')
