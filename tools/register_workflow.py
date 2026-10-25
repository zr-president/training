# -*- coding: utf-8 -*-
"""注册「AI 工作流实验室」模块
   改动：css/style.css（加 m11 配色）· js/app.js（模块列表/路由/配色/onShow）· index.html（脚本标签）
"""
import io, sys, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ============ 1) CSS：加 --m11 与 .m11 ============
cp = os.path.join(T, 'css', 'style.css')
c = open(cp, encoding='utf-8').read()

if '--m11' not in c:
    # 浅色：接在 --m10 之后
    m10l = '  --m10:#4f46e5;--m10b:#7c3aed;--m10l:#eef2ff;\n'
    if m10l in c:
        c = c.replace(m10l, m10l + '  --m11:#0284c7;--m11b:#38bdf8;--m11l:#f0f9ff;\n', 1)
        print('✅ 浅色 --m11 已加')
    else:
        print('⚠️ 浅色 --m10 锚点未找到')
    # 深色：第二个 --m10 定义之后
    idx = c.find('--m10:', c.find('--m10:') + 5)
    if idx > 0:
        eol = c.find('\n', idx)
        line = c[idx:eol]
        c = c[:eol] + '\n  --m11:#38bdf8;--m11b:#7dd3fc;--m11l:#0c2438;' + c[eol:]
        print('✅ 深色 --m11 已加')
    # .m11 类
    m10cls = '.m10{--mc:var(--m10);--mcb:var(--m10b);--mcl:var(--m10l)}'
    if m10cls in c:
        c = c.replace(m10cls, m10cls + '\n.m11{--mc:var(--m11);--mcb:var(--m11b);--mcl:var(--m11l)}', 1)
        print('✅ .m11 类已加')
else:
    print('ℹ️  m11 已存在')

# 顺带补 V01 遗漏的小数字号（9.5 / 10.5 / 11.5 / 12.5 未被上轮正则覆盖）
for a, b in [('9.5px', '11px'), ('10.5px', '12px'), ('11.5px', '12px'), ('12.5px', '13px')]:
    n = len(re.findall(r'(font-size:\s*)' + re.escape(a), c))
    if n:
        c = re.sub(r'(font-size:\s*)' + re.escape(a), lambda m: m.group(1) + b, c)
        print('  ✅ 补 V01：%s → %s（%d 处）' % (a, b, n))

open(cp, 'w', encoding='utf-8').write(c)

# ============ 2) app.js ============
ap = os.path.join(T, 'js', 'app.js')
a = open(ap, encoding='utf-8').read()

# 2.1 MODULES 加一项
old_m = "  { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true }\n];"
new_m = ("  { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true },\n"
         "  { m: 11, icon: '🔄', t: 'AI 工作流实验室', d: '12 道设计题：给真实场景+约束，自己设计工作流（拆解/工具/人工点/验收）→ 对照参考答案与评分维度 · 前 4 题来自真实项目', r: '#/workflow', ready: true, hot: true }\n];")
if "m: 11" not in a and old_m in a:
    a = a.replace(old_m, new_m, 1); print('✅ MODULES 已加 m11')
else:
    print('⚠️ MODULES 未加（可能已存在或锚点不符）')

# 2.2 ROUTES
old_r = "  '#/case': function (host) { CaseModule.mount(host); },"
new_r = old_r + "\n  '#/workflow': function (host) { WorkflowModule.mount(host); },"
if "'#/workflow'" not in a and old_r in a:
    a = a.replace(old_r, new_r, 1); print('✅ ROUTES 已加 #/workflow')
else:
    print('⚠️ ROUTES 未加')

# 2.3 MOD_CLASS
old_c = "  '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10'\n};"
new_c = "  '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10', '#/workflow': 'm11'\n};"
if "'m11'" not in a and old_c in a:
    a = a.replace(old_c, new_c, 1); print('✅ MOD_CLASS 已加 m11')
else:
    print('⚠️ MOD_CLASS 未加')

# 2.4 onShow
old_s = "  if (hash === '#/agent') { try { AgentModule.onShow(); } catch (e) {} }"
new_s = old_s + "\n  if (hash === '#/workflow') { try { WorkflowModule.onShow(); } catch (e) {} }"
if "WorkflowModule.onShow" not in a and old_s in a:
    a = a.replace(old_s, new_s, 1); print('✅ onShow 已加 workflow')
else:
    print('⚠️ onShow 未加')

open(ap, 'w', encoding='utf-8').write(a)

# ============ 3) index.html 脚本标签 ============
hp = os.path.join(T, 'index.html')
h = open(hp, encoding='utf-8').read()

if 'data/workflow.js' not in h:
    # 数据文件：接在 aipm_interview.js 之后
    old_d = '<script src="data/aipm_interview.js?v=v5"></script>'
    if old_d in h:
        h = h.replace(old_d, old_d + '\n  <script src="data/workflow.js?v=v6"></script>', 1)
        print('✅ index.html 已加 data/workflow.js')
    else:
        print('⚠️ 数据脚本锚点未找到')
    # 模块脚本：接在 aipm-module.js 之后（必须在 app.js 之前）
    old_j = '<script src="js/aipm-module.js?v=v5"></script>'
    if old_j in h:
        h = h.replace(old_j, old_j + '\n  <script src="js/workflow-module.js?v=v6"></script>', 1)
        print('✅ index.html 已加 workflow-module.js')
    else:
        print('⚠️ 模块脚本锚点未找到')
else:
    print('ℹ️  index.html 已引用')

# 导航加一项
if '#/workflow' not in h:
    navold = '<a href="#/aipm"'
    i = h.find(navold)
    if i > 0:
        j = h.find('</a>', i) + 4
        seg = h[i:j]
        h = h[:j] + '\n' + seg.replace('href="#/aipm"', 'href="#/workflow"').replace('AI 产品经理', 'AI 工作流') + h[j:]
        print('✅ 导航已加 AI 工作流入口')
    else:
        print('⚠️ 导航锚点未找到')

open(hp, 'w', encoding='utf-8').write(h)

# ============ 校验 ============
print()
for f, keys in [('js/app.js', ['m: 11', "'#/workflow'", "'m11'", 'WorkflowModule']),
                ('index.html', ['data/workflow.js', 'workflow-module.js', '#/workflow']),
                ('css/style.css', ['--m11', '.m11'])]:
    p = os.path.join(T, f)
    t = open(p, encoding='utf-8').read()
    print('  %-16s %s' % (f, ' · '.join('%s=%s' % (k, k in t) for k in keys)))
