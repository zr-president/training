# -*- coding: utf-8 -*-
"""修 bug 3：「已掌握」措辞不准确 → 「自评通过」

问题：workflow 的复查队列按「自评分 ≥80%」标为「已掌握」，
并据此在技能方向里计入「已掌握 / 总题数」。
但自评是你自己给自己打分，**不等于独立掌握**。
独立掌握要靠「没见过的变式题 + 延迟复测」，目前并未记录。

改法：
· 状态文案 已掌握 → 自评通过
· 技能方向标题 → 「自评通过 / 总题数」，并加一行说明
· 复查面板的统计文案同步
· 逻辑不变（pri===2 仍表示「不需要再催复查」），只改表达，不改变行为
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = os.path.dirname(os.path.abspath(__file__))
T = os.path.dirname(T)   # 仓库根

ok = []

# ---------- workflow-module.js ----------
WP = os.path.join(T, 'js', 'workflow-module.js')
w = open(WP, encoding='utf-8').read()

if "status = '自评通过'" in w:
    print('ℹ️  workflow 状态已改')
else:
    old = "status = '已掌握'; pri = 2;"
    new = "status = '自评通过'; pri = 2;   /* 注意：自评通过 ≠ 独立掌握 */"
    if old in w:
        w = w.replace(old, new, 1); ok.append('workflow 状态文案')

# 复查面板统计文案
old2 = "· 已掌握 "
if old2 in w:
    w = w.replace(old2, "· 自评通过 ", 1); ok.append('workflow 面板统计')

# 变量名 mastered 保留（内部变量，不影响显示），但注释更新
w = w.replace("var mastered = list.filter(function (x) { return x.pri === 2; }).length;",
              "var selfPassed = list.filter(function (x) { return x.pri === 2; }).length;")
w = w.replace("'</b> · 自评通过 <b style=\"color:var(--em)\">' + mastered + '</b>",
              "'</b> · 自评通过 <b style=\"color:var(--em)\">' + selfPassed + '</b>")

open(WP, 'w', encoding='utf-8').write(w)

# ---------- command.js ----------
CP = os.path.join(T, 'js', 'command.js')
c = open(CP, encoding='utf-8').read()

if '技能方向（自评通过 / 总题数）' in c:
    print('ℹ️  command 标题已改')
else:
    old3 = '🧭 技能方向（已掌握 / 总题数）'
    new3 = '🧭 技能方向（自评通过 / 总题数）'
    if old3 in c:
        c = c.replace(old3, new3, 1); ok.append('command 标题')

c = c.replace("if (x.pri === 2) stat[t].done++;   /* 已掌握 */",
              "if (x.pri === 2) stat[t].done++;   /* 自评通过（pri 2） */")

# 在技能方向卡片下方加一行说明，明确区分自评与独立掌握
old4 = "'<div id=\"cmdTracks\"></div>' +"
if old4 in c and '自评通过 = 你自己打的分够高' not in c:
    new4 = ("'<div id=\"cmdTracks\"></div>' +\n"
            "      '<div style=\"font-size:12px;color:var(--text3);line-height:1.7;margin-top:9px\">' +\n"
            "      '自评通过 = 你自己打的分够高。<b>不等于独立掌握</b>——那要靠没见过的变式题和延迟复测，目前系统还没记录这两项。' +\n"
            "      '</div>' +")
    c = c.replace(old4, new4, 1); ok.append('command 说明')

open(CP, 'w', encoding='utf-8').write(c)

print('✅ 已改：' + ('、'.join(ok) if ok else '无（可能已改过）'))

# ---------- 验证 ----------
print()
for f in ['js/workflow-module.js', 'js/command.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL ' + (r.stderr or '')[:200]))

print()
left = []
for f in ['js/workflow-module.js', 'js/command.js']:
    src = open(os.path.join(T, f), encoding='utf-8').read()
    for m in re.finditer('已掌握', src):
        line = src[:m.start()].count('\n') + 1
        left.append('%s:%d' % (f, line))
print('  仍含「已掌握」的位置：' + (', '.join(left) if left else '无 ✅'))
