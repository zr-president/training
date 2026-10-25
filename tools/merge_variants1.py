# -*- coding: utf-8 -*-
"""合并变式题库到 workflow.js，并让模块支持「题族」展示"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MAIN = os.path.join(T, 'data', 'workflow.js')
V1 = os.path.join(T, 'data', '_workflow_variants1.js')
MOD = os.path.join(T, 'js', 'workflow-module.js')

main = open(MAIN, encoding='utf-8').read()
v1 = open(V1, encoding='utf-8').read()

i = v1.find('['); j = v1.rfind('];')
if i < 0 or j < 0:
    print('❌ 无法解析变式文件'); raise SystemExit(1)
body = v1[i + 1:j].strip()

k = main.rfind('];')
head = main[:k].rstrip()
if not head.endswith(','):
    head += ','
new = head + '\n\n/* ============ 变式题库（第一批：w01-w06 各 2 道变式）============ */\n' + body + '\n\n' + main[k:]
open(MAIN, 'w', encoding='utf-8').write(new)
os.remove(V1)
print('✅ 变式已合并：workflow.js %d → %d 字节' % (len(main), len(new)))

# ==================== 模块：题族展示 ====================
m = open(MOD, encoding='utf-8').read()

# 1) 列表项：变式加缩进标记
OLD_LIST = """        var done = TP.isOpenDone(NS, q.id);
        h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-wid="' + q.id + '">' +
             '<span class="n">' + String(idx).padStart(2, '0') + '</span>' +
             '<span class="t" title="' + esc(q.title) + '">' + esc(q.title) + '</span>' +
             '<span class="d' + (done ? ' ok' : '') + '"></span></div>';"""
NEW_LIST = """        var done = TP.isOpenDone(NS, q.id);
        var isV = q.kind === 'variant';
        var label = isV ? ('↳ ' + String(q.title).replace(/^变式｜/, '')) : q.title;
        h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-wid="' + q.id + '"' +
             (isV ? ' style="padding-left:22px;opacity:.92"' : '') + '>' +
             '<span class="n">' + (isV ? '·' : String(idx).padStart(2, '0')) + '</span>' +
             '<span class="t" title="' + esc(q.title) + '">' + esc(label) + '</span>' +
             '<span class="d' + (done ? ' ok' : '') + '"></span></div>';"""
if 'isV = q.kind' in m:
    print('ℹ️  列表已支持变式')
elif OLD_LIST in m:
    m = m.replace(OLD_LIST, NEW_LIST, 1)
    print('✅ 列表已支持变式缩进')
else:
    print('⚠️ 列表锚点未匹配')

# 2) 详情：题族信息块（插在场景之前）
OLD_CTX = """    /* 场景 */
    h += '<div class="qctx" style="border-left-color:var(--cy);background:rgba(8,145,178,.06);white-space:normal">' + nl(cur.scenario) + '</div>';"""
NEW_CTX = """    /* 题族信息：这一族考的是同一个能力，变式用于验证「真的会」而不是「记住了」 */
    if (cur.family) {
      var fam = WORKFLOW_QUESTIONS.filter(function (q) { return (q.family || q.id) === cur.family || q.id === cur.family; });
      var famDone = fam.filter(function (q) { return TP.isOpenDone(NS, q.id); }).length;
      var isV2 = cur.kind === 'variant';
      h += '<div class="card" style="margin:8px 0;padding:10px 13px;background:var(--bg2)">' +
           '<div style="font-size:12px;color:var(--text2);line-height:1.75">' +
           '<b style="color:var(--vi)">题族 ' + esc(String(cur.family).toUpperCase()) + '</b>' +
           '　本族共 <b>' + fam.length + '</b> 题（核心 1 + 变式 ' + (fam.length - 1) + '）· 已完成 <b>' + famDone + '/' + fam.length + '</b>' +
           (isV2 ? '<br><span style="color:var(--text3)">这是变式：场景换了，考的能力与评分量规不变 —— 用来验证你掌握的是能力，不是这一道题的答案。</span>' : '') +
           '</div></div>';
    }

    /* 场景 */
    h += '<div class="qctx" style="border-left-color:var(--cy);background:rgba(8,145,178,.06);white-space:normal">' + nl(cur.scenario) + '</div>';"""
if '题族 ' in m and 'famDone' in m:
    print('ℹ️  详情已支持题族')
elif OLD_CTX in m:
    m = m.replace(OLD_CTX, NEW_CTX, 1)
    print('✅ 详情已加题族信息块')
else:
    print('⚠️ 详情锚点未匹配')

# 3) 头部说明加一句变式提示
OLD_SUB = "'<div class=\"sub\">给一个真实场景 + 约束 → 自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 不考概念，考判断</div>' +"
NEW_SUB = "'<div class=\"sub\">给一个真实场景 + 约束 → 自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 不考概念，考判断</div>' +\n      '<div class=\"sub\" style=\"margin-top:-8px;color:var(--text3)\">题目按「题族」组织：每题族 = 1 道核心 + 2 道变式，场景不同、考的能力相同 —— 变式用来验证你掌握的是能力，不是这一道题的答案</div>' +"
if '题目按「题族」组织' in m:
    print('ℹ️  头部说明已有')
elif OLD_SUB in m:
    m = m.replace(OLD_SUB, NEW_SUB, 1)
    print('✅ 头部说明已加题族提示')
else:
    print('⚠️ 头部说明锚点未匹配')

open(MOD, 'w', encoding='utf-8').write(m)

# ==================== 语法 ====================
print()
for f in ['data/workflow.js', 'js/workflow-module.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
