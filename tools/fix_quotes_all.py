# -*- coding: utf-8 -*-
"""通用修正：把单引号字符串字段中未转义的内层单引号加转义
   适用 key: title/ctx/task/hint/why/takeaway/topic/question/context/deliverable/
            conclusion/steps 之外的标量字段等（跳过 backtick 模板与数组）
"""
import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场\data'

KEYS = ['title','ctx','task','hint','why','takeaway','topic','question','context',
        'deliverable','conclusion','tag','desc','definition','example','why_matters','n','jd','how','good','bad','q','intent','cat','name','env']

# 形如  key:'内容',   或  key:'内容'
PAT = re.compile(r"^(\s*(?:" + "|".join(KEYS) + r"):')(.*)('(?:,)?)$")

def fix_line(line):
    m = PAT.match(line)
    if not m:
        return line, 0
    head, body, tail = m.group(1), m.group(2), m.group(3)
    # 把未转义的 ' 变成 \'
    fixed = re.sub(r"(?<!\\)'", r"\\'", body)
    if fixed != body:
        return head + fixed + tail, 1
    return line, 0

total = 0
for fn in ['questions.js', 'lab.js', 'metrics.js', 'abtest.js', 'cases.js', 'agent.js', 'python.js', 'radar.js', 'aipm.js', 'aipm_interview.js', 'pycase.js']:
    p = os.path.join(BASE, fn)
    if not os.path.exists(p):
        continue
    lines = open(p, 'r', encoding='utf-8').read().split('\n')
    cnt = 0
    out = []
    for ln in lines:
        nln, c = fix_line(ln)
        out.append(nln)
        cnt += c
    if cnt:
        open(p, 'w', encoding='utf-8').write('\n'.join(out))
    print(f'{fn}: 修正 {cnt} 行')
    total += cnt
print(f'合计修正 {total} 行')
