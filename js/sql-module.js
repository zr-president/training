/* SQL 训练场 · 交互模块 */
var SQLModule = (function () {
  var cur = null;           /* 当前题目 */
  var hostEl = null;
  var engineReady = false;

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function levelBadge(level) {
    var lv = SQL_LEVELS[level] || { name: 'L' + level };
    return '<span class="badge l' + level + '">L' + level + ' · ' + esc(lv.name) + '</span>';
  }
  function resultTable(res, maxRows) {
    if (!res || !res.cols || !res.cols.length) {
      return '<div class="muted" style="padding:12px">（无结果）</div>';
    }
    var lim = maxRows || 200;
    var h = '<div class="tblwrap"><table class="dg"><thead><tr>';
    res.cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    res.rows.slice(0, lim).forEach(function (r) {
      h += '<tr>';
      r.forEach(function (v) {
        if (v === null) h += '<td class="nullv">NULL</td>';
        else if (typeof v === 'number') h += '<td>' + (Number.isInteger(v) ? v : (Math.round(v * 1000) / 1000)) + '</td>';
        else h += '<td>' + esc(v) + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    if (res.rows.length > lim) h += '<div class="muted" style="margin-top:6px">仅展示前 ' + lim + ' 行，共 ' + res.rows.length + ' 行</div>';
    else h += '<div class="muted" style="margin-top:6px">共 ' + res.rows.length + ' 行 · ' + res.cols.length + ' 列</div>';
    return h;
  }

  /* ---------- 左侧题目列表 ---------- */
  function renderList() {
    var box = document.getElementById('qlist');
    if (!box) return;
    var h = '', lastLv = 0;
    SQL_QUESTIONS.forEach(function (q, i) {
      if (q.level !== lastLv) {
        lastLv = q.level;
        h += '<div class="lvhead">L' + q.level + ' · ' + esc((SQL_LEVELS[q.level] || {}).name || '') + '</div>';
      }
      var st = TP.get(q.id);
      var dot = 'd';
      if (st && st.ok) dot += ' ok'; else if (st && !st.ok && st.tries > 0) dot += ' bad';
      h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-qid="' + q.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(q.title) + '">' + esc(q.title) + '</span>' +
           '<span class="' + dot + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-qid')); };
    });
  }

  function select(qid) {
    for (var i = 0; i < SQL_QUESTIONS.length; i++) if (SQL_QUESTIONS[i].id === qid) { cur = SQL_QUESTIONS[i]; break; }
    renderList(); renderQuestion();
  }

  /* ---------- 右侧题目区 ---------- */
  function renderQuestion() {
    var box = document.getElementById('qmain');
    if (!box || !cur) return;
    var saved = localStorage.getItem('tp_sql_' + cur.id) || '';
    var h = '';
    h += '<div class="qtitle">' + levelBadge(cur.level) + '<span>' + esc(cur.title) + '</span></div>';
    h += '<div class="qctx"><b>业务背景</b><br>' + esc(cur.ctx) + '<br><b>要算什么</b><br>' + esc(cur.task) + '</div>';
    h += '<div class="editor"><textarea id="sqlEd" spellcheck="false" placeholder="在这里写 SQL…&#10;&#10;提示：Ctrl + Enter 运行">' + esc(saved) + '</textarea></div>';
    h += '<div class="row">' +
         '<button class="btn primary" id="btnRun">▶ 运行并判分 (Ctrl+Enter)</button>' +
         '<button class="btn" id="btnClear">清空</button>' +
         '<span class="muted" id="runInfo"></span></div>';
    h += '<div id="verdictBox"></div>';
    h += '<details class="acc"><summary>💡 提示（先自己想，卡住再看）</summary><div class="accbody">' + esc(cur.hint) + '</div></details>';
    h += '<details class="acc answer" id="accSol"><summary>✅ 参考答案 · SQL 参考解 + 业务解读</summary><div class="accbody">' +
         '<pre class="code">' + esc(cur.solution) + '</pre>' +
         '<div style="margin-top:9px"><b>业务含义：</b>' + esc(cur.why) + '</div></div></details>';
    h += '<div class="sec-t" style="margin-top:16px">运行结果</div><div id="resBox"><div class="muted">还没有运行。写好 SQL 后按「运行并判分」。</div></div>';
    box.innerHTML = h;

    var ed = document.getElementById('sqlEd');
    ed.addEventListener('input', function () { localStorage.setItem('tp_sql_' + cur.id, ed.value); });
    ed.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doRun(); }
      if (e.key === 'Tab') { e.preventDefault();
        var s = ed.selectionStart, en = ed.selectionEnd;
        ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(en); ed.selectionStart = ed.selectionEnd = s + 2;
      }
    });
    document.getElementById('btnRun').onclick = doRun;
    document.getElementById('btnClear').onclick = function () { ed.value = ''; localStorage.setItem('tp_sql_' + cur.id, ''); ed.focus(); };
  }

  /* ---------- 运行 + 判分 ---------- */
  function doRun() {
    if (!cur) return;
    var ed = document.getElementById('sqlEd');
    var verdict = document.getElementById('verdictBox');
    var resBox = document.getElementById('resBox');
    var info = document.getElementById('runInfo');
    var sql = ed.value.trim();
    if (!sql) { toast('请先写 SQL'); return; }

    var t0 = performance.now();
    var mine, ref;
    try { mine = SQLRunner.run(sql); }
    catch (e) {
      verdict.innerHTML = '<div class="verdict err"><b>❌ SQL 报错：</b>' + esc(e.message || e) + '</div>';
      resBox.innerHTML = '<div class="muted">数据库没有返回结果。</div>';
      TP.mark(cur.id, false); renderList(); refreshStats();
      return;
    }
    var ms = Math.round(performance.now() - t0);
    try { ref = SQLRunner.run(cur.solution); }
    catch (e) { ref = { cols: [], rows: [], noResult: true }; }

    var cmp = SQLRunner.compare(mine, ref, !!cur.order);
    var rec = TP.mark(cur.id, cmp.ok);
    renderList(); refreshStats();

    if (cmp.ok) {
      verdict.innerHTML = '<div class="verdict ok"><b>✅ 通过！</b>' + esc(cmp.reason) +
        '　耗时 ' + ms + 'ms（第 ' + rec.tries + ' 次尝试' + (rec.firstTry ? ' · 一次做对 👏' : '') + '）' +
        (rec.firstTry ? '' : '<br><span class="muted">⚠️ 本题不是一次做对——建议过几天重做一次，确认真的掌握。</span>') + '</div>';
    } else {
      verdict.innerHTML = '<div class="verdict bad"><b>✗ 还没通过：</b>' + esc(cmp.reason) +
        '<br><span class="muted">提示：先看下方「你的结果」和「正确答案」的差异在哪，再改 SQL。本题已记入错题本。</span></div>';
    }

    var rh = '<div style="font-size:11px;color:var(--txt3);margin:8px 0 4px;letter-spacing:.5px">你的结果</div>' + resultTable(mine);
    if (!cmp.ok) rh += '<div style="font-size:11px;color:var(--txt3);margin:14px 0 4px;letter-spacing:.5px">正确答案（参考解结果 · 列名可能与你不同，不影响判分）</div>' + resultTable(ref);
    resBox.innerHTML = rh;
    info.textContent = '已运行 ' + ms + 'ms';
  }

  function refreshStats() {
    var s = TP.stats(SQL_QUESTIONS.length);
    var el = document.getElementById('sqlStats');
    if (!el) return;
    el.innerHTML =
      '<div class="stat cy"><b>' + s.done + '<span style="font-size:12px;color:var(--txt3)">/' + s.total + '</span></b><span>已完成题目</span></div>' +
      '<div class="stat em"><b>' + s.mastery + '%</b><span>一次做对率（真实掌握度）</span></div>' +
      '<div class="stat am"><b>' + s.tries + '</b><span>累计尝试次数</span></div>' +
      '<div class="stat vi"><b>' + TP.wrongList().length + '</b><span>错题本待重做</span></div>';
  }

  /* ---------- 数据集浏览 ---------- */
  function remountDataset() {
    var box = document.getElementById('dsBox');
    if (!box) return;
    if (!engineReady) { box.innerHTML = '<div class="loading"><span class="spin"></span>引擎未就绪…</div>'; return; }
    var h = '';
    if (typeof DATASET_META !== 'undefined') {
      h += '<div class="muted" style="margin-bottom:10px;white-space:pre-line">' + esc(DATASET_META.note) + '</div>';
      h += '<div class="dsgrid">';
      DATASET_META.tables.forEach(function (t) {
        h += '<div class="dscard"><b>' + esc(t.name) + '</b> <span class="r">' + t.rows + ' 行</span><p>' + esc(t.desc) + '</p></div>';
      });
      h += '</div>';
    }
    ['users', 'events', 'orders', 'channels'].forEach(function (tb) {
      try {
        var r = SQLRunner.preview(tb, 6);
        h += '<div class="sec-t">' + tb + '（前 6 行）</div>' + resultTable(r, 6);
      } catch (e) { h += '<div class="sec-t">' + tb + '</div><div class="muted">读取失败：' + esc(e.message) + '</div>'; }
    });
    box.innerHTML = h;
  }

  /* ---------- 错题本 ---------- */
  function remountWrong() {
    var box = document.getElementById('wrongBox');
    if (!box) return;
    var ids = TP.wrongList();
    if (!ids.length) { box.innerHTML = '<div class="muted">暂无错题。做错的题会自动进入这里，建议隔几天重做一遍。</div>'; return; }
    var h = '<div class="row" style="gap:8px">';
    ids.forEach(function (id) {
      var q = null;
      for (var i = 0; i < SQL_QUESTIONS.length; i++) if (SQL_QUESTIONS[i].id === id) q = SQL_QUESTIONS[i];
      if (!q) return;
      h += '<button class="btn sm" data-goto="' + id + '">' + esc(q.title) + '</button>';
    });
    h += '</div><div class="muted" style="margin-top:9px">点击可跳转重做。全部做对后会自动从错题本移除。</div>';
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('[data-goto]'), function (b) {
      b.onclick = function () {
        select(b.getAttribute('data-goto'));
        var t = document.getElementById('qmain');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  /* ---------- 挂载 ---------- */
  function mount(host) {
    hostEl = host;
    var firstUndone = null;
    for (var i = 0; i < SQL_QUESTIONS.length; i++) { if (!TP.isDone(SQL_QUESTIONS[i].id)) { firstUndone = SQL_QUESTIONS[i]; break; } }
    cur = firstUndone || SQL_QUESTIONS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">SQL 训练场</span> · 用户增长</div>' +
      '<div class="sub">在浏览器里跑真实 SQLite · 20 道题分 5 个难度层 · 自动判分 · 错题本 · 参考解附业务解读</div>' +
      '<div class="ans-tip">✅ <b>答案怎么看</b>　每道题下方都有<b>绿色「参考答案 ·」折叠区</b>，点开即可查看参考解 / 参考结论 / 逐点讲解；先自己想一遍再看效果最好。</div>' +
      '<div class="stats" id="sqlStats" style="margin-bottom:16px"></div>' +
      '<div id="engineStatus" class="loading"><span class="spin"></span>正在加载 SQL 引擎…</div>' +
      '<div class="lab" id="lab" style="display:none">' +
        '<div><div class="sec-t" style="margin-top:0">题目导航</div><div class="qlist" id="qlist"></div></div>' +
        '<div><div class="pane" id="qmain"></div>' +
          '<details class="acc" style="margin-top:12px"><summary>🗄️ 数据集结构（写 SQL 时随时查）</summary><div class="accbody" id="dsBox"></div></details>' +
          '<details class="acc" style="margin-top:8px"><summary>📕 错题本</summary><div class="accbody" id="wrongBox"></div></details>' +
        '</div>' +
      '</div>';

    renderList(); renderQuestion(); refreshStats(); remountWrong();

    SQLRunner.init(function (msg) {
      var st = document.getElementById('engineStatus');
      if (!st) return;
      if (msg) st.innerHTML = '<span class="spin"></span>' + esc(msg);
      else st.style.display = 'none';
    }).then(function () {
      engineReady = true;
      var lab = document.getElementById('lab'); if (lab) lab.style.display = '';
      var st = document.getElementById('engineStatus'); if (st) st.style.display = 'none';
      remountDataset();
      var rb = document.getElementById('wrongBox');
      if (rb) remountWrong();
      var ed = document.getElementById('sqlEd');
      if (ed) ed.focus();
    }).catch(function (e) {
      engineReady = false;
      var st = document.getElementById('engineStatus');
      if (st) st.innerHTML = '<div class="verdict err"><b>❌ SQL 引擎加载失败：</b>' + esc(e.message || e) +
        '<br><span class="muted">本模块需要联网加载 sql.js（CDN）。请检查网络后刷新。</span></div>';
    });
  }

  function onShow() { remountWrong(); refreshStats(); }

  return { mount: mount, onShow: onShow, select: select };
})();
