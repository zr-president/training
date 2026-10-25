# -*- coding: utf-8 -*-
"""把「学习活动」接入账本，让「本周学习日」有真实来源

问题：账本原来只有领币事件，本周学习日会因为「领了一次币」而算成学习日 —— 那不对。
修法：新增 active 事件（scope=day，每天最多一条），在真正产生学习行为时记：

   做题自评 / 标记完成（workflow）· 语音评分（speech）

这样「本周 4 个学习日」统计的是真的练过的天数。
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
ok = []

# ---------- 1) ledger.js 加 active 类型 ----------
LP = os.path.join(T, 'js', 'ledger.js')
l = open(LP, encoding='utf-8').read()
if "'active'" in l and 'active:' in l:
    print('ℹ️  ledger 已有 active')
else:
    OLD = "    spend:    { scope: 'free', label: '兑换支出' },"
    NEW = ("    active:   { scope: 'day',  label: '学习活动' },\n"
           "    spend:    { scope: 'free', label: '兑换支出' },")
    if OLD in l:
        l = l.replace(OLD, NEW, 1)
        open(LP, 'w', encoding='utf-8').write(l)
        ok.append('ledger: active 类型')
    else:
        print('⚠️ ledger KINDS 锚点未匹配')

# ---------- 2) workflow-module.js 记 active ----------
WP = os.path.join(T, 'js', 'workflow-module.js')
w = open(WP, encoding='utf-8').read()

HELPER = """
  /* 记一次学习活动（每天最多一条，用于「本周学习日」统计） */
  function wfActive() {
    try {
      if (typeof Ledger !== 'undefined') Ledger.add('active', 'workflow', 0, {});
    } catch (e) {}
  }
"""
if 'function wfActive' in w:
    print('ℹ️  workflow 已有 wfActive')
else:
    anchor = "  function wfTouch(id) {"
    idx = w.find(anchor)
    if idx > 0:
        w = w[:idx] + HELPER + '\n' + w[idx:]
        ok.append('workflow: wfActive')
    else:
        print('⚠️ workflow wfTouch 锚点未匹配')

# 自评点击后记活动
OLD_S = """        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        wfTouch(cur.id);"""
NEW_S = """        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        wfTouch(cur.id);
        wfActive();"""
if 'wfActive();\n        renderQuestion' in w or NEW_S in w:
    print('ℹ️  自评已记活动')
elif OLD_S in w:
    w = w.replace(OLD_S, NEW_S, 1)
    ok.append('workflow: 自评记活动')
else:
    print('⚠️ 自评锚点未匹配')

# 标记完成时记活动
OLD_D = """      if (now) wfTouch(cur.id);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');"""
NEW_D = """      if (now) { wfTouch(cur.id); wfActive(); }
      toast(now ? '已标记完成 ✅' : '已取消完成标记');"""
if 'wfActive(); }' in w:
    print('ℹ️  完成标记已记活动')
elif OLD_D in w:
    w = w.replace(OLD_D, NEW_D, 1)
    ok.append('workflow: 完成记活动')
else:
    print('⚠️ 完成锚点未匹配')

open(WP, 'w', encoding='utf-8').write(w)

# ---------- 3) speech-module.js 记 active ----------
SP = os.path.join(T, 'js', 'speech-module.js')
s = open(SP, encoding='utf-8').read()
OLD_S2 = """  function showResult(hyp) {
    var box = document.getElementById('spResult');
    if (!box || !cur) return;"""
NEW_S2 = """  function showResult(hyp) {
    var box = document.getElementById('spResult');
    if (!box || !cur) return;
    try { if (typeof Ledger !== 'undefined') Ledger.add('active', 'speech', 0, {}); } catch (e) {}"""
if "Ledger.add('active', 'speech'" in s:
    print('ℹ️  speech 已记活动')
elif OLD_S2 in s:
    s = s.replace(OLD_S2, NEW_S2, 1)
    open(SP, 'w', encoding='utf-8').write(s)
    ok.append('speech: 评分记活动')
else:
    print('⚠️ speech showResult 锚点未匹配')

print('✅ 已改：' + ('、'.join(ok) if ok else '无'))
print()
for f in ['js/ledger.js', 'js/workflow-module.js', 'js/speech-module.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])

print()
r = subprocess.run(['node', os.path.join(T, 'tools', 'test_ledger.js')],
                   capture_output=True, text=True, encoding='utf-8', errors='replace')
tail = [x for x in (r.stdout or '').splitlines() if '结果' in x]
print('  账本测试：' + (tail[-1] if tail else '未捕获'))
