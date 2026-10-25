# -*- coding: utf-8 -*-
"""UI V01 设计规范：训练场
   与个人站共用同一套 token 契约（同一份变量名与取值）
"""
import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'
FP = os.path.join(BASE, 'css', 'style.css')
c = open(FP, encoding='utf-8').read()
orig = len(c)

TOKENS = '''  /* ===== V01 设计规范 token（与个人站共用契约）===== */
  /* 间距：4/8 基础网格 */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px; --sp-8:48px;
  /* 圆角：8-12px 三档（--radius / --radius-sm 保留向后兼容） */
  --r-sm:8px; --r-md:10px; --r-lg:12px; --r-pill:999px;
  /* 字号阶梯：辅助 12-14 / 正文 15-16 / 标题阶梯 */
  --fs-aux:12px; --fs-sm:13px; --fs-body:15px; --fs-lg:16px;
  --fs-h3:18px; --fs-h2:22px; --fs-h1:30px; --fs-display:34px;
  /* 行高 */
  --lh-tight:1.35; --lh-body:1.7;
  /* 语义色：青绿只表示完成/可用 */
  --c-accent:var(--accent); --c-done:var(--green); --c-warn:var(--orange); --c-danger:var(--red);
'''

if '--sp-1:4px' in c:
    print('ℹ️  token 已存在')
else:
    # 插到第一个 :root 块末尾（--sans 那行之后）
    m = re.search(r'(:root\s*\{[\s\S]*?--sans:[^;\n]+;)(\s*\n\s*\})', c)
    if m:
        c = c[:m.end(1)] + '\n' + TOKENS + c[m.end(1):]
        print('✅ 已注入 token（浅色 :root）')
    else:
        print('❌ 未找到 :root')
    # 深色主题补语义色（若深色块没有 border2 引用问题）
    dm = re.search(r'(\[data-theme="dark"\]\s*\{[\s\S]*?--sans:[^;\n]+;)', c)
    if dm:
        c = c[:dm.end(1)] + '\n  --c-accent:var(--accent); --c-done:var(--green); --c-warn:var(--orange); --c-danger:var(--red);' + c[dm.end(1):]
        print('✅ 深色主题补语义色')

# body 字号 14 → 15（V01: 正文 15-16px）
old = 'font-size:14px;line-height:1.65;'
new = 'font-size:var(--fs-body);line-height:var(--lh-body);'
if old in c:
    c = c.replace(old, new, 1)
    print('✅ body 字号 14px → 15px（用 token）')
elif 'var(--fs-body)' in c:
    print('ℹ️  body 已用 token')
else:
    print('⚠️  body 字号规则未匹配')

# --radius 归到 token 体系（保留旧名做别名，避免破坏已有引用）
c = re.sub(r'--radius:12px;--radius-sm:9px;',
           '--radius:var(--r-lg);--radius-sm:var(--r-sm);', c)
print('✅ --radius / --radius-sm 改为引用 token')

# 9-11px 微字号上调到 12px 下限
BUMP = [('9px', '11px'), ('10px', '12px'), ('11px', '12px')]
cnt = {}
for a, b in BUMP:
    n = len(re.findall(r'(font-size:\s*)' + re.escape(a) + r'\b', c))
    c = re.sub(r'(font-size:\s*)' + re.escape(a) + r'\b', lambda m: m.group(1) + b, c)
    cnt[a] = n
print('✅ 微字号上调：' + ' · '.join('%s→%s %d' % (a, dict(BUMP)[a], v) for a, v in cnt.items()))

open(FP, 'w', encoding='utf-8').write(c)
print()
print('style.css: %d → %d 字节' % (orig, len(c)))
from collections import Counter
sz = Counter(int(m.group(1)) for m in re.finditer(r'font-size:\s*(\d+)px', c))
print('字号分布：' + ' · '.join('%dpx×%d' % (k, sz[k]) for k in sorted(sz)))
