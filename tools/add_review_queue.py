# -*- coding: utf-8 -*-
"""给 AI 工作流模块加「低分重做队列 + 间隔复习」
   方案 T02「动态训练计划和间隔复习」的最小落地：
   - 按自评比例分类：需重做（<60%）/ 建议复查（60-80%）/ 已掌握（≥80%）/ 未自评
   - 记录每次自评或标记完成的时间，用于算「距上次多久」
   - 复查间隔：3 天 / 7 天 / 14 天（未到期的不催）
   - 面板显示优先队列，点一下跳到该题
   时间戳用独立键 tp_note_<ns>::<id>_ts，不改动 markOpen 的存值格式（避免破坏 isOpenDone）。
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MOD = os.path.join(T, 'js', 'workflow-module.js')
m = open(MOD, encoding='utf-8').read()

# ---------------- 1) 插入复习逻辑 ----------------
REVIEW = r'''
  /* ---------- 间隔复习（方案 T02 的最小落地） ---------- */
  function wfToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function wfTouch(id) {
    try { TP.setNote(NS, id + '_ts', wfToday()); } catch (e) {}
  }
  /* 返回按优先级排好的清单 */
  function wfReview() {
    var now = new Date();
    var out = [];
    WORKFLOW_QUESTIONS.forEach(function (q) {
      var dims = (q.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
      var s = 0, f = 0;
      dims.forEach(function (d) {
        var v = parseInt(TP.getNote(NS, q.id + '_score_' + d.k), 10);
        if (!isNaN(v)) { s += v; f++; }
      });
      var ts = TP.getNote(NS, q.id + '_ts');
      var days = null;
      if (ts) {
        var t = new Date(ts);
        if (!isNaN(t.getTime())) days = Math.floor((now - t) / 86400000);
      }
      var max = dims.length * 2;
      var ratio = f ? s / max : null;
      var status, pri, due = false;
      if (ratio === null) { status = '未自评'; pri = 3; }
      else if (ratio < 0.6) { status = '需重做'; pri = 0; due = true; }
      else if (ratio < 0.8) {
        status = '建议复查'; pri = 1;
        due = (days === null || days >= 3);   /* 3 天后催 */
      } else {
        status = '已掌握'; pri = 2;
        due = (days !== null && days >= 14);  /* 14 天后再看一次 */
      }
      out.push({ q: q, score: s, max: max, ratio: ratio, ts: ts, days: days, status: status, pri: pri, due: due });
    });
    out.sort(function (a, b) {
      if (a.pri !== b.pri) return a.pri - b.pri;
      return (b.days === null ? -1 : b.days) - (a.days === null ? -1 : a.days);
    });
    return out;
  }
  function renderReview() {
    var box = document.getElementById('wfReview');
    if (!box) return;
    var list = wfReview();
    var need = list.filter(function (x) { return x.pri === 0; }).length;
    var sug = list.filter(function (x) { return x.pri === 1 && x.due; }).length;
    var mastered = list.filter(function (x) { return x.pri === 2; }).length;
    var notScored = list.filter(function (x) { return x.pri === 3; }).length;
    var dueList = list.filter(function (x) { return x.due; }).slice(0, 5);

    var h = '';
    h += '<div class="card" style="padding:13px 16px">';
    h += '<div class="row" style="justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px">' +
         '<div style="font-size:13px;font-weight:800;color:var(--text)">🔁 复查队列（自评低的题会排到前面）</div>' +
         '<div style="font-size:12px;color:var(--text3)">需重做 <b style="color:var(--rd)">' + need + '</b> · 待复查 <b style="color:var(--am)">' + sug + '</b> · 已掌握 <b style="color:var(--em)">' + mastered + '</b> · 未自评 ' + notScored + '</div>' +
         '</div>';

    if (!dueList.length) {
      h += '<div style="font-size:12px;color:var(--text3);line-height:1.8">' +
           (notScored === WORKFLOW_QUESTIONS.length
             ? '还没有自评记录。做完一道题给自己打 0-2 分 × 3 维，这里就会开始排序 —— 自评低于 60% 的会排到最前面。'
             : '当前没有到期的复查项。继续做新题，或隔几天回来看。') +
           '</div>';
    } else {
      h += '<div style="display:flex;flex-direction:column;gap:6px">';
      dueList.forEach(function (x) {
        var color = x.pri === 0 ? 'var(--rd)' : (x.pri === 1 ? 'var(--am)' : 'var(--em)');
        var when = (x.days === null) ? '未记录时间' : (x.days === 0 ? '今天' : x.days + ' 天前');
        h += '<div class="row" data-rw="' + x.q.id + '" style="justify-content:space-between;gap:10px;padding:7px 10px;background:var(--bg2);border-radius:8px;cursor:pointer;border-left:3px solid ' + color + '">' +
             '<div style="min-width:0"><div style="font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.q.title) + '</div>' +
             '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + esc(when) + ' · 自评 ' + x.score + '/' + x.max + '</div></div>' +
             '<span style="font-size:11px;font-weight:800;color:' + color + ';white-space:nowrap">' + esc(x.status) + ' →</span>' +
             '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('[data-rw]'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-rw')); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    });
  }

'''

if 'function wfReview' in m:
    print('ℹ️  复习逻辑已存在')
else:
    anchor = "  var TRACK_ORDER = "
    idx = m.find(anchor)
    if idx > 0:
        m = m[:idx] + REVIEW + m[idx:]
        print('✅ 已插入复习逻辑（wfToday / wfTouch / wfReview / renderReview）')
    else:
        print('❌ 锚点未找到')

# ---------------- 2) 打时间戳：自评点击 & 标记完成 ----------------
OLD_SCORE = """      b.onclick = function () {
        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        renderQuestion();
      };"""
NEW_SCORE = """      b.onclick = function () {
        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        wfTouch(cur.id);
        renderQuestion();
        renderReview();
      };"""
if 'wfTouch(cur.id)' in m:
    print('ℹ️  自评已打时间戳')
elif OLD_SCORE in m:
    m = m.replace(OLD_SCORE, NEW_SCORE, 1)
    print('✅ 自评点击已打时间戳并刷新复查队列')
else:
    print('⚠️ 自评点击锚点未匹配')

OLD_DONE = """      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats();"""
NEW_DONE = """      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      if (now) wfTouch(cur.id);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats(); renderReview();"""
if 'renderReview();' in m and 'wfTouch(cur.id);' in m and NEW_DONE in m:
    print('ℹ️  完成标记已联动')
elif OLD_DONE in m:
    m = m.replace(OLD_DONE, NEW_DONE, 1)
    print('✅ 标记完成已联动复查队列')
else:
    print('⚠️ 标记完成锚点未匹配')

# ---------------- 3) mount 里加容器并首次渲染 ----------------
OLD_MOUNT = "'<div class=\"stats\" id=\"wfStats\" style=\"margin-bottom:14px\"></div>' +"
NEW_MOUNT = ("'<div class=\"stats\" id=\"wfStats\" style=\"margin-bottom:14px\"></div>' +\n"
             "      '<div id=\"wfReview\" style=\"margin-bottom:14px\"></div>' +")
if 'id="wfReview"' in m:
    print('ℹ️  容器已存在')
elif OLD_MOUNT in m:
    m = m.replace(OLD_MOUNT, NEW_MOUNT, 1)
    print('✅ 已加 #wfReview 容器')
else:
    print('⚠️ mount 锚点未匹配')

OLD_CALL = "    renderList(); renderQuestion(); refreshStats();\n  }"
NEW_CALL = "    renderList(); renderQuestion(); refreshStats(); renderReview();\n  }"
if 'renderReview();\n  }' in m:
    print('ℹ️  mount 已调用 renderReview')
elif OLD_CALL in m:
    m = m.replace(OLD_CALL, NEW_CALL, 1)
    print('✅ mount 已加 renderReview 调用')
else:
    print('⚠️ mount 调用锚点未匹配')

open(MOD, 'w', encoding='utf-8').write(m)

print()
r = subprocess.run(['node', '--check', MOD], capture_output=True, text=True, encoding='utf-8', errors='replace')
print('  js/workflow-module.js 语法：', 'OK' if r.returncode == 0 else 'FAIL ' + (r.stderr or '')[:300])
for k in ['function wfReview', 'function renderReview', 'id="wfReview"', 'wfTouch(cur.id)']:
    print('  含 %-22s %s' % (k, k in open(MOD, encoding='utf-8').read()))
