# -*- coding: utf-8 -*-
"""修复：训练场 token 未注入（导致 --radius 引用未定义变量 → 圆角归零）"""
import io, sys, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\css\style.css'
c = open(FP, encoding='utf-8').read()

if '--sp-1:4px' in c:
    print('ℹ️  token 已存在，无需修复')
    raise SystemExit(0)

TOKENS = '''
  /* ===== V01 设计规范 token（与个人站共用契约）===== */
  /* 间距：4/8 基础网格 */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px; --sp-8:48px;
  /* 圆角：8-12px 三档 */
  --r-sm:8px; --r-md:10px; --r-lg:12px; --r-pill:999px;
  /* 字号阶梯：辅助 12-14 / 正文 15-16 / 标题阶梯 */
  --fs-aux:12px; --fs-sm:13px; --fs-body:15px; --fs-lg:16px;
  --fs-h3:18px; --fs-h2:22px; --fs-h1:30px; --fs-display:34px;
  /* 行高 */
  --lh-tight:1.35; --lh-body:1.7;
  /* 语义色：青绿只表示完成/可用 */
  --c-accent:var(--accent); --c-done:var(--green); --c-warn:var(--orange); --c-danger:var(--red);
'''

# 在 --sans 那一行之后插入（该行在 :root 块内，且是全文件唯一的 --sans 定义）
ANCHOR = '  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;\n'
if ANCHOR in c:
    c = c.replace(ANCHOR, ANCHOR + TOKENS, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('✅ 已注入 token（--sans 之后）')
else:
    print('❌ 未找到 --sans 锚点')

# 校验
c2 = open(FP, encoding='utf-8').read()
checks = ['--sp-1:4px', '--r-sm:8px', '--r-lg:12px', '--fs-body:15px', '--lh-body:1.7']
for k in checks:
    print('  含 %-18s %s' % (k, k in c2))
# 确认 --radius 的引用目标已定义
print()
print('  --radius 定义: %s' % ('--radius:var(--r-lg)' in c2))
print('  --r-lg 已定义: %s' % ('--r-lg:12px' in c2))
print('  --r-sm 已定义: %s' % ('--r-sm:8px' in c2))
print('  --border2 存在: %s' % ('--border2:' in c2))
print('  文件大小: %d 字节' % len(c2))
