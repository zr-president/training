/* AI 产品经理（AI PM）· 交互模块（能力对照 / 判读题 / PRD 工坊） */
var AipmModule = (function () {
  var host = null, curPrd = null;
  var NS_QUIZ = 'aipm', NS_PRD = 'prd';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- Tab 1：能力对照 ---------- */
  function renderSkillMap(container) {
    var m = AIPM_SKILL_MAP;
    var h = '<div class="card" style="padding:14px 16px">';
    h += '<div style="font-size:13px;font-weight:700;margin-bottom:6px">🔄 ' + esc(m.title) + '</div>';
    h += '<div style="font-size:12px;color:var(--text2);line-height:1.85;margin-bottom:12px">' + esc(m.intro) + '</div>';
    h += '<div class="tblwrap" style="max-height:none"><table class="dg" style="font-family:var(--sans);font-size:12px">';
    h += '<thead><tr><th>能力</th><th>你的运营积累</th><th>AI PM 要求</th><th>结论</th><th>怎么讲 / 怎么补</th></tr></thead><tbody>';
    m.rows.forEach(function (r) {
      var col = r.level === '可直接迁移' ? 'var(--green)' : 'var(--orange)';
      h += '<tr>' +
           '<td style="color:var(--text);font-weight:700;white-space:normal">' + esc(r.n) + '</td>' +
           '<td style="white-space:normal">' + esc(r.ops) + '</td>' +
           '<td style="white-space:normal">' + esc(r.pm) + '</td>' +
           '<td style="color:' + col + ';font-weight:700;white-space:nowrap">' + esc(r.level) + '</td>' +
           '<td style="white-space:normal">' + esc(r.how) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    /* 汇总 */
    var okCnt = m.rows.filter(function (r) { return r.level === '可直接迁移'; }).length;
    h += '<div class="row" style="margin-top:12px;gap:12px">' +
         '<div class="stat em" style="flex:1;min-width:120px"><b>' + okCnt + '</b><span>项可直接迁移</span></div>' +
         '<div class="stat am" style="flex:1;min-width:120px"><b>' + (m.rows.length - okCnt) + '</b><span>项需重点补齐</span></div>' +
         '<div class="stat cy" style="flex:1;min-width:120px"><b>' + m.rows.length + '</b><span>能力维度</span></div>' +
         '</div>';
    h += '<div class="callout-tip" style="margin-top:12px">💡 <b>面试话术建议</b>：不要说"我没做过产品"，而要说——' +
         '「我用运营的方式做过产品该做的事：定义用户问题、用数据验证假设、推动多方落地；' +
         '我现在在系统补齐的是需求取舍、PRD 表达和技术方案评估。」前半句建立可信度，后半句展示自我认知。</div>';
    h += '</div>';
    container.innerHTML = h;
  }

  /* ---------- Tab 2：判读题（复用答题引擎）---------- */
  function renderQuiz(container) {
    container.innerHTML = '';
    var inner = document.createElement('div');
    inner.id = 'aipmQuizHost';
    container.appendChild(inner);
    QuizModule.mount(inner, {
      ns: NS_QUIZ, type: 'single', title: 'AI 产品经理判读', suffix: '能力训练',
      sub: 'AI 适用性 / 需求优先级 / 验收标准 / 技术选型 / 幻觉治理 / 成本测算 / PRD 结构 / 转型路径',
      data: AIPM_QUIZZES, meta: AIPM_META
    });
  }

  /* ---------- Tab 3：PRD 工坊 ---------- */
  function renderPrdList() {
    var box = document.getElementById('prdList');
    if (!box) return;
    var h = '';
    AIPM_PRD_TASKS.forEach(function (t, i) {
      var done = TP.isOpenDone(NS_PRD, t.id);
      h += '<div class="qitem' + (curPrd && curPrd.id === t.id ? ' on' : '') + '" data-prdid="' + t.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(t.title) + '">' + esc(t.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { selectPrd(el.getAttribute('data-prdid')); };
    });
  }

  function selectPrd(id) {
    for (var i = 0; i < AIPM_PRD_TASKS.length; i++) if (AIPM_PRD_TASKS[i].id === id) { curPrd = AIPM_PRD_TASKS[i]; break; }
    renderPrdList(); renderPrd();
  }

  function renderPrd() {
    var box = document.getElementById('prdMain');
    if (!box || !curPrd) return;
    var done = TP.isOpenDone(NS_PRD, curPrd.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(curPrd.tag) + '</span><span>' + esc(curPrd.icon) + ' ' + esc(curPrd.title) + '</span>';
    if (done) h += '<span class="badge on">已完成</span>';
    h += '</div>';
    h += '<div class="qctx" style="white-space:normal;border-left-color:var(--mc)">' + nl(curPrd.ctx) + '</div>';
    h += '<div class="card" style="margin:10px 0;padding:11px 14px"><div style="font-size:12px;color:var(--text2);line-height:1.85"><b style="color:var(--mc)">要交付</b>　' + esc(curPrd.deliverable) + '</div></div>';

    h += '<div class="sec-t">我的 PRD（分模块填写，写下来才算练过）</div>';
    curPrd.fields.forEach(function (f) {
      h += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:5px">' + esc(f.label) + '</div>' +
           '<div class="editor" style="margin:0"><textarea id="prd_' + f.k + '" style="min-height:88px;color:var(--text)" placeholder="' + esc(f.ph) + '">' +
           esc(TP.getNote(NS_PRD, curPrd.id + '_' + f.k)) + '</textarea></div></div>';
    });
    h += '<div class="row"><button class="btn primary" id="prdSave">💾 保存</button>' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="prdDone" style="' + (done ? '' : 'background:linear-gradient(135deg,var(--green),#10b981)') + '">' +
         (done ? '✅ 已完成（点击取消）' : '✅ 标记为已完成') + '</button></div>';

    /* 参考 PRD */
    h += '<details class="acc answer" style="margin-top:14px"><summary>📖 参考答案 · 参考 PRD</summary><div class="accbody">';
    curPrd.fields.forEach(function (f) {
      var ref = curPrd.reference[f.k] || '';
      h += '<div style="margin:10px 0;padding:10px 12px;background:rgba(255,255,255,0);background:var(--bg2);border-radius:9px;border-left:3px solid var(--purple)">';
      h += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:5px">' + esc(f.label) + '</div>';
      h += '<div style="font-size:12px;color:var(--text2);line-height:1.85;white-space:pre-wrap">' + esc(ref) + '</div>';
      h += '</div>';
    });
    if (curPrd.pitfalls) {
      h += '<div style="margin-top:12px"><b style="color:var(--red);font-size:12px">⚠️ 常见错误</b><div style="font-size:12px;line-height:1.9;color:var(--text2);margin-top:5px">';
      curPrd.pitfalls.forEach(function (p) { h += '· ' + esc(p) + '<br>'; });
      h += '</div></div>';
    }
    h += '</div></details>';
    if (curPrd.takeaway) {
      h += '<div class="callout-tip" style="margin-top:10px">💡 <b>一句话记住</b>　' + esc(curPrd.takeaway) + '</div>';
    }
    box.innerHTML = h;

    curPrd.fields.forEach(function (f) {
      var ta = document.getElementById('prd_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS_PRD, curPrd.id + '_' + f.k, ta.value); });
    });
    document.getElementById('prdSave').onclick = function () {
      curPrd.fields.forEach(function (f) {
        var ta = document.getElementById('prd_' + f.k);
        if (ta) TP.setNote(NS_PRD, curPrd.id + '_' + f.k, ta.value);
      });
      toast('已保存（存在你的浏览器）');
    };
    document.getElementById('prdDone').onclick = function () {
      curPrd.fields.forEach(function (f) {
        var ta = document.getElementById('prd_' + f.k);
        if (ta) TP.setNote(NS_PRD, curPrd.id + '_' + f.k, ta.value);
      });
      var now = !TP.isOpenDone(NS_PRD, curPrd.id);
      TP.markOpen(NS_PRD, curPrd.id, now);
      toast(now ? '已标记完成 ✅' : '已取消');
      renderPrdList(); renderPrd(); refreshStats();
    };
  }

  function renderPrdWorkshop(container) {
    container.innerHTML =
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">PRD 练习</div><div class="qlist" id="prdList"></div></div>' +
        '<div><div class="pane" id="prdMain"></div></div>' +
      '</div>';
    if (!curPrd) {
      var first = null;
      for (var i = 0; i < AIPM_PRD_TASKS.length; i++) { if (!TP.isOpenDone(NS_PRD, AIPM_PRD_TASKS[i].id)) { first = AIPM_PRD_TASKS[i]; break; } }
      curPrd = first || AIPM_PRD_TASKS[0];
    }
    renderPrdList(); renderPrd();
  }

  /* ---------- Tab 4：面试题库 ---------- */
  var curIv = null;

  function ivList() {
    var box = document.getElementById('ivList');
    if (!box) return;
    var h = '', last = '';
    AIPM_INTERVIEW.forEach(function (it, i) {
      if (it.cat !== last) { last = it.cat; h += '<div class="lvhead">' + esc(it.cat) + '</div>'; }
      var done = TP.isOpenDone('interview', it.id);
      h += '<div class="qitem' + (curIv && curIv.id === it.id ? ' on' : '') + '" data-ivid="' + it.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(it.q) + '">' + (it.hot ? '🔥 ' : '') + esc(it.q) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { selectIv(el.getAttribute('data-ivid')); };
    });
  }

  function selectIv(id) {
    for (var i = 0; i < AIPM_INTERVIEW.length; i++) if (AIPM_INTERVIEW[i].id === id) { curIv = AIPM_INTERVIEW[i]; break; }
    ivList(); renderIv();
  }

  function renderIv() {
    var box = document.getElementById('ivMain');
    if (!box || !curIv) return;
    var it = curIv, done = TP.isOpenDone('interview', it.id);
    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(it.cat) + '</span>' + (it.hot ? '<span class="badge l5">🔥 高频</span>' : '') +
         (done ? '<span class="badge on">已准备</span>' : '') + '</div>';
    h += '<div class="card" style="padding:14px 16px;border-left:3px solid var(--mc)"><div style="font-size:14px;font-weight:700;color:var(--text);line-height:1.7">' +
         esc(it.q) + '</div></div>';

    h += '<div class="qctx" style="border-left-color:var(--orange);background:rgba(217,119,6,.07);margin-top:10px">🎯 <b>考察意图</b>　' + esc(it.intent) + '</div>';

    h += '<div class="sec-t">🧭 回答框架（按这个顺序说）</div><div class="card" style="padding:12px 15px">';
    h += '<div style="font-size:12.5px;line-height:2;color:var(--text2)">';
    it.frame.forEach(function (f, i) { h += '<div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--mc);font-weight:800">' + (i + 1) + '</span><span>' + esc(f) + '</span></div>'; });
    h += '</div></div>';

    h += '<div class="sec-t">📌 参考要点</div><div class="card" style="padding:12px 15px"><div style="font-size:12.5px;line-height:2;color:var(--text2)">';
    it.points.forEach(function (p) {
      h += '<div style="margin-bottom:6px">· ' + esc(p).replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--text)">$1</b>').replace(/`(.+?)`/g, '<code class="ic">$1</code>') + '</div>';
    });
    h += '</div></div>';

    if (it.good) h += '<div class="verdict ok" style="margin-top:12px"><b>✅ 加分说法</b><br>' + esc(it.good).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</div>';
    if (it.bad) h += '<div class="verdict bad"><b>✗ 减分说法</b><br>' + esc(it.bad) + '</div>';

    h += '<div class="row" style="margin-top:14px">' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="ivDone" style="' + (done ? '' : 'background:linear-gradient(135deg,var(--green),#10b981)') + '">' +
         (done ? '✅ 已准备（点击取消）' : '✅ 标记为已准备') + '</button>' +
         '<span class="muted">建议先自己口头说一遍，再看参考要点对照</span></div>';

    box.innerHTML = h;
    document.getElementById('ivDone').onclick = function () {
      var now = !TP.isOpenDone('interview', it.id);
      TP.markOpen('interview', it.id, now);
      toast(now ? '已标记 ✅' : '已取消');
      ivList(); renderIv(); refreshStats();
    };
  }

  function renderInterview(container) {
    container.innerHTML =
      '<div class="card" style="margin-bottom:12px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.85">💡 ' + esc(AIPM_INTERVIEW_META.intro) + '</div></div>' +
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">题目导航</div><div class="qlist" id="ivList"></div></div>' +
        '<div><div class="pane" id="ivMain"></div></div>' +
      '</div>';
    if (!curIv) {
      var first = null;
      for (var i = 0; i < AIPM_INTERVIEW.length; i++) { if (!TP.isOpenDone('interview', AIPM_INTERVIEW[i].id)) { first = AIPM_INTERVIEW[i]; break; } }
      curIv = first || AIPM_INTERVIEW[0];
    }
    ivList(); renderIv();
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    var el = document.getElementById('aipmStats');
    if (!el) return;
    var qs = TP.quizStats(NS_QUIZ, AIPM_QUIZZES.length);
    var prdDone = 0;
    AIPM_PRD_TASKS.forEach(function (t) { if (TP.isOpenDone(NS_PRD, t.id)) prdDone++; });
    var ivDone = 0;
    if (typeof AIPM_INTERVIEW !== 'undefined') {
      AIPM_INTERVIEW.forEach(function (t) { if (TP.isOpenDone('interview', t.id)) ivDone++; });
    }
    var ivTot = (typeof AIPM_INTERVIEW !== 'undefined') ? AIPM_INTERVIEW.length : 0;
    el.innerHTML =
      '<div class="stat cy"><b>' + qs.done + '<span style="font-size:12px;color:var(--text3)">/' + qs.total + '</span></b><span>判读题已通过</span></div>' +
      '<div class="stat am"><b>' + prdDone + '<span style="font-size:12px;color:var(--text3)">/' + AIPM_PRD_TASKS.length + '</span></b><span>PRD 已完成</span></div>' +
      '<div class="stat em"><b>' + ivDone + '<span style="font-size:12px;color:var(--text3)">/' + ivTot + '</span></b><span>面试题已准备</span></div>' +
      '<div class="stat vi"><b>8</b><span>能力维度对照</span></div>';
  }

  /* ---------- 挂载 ---------- */
  function mount(hostEl) {
    host = hostEl;
    host.innerHTML =
      '<div class="h1"><span class="grad">AI 产品经理</span> · 运营转型专项</div>' +
      '<div class="sub">面向互联网行业的 AI PM 岗位 · 判读题自动判分 · PRD 工坊开放练习 · 含「运营→产品」能力迁移对照</div>' +
      '<div class="ans-tip">✅ <b>答案怎么看</b>　每道题下方都有<b>绿色「参考答案 ·」折叠区</b>，点开即可查看参考解 / 参考结论 / 逐点讲解；先自己想一遍再看效果最好。</div>' +
      '<div class="stats" id="aipmStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.85">💡 ' + esc(AIPM_META.intro) + '</div></div>' +
      '<div class="row" style="gap:6px;margin-bottom:12px">' +
        '<button class="btn primary" data-tab="map">① 能力对照</button>' +
        '<button class="btn" data-tab="quiz">② 判读题</button>' +
        '<button class="btn" data-tab="prd">③ PRD 工坊</button>' +
        '<button class="btn" data-tab="iv">④ 面试题库</button>' +
      '</div>' +
      '<div id="aipmPanel"></div>';

    var panel = document.getElementById('aipmPanel');
    function show(tab) {
      Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
        b.className = 'btn' + (b.getAttribute('data-tab') === tab ? ' primary' : '');
      });
      if (tab === 'quiz') renderQuiz(panel);
      else if (tab === 'prd') renderPrdWorkshop(panel);
      else if (tab === 'iv') renderInterview(panel);
      else renderSkillMap(panel);
      refreshStats();
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
      b.onclick = function () { show(b.getAttribute('data-tab')); };
    });
    show('map');
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
