# -*- coding: utf-8 -*-
"""修 workflow.js 里 w22 那条 deliverable 字符串缺结尾引号（残留 */）"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
P = r'C:\Users\ZR\Desktop\钟锐的训练场\data\workflow.js'
lines = open(P, encoding='utf-8').read().split('\n')
fixed = 0
for i, ln in enumerate(lines):
    # 形如：  deliverable: '...xxx */   ← 以 */ 结尾且没有闭合引号
    if re.match(r"^\s*deliverable:\s*'.*\*/\s*$", ln):
        new = re.sub(r"\*/\s*$", "'", ln)
        print('  修复第 %d 行：' % (i + 1))
        print('    原: ' + ln.strip())
        print('    新: ' + new.strip())
        lines[i] = new
        fixed += 1
# 顺带修孤立成行的逗号（该属性后面跟一个只有逗号的行）
out = []
for ln in lines:
    if re.match(r'^\s*,\s*$', ln) and out and out[-1].rstrip().endswith("'"):
        # 把逗号并入上一行
        out[-1] = out[-1].rstrip() + ','
        continue
    out.append(ln)
open(P, 'w', encoding='utf-8').write('\n'.join(out))
print('修复 %d 处' % fixed)
