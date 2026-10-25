# -*- coding: utf-8 -*-
"""让模块支持「关底挑战」：
   - 作答字段切换为 5 段（问题/依据/方法/结果/局限）
   - 自评维度切换为 5 维
   - 列表分组加「挑战」
"""
import io, sys, os, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MOD = os.path.join(T, 'js', 'workflow-module.js')
m = open(MOD, encoding='utf-8').read()

# ---------- 1) 新增挑战专用的 FIELDS 与 SCORE_DIMS ----------
CH = """
  /* 关底挑战的作答字段（方案定义：问题 / 依据 / 方法 / 结果 / 局限 + 实际产物） */
  var CH_FIELDS = [
    { k: 'problem', label: '① 问题（界定到可判断：含约束与目标）', ph: '在【约束：预算/时间/其他】下，【要不要做 X】是否比其他路径更可能达到【目标 Y】？\\n\\n提示：不要写「要不要变好」这类无法回答的问题。' },
    { k: 'evidence', label: '② 依据（哪些数据/事实支持，哪些是弱推断）', ph: '强依据：…（有数据或真实案例）\\n弱依据：…（推测，需标注）\\n\\n提示：混着写等于全部不可信。' },
    { k: 'method', label: '③ 方法（怎么比较、怎么排除替代方案、怎么验证假设）', ph: '比较维度：钱 / 时间 / 机会成本 / 可验证收益\\n替代方案：至少 2 个，说明为什么不选\\n验证方法：…\\n\\n提示：没有替代方案对比的论证不成立。' },
    { k: 'result', label: '④ 结果（结论 + 关键取舍 + 下一步）', ph: '结论：…\\n我放弃了什么、为什么可以接受：…\\n下一步（可执行）：…' },
    { k: 'limit', label: '⑤ 局限（弱依据、什么条件下结论会反转、没覆盖什么）', ph: '哪些依据是弱的：…\\n什么条件下我会改变结论：…\\n这个论证没覆盖：…\\n\\n提示：这一段是最能体现判断力的部分。' }
  ];

  var CH_SCORE_DIMS = [
    { k: 'problem', label: '问题界定', zero: '「要不要做 X」，没有约束与目标', full: '问题含约束与目标，可判断' },
    { k: 'evidence', label: '依据强度', zero: '只有感觉与零散信息', full: '关键假设有来源，并区分强/弱依据' },
    { k: 'method', label: '方法严谨', zero: '直接给结论，无比较', full: '有比较维度、≥2 个替代方案、验证方法' },
    { k: 'result', label: '结果可用', zero: '只给一个结论', full: '结论 + 取舍 + 可执行下一步' },
    { k: 'limit', label: '局限诚实', zero: '不写局限', full: '写清弱依据、反转条件、未覆盖范围' }
  ];
"""

ANCHOR_AFTER = """  var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本', '表达', '生活'];"""
if 'CH_FIELDS' in m:
    print('ℹ️  挑战字段已存在')
elif ANCHOR_AFTER in m:
    m = m.replace(ANCHOR_AFTER, ANCHOR_AFTER + '\n' + CH, 1)
    print('✅ 已加挑战专用字段（5 段 + 5 维）')
else:
    print('⚠️ 字段插入锚点未匹配')

# ---------- 2) TRACK_ORDER 加「挑战」（放最前，作为收尾任务） ----------
OLD_T = "var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本', '表达', '生活'];"
NEW_T = "var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本', '表达', '生活', '挑战'];"
if "'挑战'" in m and NEW_T not in m:
    print('⚠️ 挑战已在其他地方出现，检查')
elif NEW_T in m:
    print('ℹ️  TRACK_ORDER 已含挑战')
elif OLD_T in m:
    m = m.replace(OLD_T, NEW_T, 1)
    print('✅ TRACK_ORDER 已加「挑战」')
else:
    print('⚠️ TRACK_ORDER 未匹配')

# ---------- 3) renderQuestion：按 kind 切换字段与维度 ----------
OLD_F = """    /* 作答区 */
    h += '<div class="sec-t">我的设计（写下来才算练过）</div>';
    FIELDS.forEach(function (f) {"""
NEW_F = """    /* 实际产物（仅挑战） */
    if (cur.artifact) {
      h += '<div class="card" style="margin:10px 0;padding:12px 14px;border-left:3px solid var(--am)">' +
           '<div style="font-size:12px;color:var(--text2);line-height:1.85"><b style="color:var(--am)">本挑战要交的东西</b><br>' + esc(cur.artifact) + '</div></div>';
    }

    /* 作答区（挑战用 5 段，其余用 4 段） */
    var USE_FIELDS = (cur.kind === 'challenge') ? CH_FIELDS : FIELDS;
    h += '<div class="sec-t">我的设计（写下来才算练过）</div>';
    USE_FIELDS.forEach(function (f) {"""
if 'USE_FIELDS' in m:
    print('ℹ️  字段切换已存在')
elif OLD_F in m:
    m = m.replace(OLD_F, NEW_F, 1)
    print('✅ 作答区已支持按类型切换')
else:
    print('⚠️ 作答区锚点未匹配')

# 自评维度切换
OLD_S = """    h += '<div class="sec-t">自评（0-2 分 × 3 维，最高 6 分）</div>';
    SCORE_DIMS.forEach(function (d) {"""
NEW_S = """    var USE_DIMS = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    h += '<div class="sec-t">自评（0-2 分 × ' + USE_DIMS.length + ' 维，最高 ' + (USE_DIMS.length * 2) + ' 分）</div>';
    USE_DIMS.forEach(function (d) {"""
if 'USE_DIMS' in m:
    print('ℹ️  维度切换已存在')
elif OLD_S in m:
    m = m.replace(OLD_S, NEW_S, 1)
    print('✅ 自评区已支持按类型切换')
else:
    print('⚠️ 自评区锚点未匹配')

# 评分维度说明折叠区也切换
OLD_R = """    h += '<details class="acc"><summary>📏 评分维度（先看这个，知道会被怎么评）</summary><div class="accbody">' +
         '<div style="font-size:12px;line-height:1.9;color:var(--txt2)">' +
         SCORE_DIMS.map(function (d) {"""
NEW_R = """    var PRE_DIMS = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    h += '<details class="acc"><summary>📏 评分维度（' + PRE_DIMS.length + ' 维，先看这个知道会被怎么评）</summary><div class="accbody">' +
         '<div style="font-size:12px;line-height:1.9;color:var(--txt2)">' +
         PRE_DIMS.map(function (d) {"""
if 'PRE_DIMS' in m:
    print('ℹ️  评分说明已存在')
elif OLD_R in m:
    m = m.replace(OLD_R, NEW_R, 1)
    print('✅ 评分维度说明已支持切换')
else:
    print('⚠️ 评分说明锚点未匹配')

# ---------- 4) 保存/完成按钮：用 USE_FIELDS ----------
m = m.replace("""    FIELDS.forEach(function (f) {
      var ta = document.getElementById('wf_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS, cur.id + '_' + f.k, ta.value); });
    });""",
"""    USE_FIELDS.forEach(function (f) {
      var ta = document.getElementById('wf_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS, cur.id + '_' + f.k, ta.value); });
    });""")

m = m.replace("""    var saveBtn = document.getElementById('wfSave');
    if (saveBtn) saveBtn.onclick = function () {
      FIELDS.forEach(function (f) {""",
"""    var saveBtn = document.getElementById('wfSave');
    if (saveBtn) saveBtn.onclick = function () {
      USE_FIELDS.forEach(function (f) {""")

m = m.replace("""    var doneBtn = document.getElementById('wfDone');
    if (doneBtn) doneBtn.onclick = function () {
      FIELDS.forEach(function (f) {""",
"""    var doneBtn = document.getElementById('wfDone');
    if (doneBtn) doneBtn.onclick = function () {
      USE_FIELDS.forEach(function (f) {""")

# ---------- 5) refreshStats：挑战的评分也要算进平均 ----------
OLD_ST = """      var s = 0, f = 0;
      SCORE_DIMS.forEach(function (d) {
        var v = parseInt(TP.getNote(NS, q.id + '_score_' + d.k), 10);
        if (!isNaN(v)) { s += v; f++; }
      });"""
NEW_ST = """      var s = 0, f = 0;
      var dims = (q.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
      dims.forEach(function (d) {
        var v = parseInt(TP.getNote(NS, q.id + '_score_' + d.k), 10);
        if (!isNaN(v)) { s += v; f++; }
      });"""
if NEW_ST in m:
    print('ℹ️  统计已支持挑战')
elif OLD_ST in m:
    m = m.replace(OLD_ST, NEW_ST, 1)
    print('✅ 统计已支持挑战维度')
else:
    print('⚠️ 统计锚点未匹配')

# getScore 也要按类型
OLD_GS = """    var total = 0, filled = 0;
    SCORE_DIMS.forEach(function (d) {
      var v = parseInt(TP.getNote(NS, cur.id + '_score_' + d.k), 10);
      if (!isNaN(v)) { total += v; filled++; }
    });
    return { total: total, max: SCORE_DIMS.length * 2, filled: filled };"""
NEW_GS = """    var total = 0, filled = 0;
    var dims = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    dims.forEach(function (d) {
      var v = parseInt(TP.getNote(NS, cur.id + '_score_' + d.k), 10);
      if (!isNaN(v)) { total += v; filled++; }
    });
    return { total: total, max: dims.length * 2, filled: filled };"""
if NEW_GS in m:
    print('ℹ️  getScore 已支持挑战')
elif OLD_GS in m:
    m = m.replace(OLD_GS, NEW_GS, 1)
    print('✅ getScore 已支持挑战维度')
else:
    print('⚠️ getScore 锚点未匹配')

open(MOD, 'w', encoding='utf-8').write(m)

print()
for f in ['js/workflow-module.js', 'data/workflow.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-26s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
