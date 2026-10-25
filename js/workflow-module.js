/* AI 工作流实验室 · 模块
   题型：设计题。作答字段固定为 4 段（拆解 / 工具 / 人工点 / 验收），
   外加 3 维自查量规（0-2 分），最后可展开参考答案对照。
   设计原则：不考「AI 是什么」，考「这个任务该不该交给 AI、怎么拆、哪里必须人看一眼、怎么验收」。 */

var WorkflowModule = (function () {
  var NS = 'workflow';
  var cur = null;

  var FIELDS = [
    { k: 'steps', label: '① 步骤拆解（每步做什么、产出什么）', ph: '第1步：…（产出：…）\n第2步：…（产出：…）\n\n提示：能被机器验证的步骤，就不要留给人；反之亦然。' },
    { k: 'tools', label: '② 每步用什么工具，为什么', ph: '第1步 → 脚本（确定性转换，不该交给模型）\n第2步 → 模型（需要语义判断）\n\n提示：说明「为什么是这个」比列出工具名更重要。' },
    { k: 'gates', label: '③ 哪些步骤必须人工确认，为什么放在这个位置', ph: '确认点1：…（原因：不可逆 / 错误代价高）\n确认点2：…\n\n提示：设太早会打断，设太晚等于没有。' },
    { k: 'accept', label: '④ 验收标准（要可测，不要写「保证质量」）', ph: '① 数量前后一致\n② 目标格式匹配率 100%\n③ 抽样 N 条，字段准确率 ≥95%\n\n提示：写「怎么测」，不写「要很好」。' }
  ];

  var SCORE_DIMS = [
    { k: 'a', label: '拆解合理性', zero: '一句话概括，没有步骤', full: '步骤独立、每步有产出、分工说明清楚' },
    { k: 'b', label: '人工确认点', zero: '全自动或全人工', full: '位置正确、理由充分、粒度合适' },
    { k: 'c', label: '验收可测性', zero: '「保证质量」这类不可测表述', full: '有数量/比例/阈值，别人能照着验证' }
  ];


  /* ---------- 间隔复习（方案 T02 的最小落地） ---------- */
  function wfToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* 记一次学习活动（每天最多一条，用于「本周学习日」统计） */
  function wfActive() {
    try {
      if (typeof Ledger !== 'undefined') Ledger.add('active', 'workflow', 0, {});
    } catch (e) {}
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

  var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本', '表达', '生活', '挑战'];

  /* 关底挑战的作答字段（方案定义：问题 / 依据 / 方法 / 结果 / 局限 + 实际产物） */
  var CH_FIELDS = [
    { k: 'problem', label: '① 问题（界定到可判断：含约束与目标）', ph: '在【约束：预算/时间/其他】下，【要不要做 X】是否比其他路径更可能达到【目标 Y】？\n\n提示：不要写「要不要变好」这类无法回答的问题。' },
    { k: 'evidence', label: '② 依据（哪些数据/事实支持，哪些是弱推断）', ph: '强依据：…（有数据或真实案例）\n弱依据：…（推测，需标注）\n\n提示：混着写等于全部不可信。' },
    { k: 'method', label: '③ 方法（怎么比较、怎么排除替代方案、怎么验证假设）', ph: '比较维度：钱 / 时间 / 机会成本 / 可验证收益\n替代方案：至少 2 个，说明为什么不选\n验证方法：…\n\n提示：没有替代方案对比的论证不成立。' },
    { k: 'result', label: '④ 结果（结论 + 关键取舍 + 下一步）', ph: '结论：…\n我放弃了什么、为什么可以接受：…\n下一步（可执行）：…' },
    { k: 'limit', label: '⑤ 局限（弱依据、什么条件下结论会反转、没覆盖什么）', ph: '哪些依据是弱的：…\n什么条件下我会改变结论：…\n这个论证没覆盖：…\n\n提示：这一段是最能体现判断力的部分。' }
  ];

  var CH_SCORE_DIMS = [
    { k: 'problem', label: '问题界定', zero: '「要不要做 X」，没有约束与目标', full: '问题含约束与目标，可判断' },
    { k: 'evidence', label: '依据强度', zero: '只有感觉与零散信息', full: '关键假设有来源，并区分强/弱依据' },
    { k: 'method', label: '方法严谨', zero: '直接给结论，无比较', full: '有比较维度、≥2 个替代方案、验证方法' },
    { k: 'result', label: '结果可用', zero: '只给一个结论', full: '结论 + 取舍 + 可执行下一步' },
    { k: 'limit', label: '局限诚实', zero: '不写局限', full: '写清弱依据、反转条件、未覆盖范围' }
  ];


  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }

  function toast(m) {
    var t = document.getElementById('wfToast');
    if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(toast._tm); toast._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 自查量规 ---------- */
  function getScore() {
    var total = 0, filled = 0;
    var dims = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    dims.forEach(function (d) {
      var v = parseInt(TP.getNote(NS, cur.id + '_score_' + d.k), 10);
      if (!isNaN(v)) { total += v; filled++; }
    });
    return { total: total, max: dims.length * 2, filled: filled };
  }

  /* ---------- 左侧列表（按 track 分组） ---------- */
  function renderList() {
    var box = document.getElementById('wfList');
    if (!box) return;
    var h = '', idx = 0;
    TRACK_ORDER.forEach(function (tr) {
      var arr = WORKFLOW_QUESTIONS.filter(function (q) { return q.track === tr; });
      if (!arr.length) return;
      h += '<div style="font-size:12px;color:var(--text3);font-weight:700;margin:9px 0 4px;letter-spacing:.4px">' + esc(tr) + '</div>';
      arr.forEach(function (q) {
        idx++;
        var done = TP.isOpenDone(NS, q.id);
        var isV = q.kind === 'variant';
        var label = isV ? ('↳ ' + String(q.title).replace(/^变式｜/, '')) : q.title;
        h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-wid="' + q.id + '"' +
             (isV ? ' style="padding-left:22px;opacity:.92"' : '') + '>' +
             '<span class="n">' + (isV ? '·' : String(idx).padStart(2, '0')) + '</span>' +
             '<span class="t" title="' + esc(q.title) + '">' + esc(label) + '</span>' +
             '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
      });
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-wid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < WORKFLOW_QUESTIONS.length; i++) {
      if (WORKFLOW_QUESTIONS[i].id === id) { cur = WORKFLOW_QUESTIONS[i]; break; }
    }
    renderList(); renderQuestion();
  }

  /* ---------- 右侧详情 ---------- */
  function renderQuestion() {
    var box = document.getElementById('wfMain');
    if (!box || !cur) return;
    var done = TP.isOpenDone(NS, cur.id);
    var sc = getScore();

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span><span>' + esc(cur.title) + '</span>';
    if (done) h += '<span class="badge on">已完成</span>';
    h += '</div>';

    /* 题族信息：这一族考的是同一个能力，变式用于验证「真的会」而不是「记住了」 */
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
    h += '<div class="qctx" style="border-left-color:var(--cy);background:rgba(8,145,178,.06);white-space:normal">' + nl(cur.scenario) + '</div>';

    /* 约束 */
    h += '<div class="card" style="margin:10px 0;padding:12px 14px">' +
         '<div style="font-size:12px;color:var(--txt2);line-height:1.9"><b style="color:var(--am)">约束条件</b><br>' +
         cur.constraints.map(function (c) { return '· ' + esc(c); }).join('<br>') + '</div></div>';

    /* 交付物 */
    h += '<div class="card" style="margin:10px 0;padding:12px 14px">' +
         '<div style="font-size:12px;color:var(--txt2);line-height:1.85"><b style="color:var(--em)">交付物</b>　' + esc(cur.deliverable) + '</div></div>';

    /* 评分维度提醒 */
    var PRE_DIMS = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    h += '<details class="acc"><summary>📏 评分维度（' + PRE_DIMS.length + ' 维，先看这个知道会被怎么评）</summary><div class="accbody">' +
         '<div style="font-size:12px;line-height:1.9;color:var(--txt2)">' +
         PRE_DIMS.map(function (d) {
           return '<b style="color:var(--cy)">' + esc(d.label) + '</b>　0分：' + esc(d.zero) + '　/　2分：' + esc(d.full);
         }).join('<br>') +
         '</div></div></details>';

    /* 实际产物（仅挑战） */
    if (cur.artifact) {
      h += '<div class="card" style="margin:10px 0;padding:12px 14px;border-left:3px solid var(--am)">' +
           '<div style="font-size:12px;color:var(--text2);line-height:1.85"><b style="color:var(--am)">本挑战要交的东西</b><br>' + esc(cur.artifact) + '</div></div>';
    }

    /* 作答区（挑战用 5 段，其余用 4 段） */
    var USE_FIELDS = (cur.kind === 'challenge') ? CH_FIELDS : FIELDS;
    h += '<div class="sec-t">我的设计（写下来才算练过）</div>';
    USE_FIELDS.forEach(function (f) {
      h += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:5px">' + esc(f.label) + '</div>' +
           '<div class="editor" style="margin:0"><textarea id="wf_' + f.k + '" style="min-height:92px;color:var(--txt)" placeholder="' + esc(f.ph) + '">' +
           esc(TP.getNote(NS, cur.id + '_' + f.k)) + '</textarea></div></div>';
    });

    /* 自查量规 */
    var USE_DIMS = (cur.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
    h += '<div class="sec-t">自评（0-2 分 × ' + USE_DIMS.length + ' 维，最高 ' + (USE_DIMS.length * 2) + ' 分）</div>';
    USE_DIMS.forEach(function (d) {
      var v = TP.getNote(NS, cur.id + '_score_' + d.k);
      h += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap">' +
           '<div style="font-size:12px;font-weight:700;min-width:104px">' + esc(d.label) + '</div>' +
           [0, 1, 2].map(function (n) {
             var on = String(v) === String(n);
             return '<button class="btn sm wfscore' + (on ? ' primary' : '') + '" data-dim="' + d.k + '" data-v="' + n + '"' +
                    ' style="min-width:44px">' + n + '</button>';
           }).join('') +
           '<div style="font-size:11.5px;color:var(--txt3);flex:1;min-width:180px">2分 = ' + esc(d.full) + '</div>' +
           '</div>';
    });
    h += '<div style="font-size:12px;color:var(--txt3);margin:4px 0 10px">当前自评：<b style="color:var(--em);font-size:14px">' + sc.total + ' / ' + sc.max + '</b>' +
         (sc.filled < SCORE_DIMS.length ? '（还有 ' + (SCORE_DIMS.length - sc.filled) + ' 项未评）' : '') + '</div>';

    /* 操作按钮 */
    h += '<div class="row"><button class="btn primary" id="wfSave">💾 保存我的设计</button>' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="wfDone"' + (done ? '' : ' style="background:linear-gradient(135deg,var(--em),var(--green))"') + '>' +
         (done ? '✅ 已完成（点击取消）' : '✅ 标记为已完成') + '</button></div>';

    /* 参考答案 */
    h += '<details class="acc answer" style="margin-top:14px"><summary>📖 显示参考答案（含「为什么这样设计」）</summary><div class="accbody">';
    h += '<div style="font-size:11.5px;color:var(--txt3);margin-bottom:8px">先自己写完再看 —— 直接看参考，等于没练。</div>';

    h += '<div style="margin:9px 0;padding:10px 12px;background:var(--bg2);border-radius:9px;border-left:3px solid var(--vi)">' +
         '<div style="font-size:12px;font-weight:700;margin-bottom:5px">① 参考步骤拆解</div>' +
         '<div style="font-size:11.5px;line-height:1.85;color:var(--txt2)">' +
         cur.reference.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br>') + '</div></div>';

    h += '<div style="margin:9px 0;padding:10px 12px;background:var(--bg2);border-radius:9px;border-left:3px solid var(--am)">' +
         '<div style="font-size:12px;font-weight:700;margin-bottom:5px">③ 参考人工确认点</div>' +
         '<div style="font-size:11.5px;line-height:1.85;color:var(--txt2)">' +
         cur.reference.gates.map(function (s) { return '· ' + esc(s); }).join('<br>') + '</div></div>';

    h += '<div style="margin:9px 0;padding:10px 12px;background:var(--bg2);border-radius:9px;border-left:3px solid var(--em)">' +
         '<div style="font-size:12px;font-weight:700;margin-bottom:5px">④ 参考验收标准</div>' +
         '<div style="font-size:11.5px;line-height:1.85;color:var(--txt2)">' +
         cur.reference.accept.map(function (s) { return '· ' + esc(s); }).join('<br>') + '</div></div>';

    if (cur.reference.why) {
      h += '<div style="margin-top:12px;padding:11px 13px;background:var(--accent-light);border-left:3px solid var(--cy);border-radius:9px;font-size:12.5px;line-height:1.85">' +
           '<b>为什么这样设计</b><br>' + cur.reference.why.map(function (s) { return '· ' + esc(s); }).join('<br>') + '</div>';
    }

    if (cur.pitfalls) {
      h += '<div style="margin-top:12px"><b style="color:var(--rd);font-size:12px">⚠️ 常见错误</b>' +
           '<div style="font-size:12px;line-height:1.9;color:var(--txt2);margin-top:5px">' +
           cur.pitfalls.map(function (p) { return '· ' + esc(p); }).join('<br>') + '</div></div>';
    }
    h += '</div></details>';

    box.innerHTML = h;

    /* 草稿自动保存 */
    USE_FIELDS.forEach(function (f) {
      var ta = document.getElementById('wf_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS, cur.id + '_' + f.k, ta.value); });
    });

    /* 自评按钮 */
    Array.prototype.forEach.call(box.querySelectorAll('.wfscore'), function (b) {
      b.onclick = function () {
        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        wfTouch(cur.id);
        wfActive();
        renderQuestion();
        renderReview();
      };
    });

    /* 保存 / 完成 */
    var saveBtn = document.getElementById('wfSave');
    if (saveBtn) saveBtn.onclick = function () {
      USE_FIELDS.forEach(function (f) {
        var ta = document.getElementById('wf_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      toast('已保存（缓存在你的浏览器）');
    };

    var doneBtn = document.getElementById('wfDone');
    if (doneBtn) doneBtn.onclick = function () {
      USE_FIELDS.forEach(function (f) {
        var ta = document.getElementById('wf_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      if (now) { wfTouch(cur.id); wfActive(); }
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats(); renderReview();
    };
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    var total = WORKFLOW_QUESTIONS.length, done = 0, scoreSum = 0, scored = 0;
    WORKFLOW_QUESTIONS.forEach(function (q) {
      if (TP.isOpenDone(NS, q.id)) done++;
      var s = 0, f = 0;
      var dims = (q.kind === 'challenge') ? CH_SCORE_DIMS : SCORE_DIMS;
      dims.forEach(function (d) {
        var v = parseInt(TP.getNote(NS, q.id + '_score_' + d.k), 10);
        if (!isNaN(v)) { s += v; f++; }
      });
      if (f > 0) { scoreSum += s; scored++; }
    });
    var el = document.getElementById('wfStats');
    if (!el) return;
    var avg = scored ? (scoreSum / scored).toFixed(1) : '—';
    el.innerHTML =
      '<div class="stat cy"><b>' + done + '<span style="font-size:12px;color:var(--txt3)">/' + total + '</span></b><span>已完成设计</span></div>' +
      '<div class="stat em"><b>' + Math.round(done / total * 100) + '%</b><span>完成度</span></div>' +
      '<div class="stat am"><b>' + avg + '</b><span>平均自评（满分 6）</span></div>' +
      '<div class="stat vi"><b>' + scored + '</b><span>已自评题数</span></div>';
  }

  function mount(host) {
    var firstUndone = null;
    for (var i = 0; i < WORKFLOW_QUESTIONS.length; i++) {
      if (!TP.isOpenDone(NS, WORKFLOW_QUESTIONS[i].id)) { firstUndone = WORKFLOW_QUESTIONS[i]; break; }
    }
    cur = firstUndone || WORKFLOW_QUESTIONS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">AI 工作流实验室</span> · 设计题</div>' +
      '<div class="sub">给一个真实场景 + 约束 → 自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 不考概念，考判断</div>' +
      '<div class="sub" style="margin-top:-8px;color:var(--text3)">题目按「题族」组织：每题族 = 1 道核心 + 2 道变式，场景不同、考的能力相同 —— 变式用来验证你掌握的是能力，不是这一道题的答案</div>' +
      '<div class="stats" id="wfStats" style="margin-bottom:14px"></div>' +
      '<div id="wfReview" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.9">' +
      '💡 <b>为什么练这个</b>　面试里「你会用 AI 吗」的及格答案是列工具名，满分答案是讲清「哪一步交给它、哪一步必须我看、怎么证明它没做错」。' +
      '本模块 110 题里前 4 题来自真实项目 —— 答完就是可以带去面试的素材。' +
      '</div></div>' +
      '<div class="lab">' +
      '<div><div class="sec-t" style="margin-top:0">题目列表</div><div class="qlist" id="wfList"></div></div>' +
      '<div><div class="pane" id="wfMain"></div></div>' +
      '</div>' +
      '<div id="wfToast" class="toast"></div>';

    renderList(); renderQuestion(); refreshStats(); renderReview();
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow, /* 供单测 */ _review: wfReview, _today: wfToday };
})();
