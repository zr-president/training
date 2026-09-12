/* 数据集实验室 · 交互模块（业务问题驱动，无唯一答案） */
var LabModule = (function () {
  var cur = null, engineReady = false;

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function resultTable(res, maxRows) {
    if (!res || !res.cols || !res.cols.length) return '<div class="muted" style="padding:12px">（无结果）</div>';
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
    h += '<div class="muted" style="margin-top:6px">共 ' + res.rows.length + ' 行 · ' + res.cols.length + ' 列</div>';
    return h;
  }

  /* ---------- 列表 ---------- */
  function renderList() {
    var box = document.getElementById('labList');
    if (!box) return;
    var h = '';
    LAB_QUESTIONS.forEach(function (q, i) {
      var done = TP.isLabDone(q.id);
      h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-lid="' + q.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(q.title) + '">' + esc(q.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-lid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < LAB_QUESTIONS.length; i++) if (LAB_QUESTIONS[i].id === id) { cur = LAB_QUESTIONS[i]; break; }
    renderList(); renderQuestion();
  }

  /* ---------- 题目 ---------- */
  function renderQuestion() {
    var box = document.getElementById('labMain');
    if (!box || !cur) return;
    var saved = localStorage.getItem('tp_lab_sql_' + cur.id) || '';
    var note = TP.labNote(cur.id);
    var done = TP.isLabDone(cur.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span><span>' + esc(cur.icon) + ' ' + esc(cur.title) + '</span></div>';

    /* 业务问题卡 */
    h += '<div class="qctx" style="border-left-color:var(--am);background:rgba(217,119,6,.07)">' +
         '<b>💼 业务问题</b><br>' + esc(cur.question) + '</div>';
    h += '<div class="card" style="margin:10px 0;padding:12px 14px">' +
         '<div style="font-size:12px;color:var(--txt2);line-height:1.8"><b style="color:var(--cy)">背景</b>　' + esc(cur.context) + '</div>' +
         '<div style="font-size:12px;color:var(--txt2);line-height:1.8;margin-top:7px"><b style="color:var(--em)">交付物</b>　' + esc(cur.deliverable) + '</div></div>';

    /* 分析步骤 */
    h += '<details class="acc"><summary>🧭 分析步骤提示（建议按步骤走，卡住再看）</summary><div class="accbody"><ol style="padding-left:20px;line-height:2">';
    cur.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol></div></details>';

    /* 探索区 */
    h += '<div class="sec-t">自由探索（没有标准答案，随便查）</div>';
    h += '<div class="editor"><textarea id="labEd" spellcheck="false" placeholder="在这里写 SQL 自己查数据…&#10;&#10;提示：Ctrl + Enter 运行">' + esc(saved) + '</textarea></div>';
    h += '<div class="row"><button class="btn primary" id="labRun">▶ 运行查询 (Ctrl+Enter)</button>' +
         '<button class="btn" id="labClear">清空</button>' +
         '<span class="muted" id="labInfo"></span></div>';
    h += '<div id="labRes" style="margin-top:10px"><div class="muted">还没有运行。</div></div>';

    /* 结论区 */
    h += '<div class="sec-t">我的结论（写下来才算真的分析过）</div>';
    h += '<div class="editor"><textarea id="labNote" style="min-height:110px;color:var(--txt)" placeholder="用 3-5 句话写结论：&#10;1) 关键数据是什么&#10;2) 你判断的原因&#10;3) 建议采取什么动作">' + esc(note) + '</textarea></div>';
    h += '<div class="row"><button class="btn primary" id="labSave">💾 保存结论</button>' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="labDone" style="' + (done ? '' : 'background:linear-gradient(135deg,var(--em),var(--green))') + '">' + (done ? '✅ 已完成（点击取消）' : '✅ 标记为已完成') + '</button></div>';

    /* 参考路径 */
    h += '<details class="acc" style="margin-top:14px"><summary>📖 参考分析路径（' + cur.queries.length + ' 步 · 含可运行 SQL 与关键发现）</summary><div class="accbody">';
    cur.queries.forEach(function (q, i) {
      h += '<div style="margin:10px 0;padding:10px 12px;background:var(--bg2);border-radius:9px;border-left:3px solid var(--vi)">';
      h += '<div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:6px">' + esc(q.t) + '</div>';
      h += '<pre class="code">' + esc(q.sql) + '</pre>';
      h += '<div style="font-size:11.5px;color:var(--em);line-height:1.75;margin-top:6px">🔍 ' + esc(q.finding) + '</div>';
      h += '<div style="margin-top:7px"><button class="btn sm" data-fill="' + i + '">填入编辑器运行 →</button></div>';
      h += '</div>';
    });
    h += '</div></details>';

    h += '<details class="acc"><summary>🎯 参考结论（先自己写，再对照）</summary><div class="accbody" style="border-left:3px solid var(--em);padding-left:12px">' + esc(cur.conclusion) + '</div></details>';

    box.innerHTML = h;

    var ed = document.getElementById('labEd');
    ed.addEventListener('input', function () { localStorage.setItem('tp_lab_sql_' + cur.id, ed.value); });
    ed.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doRun(); }
      if (e.key === 'Tab') { e.preventDefault();
        var s = ed.selectionStart, en = ed.selectionEnd;
        ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(en); ed.selectionStart = ed.selectionEnd = s + 2;
      }
    });
    document.getElementById('labRun').onclick = doRun;
    document.getElementById('labClear').onclick = function () { ed.value = ''; localStorage.setItem('tp_lab_sql_' + cur.id, ''); ed.focus(); };
    document.getElementById('labSave').onclick = function () {
      var n = document.getElementById('labNote').value;
      TP.markLab(cur.id, TP.isLabDone(cur.id), n);
      toast('结论已保存');
    };
    document.getElementById('labDone').onclick = function () {
      var n = document.getElementById('labNote').value;
      var now = !TP.isLabDone(cur.id);
      TP.markLab(cur.id, now, n);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats();
    };
    Array.prototype.forEach.call(box.querySelectorAll('[data-fill]'), function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-fill'), 10);
        ed.value = cur.queries[i].sql;
        localStorage.setItem('tp_lab_sql_' + cur.id, ed.value);
        ed.focus();
        doRun();
      };
    });
  }

  function doRun() {
    if (!cur) return;
    var ed = document.getElementById('labEd'), resBox = document.getElementById('labRes'), info = document.getElementById('labInfo');
    var sql = ed.value.trim();
    if (!sql) { toast('先写点 SQL'); return; }
    var t0 = performance.now();
    try {
      var r = SQLRunner.run(sql);
      var ms = Math.round(performance.now() - t0);
      resBox.innerHTML = resultTable(r);
      info.textContent = '耗时 ' + ms + 'ms';
    } catch (e) {
      resBox.innerHTML = '<div class="verdict err"><b>❌ SQL 报错：</b>' + esc(e.message || e) + '</div>';
      info.textContent = '';
    }
  }

  function refreshStats() {
    var s = TP.labStats(LAB_QUESTIONS.length);
    var el = document.getElementById('labStats');
    if (!el) return;
    el.innerHTML =
      '<div class="stat cy"><b>' + s.done + '<span style="font-size:12px;color:var(--txt3)">/' + s.total + '</span></b><span>已完成分析</span></div>' +
      '<div class="stat em"><b>' + s.pct + '%</b><span>完成度</span></div>' +
      '<div class="stat vi"><b>' + LAB_QUESTIONS.length + '</b><span>业务问题总数</span></div>' +
      '<div class="stat am"><b>0</b><span>标准答案（本来就没有）</span></div>';
  }

  /* ---------- 数据集导出（去 Python / Excel 练） ---------- */
  function exportCSV(table) {
    try {
      var r = SQLRunner.run('SELECT * FROM ' + table);
      var lines = [r.cols.join(',')];
      r.rows.forEach(function (row) {
        lines.push(row.map(function (v) {
          if (v === null) return '';
          var s = String(v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(','));
      });
      var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = table + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('已导出 ' + table + '.csv（可用 Python/pandas 或 Excel 打开）');
    } catch (e) { toast('导出失败：' + (e.message || e)); }
  }

  function mount(host) {
    var firstUndone = null;
    for (var i = 0; i < LAB_QUESTIONS.length; i++) { if (!TP.isLabDone(LAB_QUESTIONS[i].id)) { firstUndone = LAB_QUESTIONS[i]; break; } }
    cur = firstUndone || LAB_QUESTIONS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">数据集实验室</span> · 用户增长</div>' +
      '<div class="sub">给你业务问题，自己去数据里找答案 · 没有标准答案，但有参考分析路径 · 结论自己写、自己存</div>' +
      '<div class="stats" id="labStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.8">' +
      '💡 <b>和 SQL 训练场的区别</b>：训练场是「按需求写 SQL」（有唯一答案、自动判分）；这里是「给你一个业务问题，自己去数据里找答案」——<b>练的是分析思路，不是语法</b>。' +
      '<br>📤 想把数据拉到本地用 Python/Excel 练？' +
      '<button class="btn sm" data-exp="users" style="margin-left:6px">⬇ users.csv</button>' +
      '<button class="btn sm" data-exp="events">⬇ events.csv</button>' +
      '<button class="btn sm" data-exp="orders">⬇ orders.csv</button>' +
      '<button class="btn sm" data-exp="channels">⬇ channels.csv</button>' +
      '</div></div>' +
      '<div id="engineStatus" class="loading"><span class="spin"></span>正在加载 SQL 引擎…</div>' +
      '<div class="lab" id="labWrap" style="display:none">' +
        '<div><div class="sec-t" style="margin-top:0">业务问题</div><div class="qlist" id="labList"></div></div>' +
        '<div><div class="pane" id="labMain"></div></div>' +
      '</div>';

    renderList(); renderQuestion(); refreshStats();

    Array.prototype.forEach.call(host.querySelectorAll('[data-exp]'), function (b) {
      b.onclick = function () { exportCSV(b.getAttribute('data-exp')); };
    });

    SQLRunner.init(function (msg) {
      var st = document.getElementById('engineStatus');
      if (!st) return;
      if (msg) st.innerHTML = '<span class="spin"></span>' + esc(msg); else st.style.display = 'none';
    }).then(function () {
      engineReady = true;
      var w = document.getElementById('labWrap'); if (w) w.style.display = '';
      var st = document.getElementById('engineStatus'); if (st) st.style.display = 'none';
    }).catch(function (e) {
      var st = document.getElementById('engineStatus');
      if (st) st.innerHTML = '<div class="verdict err"><b>❌ SQL 引擎加载失败：</b>' + esc(e.message || e) + '</div>';
    });
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow, select: select };
})();
