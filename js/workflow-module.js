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

  var TRACK_ORDER = ['编排', '判断', '验收', '边界', '成本'];

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
    SCORE_DIMS.forEach(function (d) {
      var v = parseInt(TP.getNote(NS, cur.id + '_score_' + d.k), 10);
      if (!isNaN(v)) { total += v; filled++; }
    });
    return { total: total, max: SCORE_DIMS.length * 2, filled: filled };
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
        h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-wid="' + q.id + '">' +
             '<span class="n">' + String(idx).padStart(2, '0') + '</span>' +
             '<span class="t" title="' + esc(q.title) + '">' + esc(q.title) + '</span>' +
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
    h += '<details class="acc"><summary>📏 评分维度（先看这个，知道会被怎么评）</summary><div class="accbody">' +
         '<div style="font-size:12px;line-height:1.9;color:var(--txt2)">' +
         SCORE_DIMS.map(function (d) {
           return '<b style="color:var(--cy)">' + esc(d.label) + '</b>　0分：' + esc(d.zero) + '　/　2分：' + esc(d.full);
         }).join('<br>') +
         '</div></div></details>';

    /* 作答区 */
    h += '<div class="sec-t">我的设计（写下来才算练过）</div>';
    FIELDS.forEach(function (f) {
      h += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:5px">' + esc(f.label) + '</div>' +
           '<div class="editor" style="margin:0"><textarea id="wf_' + f.k + '" style="min-height:92px;color:var(--txt)" placeholder="' + esc(f.ph) + '">' +
           esc(TP.getNote(NS, cur.id + '_' + f.k)) + '</textarea></div></div>';
    });

    /* 自查量规 */
    h += '<div class="sec-t">自评（0-2 分 × 3 维，最高 6 分）</div>';
    SCORE_DIMS.forEach(function (d) {
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
    FIELDS.forEach(function (f) {
      var ta = document.getElementById('wf_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS, cur.id + '_' + f.k, ta.value); });
    });

    /* 自评按钮 */
    Array.prototype.forEach.call(box.querySelectorAll('.wfscore'), function (b) {
      b.onclick = function () {
        TP.setNote(NS, cur.id + '_score_' + b.getAttribute('data-dim'), b.getAttribute('data-v'));
        renderQuestion();
      };
    });

    /* 保存 / 完成 */
    var saveBtn = document.getElementById('wfSave');
    if (saveBtn) saveBtn.onclick = function () {
      FIELDS.forEach(function (f) {
        var ta = document.getElementById('wf_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      toast('已保存（缓存在你的浏览器）');
    };

    var doneBtn = document.getElementById('wfDone');
    if (doneBtn) doneBtn.onclick = function () {
      FIELDS.forEach(function (f) {
        var ta = document.getElementById('wf_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats();
    };
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    var total = WORKFLOW_QUESTIONS.length, done = 0, scoreSum = 0, scored = 0;
    WORKFLOW_QUESTIONS.forEach(function (q) {
      if (TP.isOpenDone(NS, q.id)) done++;
      var s = 0, f = 0;
      SCORE_DIMS.forEach(function (d) {
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
      '<div class="stats" id="wfStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.9">' +
      '💡 <b>为什么练这个</b>　面试里「你会用 AI 吗」的及格答案是列工具名，满分答案是讲清「哪一步交给它、哪一步必须我看、怎么证明它没做错」。' +
      '本模块 24 题里前 4 题来自真实项目 —— 答完就是可以带去面试的素材。' +
      '</div></div>' +
      '<div class="lab">' +
      '<div><div class="sec-t" style="margin-top:0">题目列表</div><div class="qlist" id="wfList"></div></div>' +
      '<div><div class="pane" id="wfMain"></div></div>' +
      '</div>' +
      '<div id="wfToast" class="toast"></div>';

    renderList(); renderQuestion(); refreshStats();
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
