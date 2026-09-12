/* Python 实算 · 交互模块 */
var PythonModule = (function () {
  var cur = null, started = false;

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
  function draftKey(id) { return 'tp_py_' + id; }

  /* ---------- 列表 ---------- */
  function renderList() {
    var box = document.getElementById('pyList');
    if (!box) return;
    var h = '';
    PY_TASKS.forEach(function (t, i) {
      var rec = TP.quizGet('python', t.id);
      var dot = 'd';
      if (rec && rec.ok) dot += ' ok';
      else if (rec && rec.tries > 0) dot += ' bad';
      h += '<div class="qitem' + (cur && cur.id === t.id ? ' on' : '') + '" data-pyid="' + t.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(t.title) + '">' + esc(t.title) + '</span>' +
           '<span class="' + dot + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-pyid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < PY_TASKS.length; i++) if (PY_TASKS[i].id === id) { cur = PY_TASKS[i]; break; }
    renderList(); renderTask();
  }

  /* ---------- 任务 ---------- */
  function renderTask() {
    var box = document.getElementById('pyMain');
    if (!box || !cur) return;
    var saved = localStorage.getItem(draftKey(cur.id));
    var code = saved !== null ? saved : cur.starter;
    var rec = TP.quizGet('python', cur.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span>' +
         '<span class="badge l' + (cur.level === '基础' ? '1' : '4') + '">' + esc(cur.level) + '</span>' +
         '<span>' + esc(cur.title) + '</span>';
    if (rec && rec.ok) h += '<span class="badge on">已通过</span>';
    h += '</div>';
    h += '<div class="qctx" style="white-space:normal">' + nl(cur.ctx) + '</div>';
    h += '<div class="card" style="margin:10px 0;padding:11px 14px;border-left:3px solid var(--mc)"><div style="font-size:12.5px;color:var(--text);line-height:1.8">' +
         '<b style="color:var(--mc)">任务</b>　' + nl(cur.task) + '</div></div>';

    h += '<div class="sec-t">代码编辑区</div>';
    h += '<div class="editor"><textarea id="pyEd" spellcheck="false" style="min-height:280px">' + esc(code) + '</textarea></div>';
    h += '<div class="row"><button class="btn primary" id="pyRun">▶ 运行并判分 (Ctrl+Enter)</button>' +
         '<button class="btn" id="pyResetCode">恢复初始模板</button>' +
         '<span class="muted" id="pyInfo"></span></div>';
    h += '<div id="pyVerdict"></div>';
    h += '<div id="pyOut" style="margin-top:10px"></div>';
    h += '<details class="acc"><summary>💡 提示</summary><div class="accbody">' + esc(cur.hint) + '</div></details>';
    h += '<details class="acc"><summary>✅ 参考解 + 业务解读</summary><div class="accbody">' +
         '<pre class="code">' + esc(cur.sol) + '</pre>' +
         '<div style="margin-top:9px"><b>业务含义：</b>' + esc(cur.why) + '</div></div></details>';
    box.innerHTML = h;

    var ed = document.getElementById('pyEd');
    ed.addEventListener('input', function () { localStorage.setItem(draftKey(cur.id), ed.value); });
    ed.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doRun(); }
      if (e.key === 'Tab') { e.preventDefault();
        var s = ed.selectionStart, en = ed.selectionEnd;
        ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(en);
        ed.selectionStart = ed.selectionEnd = s + 4;
      }
    });
    document.getElementById('pyResetCode').onclick = function () {
      ed.value = cur.starter; localStorage.setItem(draftKey(cur.id), cur.starter);
    };
    document.getElementById('pyRun').onclick = doRun;
  }

  function doRun() {
    if (!cur) return;
    var ed = document.getElementById('pyEd');
    var vBox = document.getElementById('pyVerdict');
    var oBox = document.getElementById('pyOut');
    var info = document.getElementById('pyInfo');
    if (!started || !PyRunner.isReady()) { toast('Python 环境还没启动，请先点上方「启动 Python 环境」'); return; }
    var code = ed.value;
    info.textContent = '运行中…';
    vBox.innerHTML = ''; oBox.innerHTML = '';

    /* 按题目声明准备依赖（pandas / scipy 首次使用时按需加载） */
    var pre = Promise.resolve();
    var needPandas = cur.needs && cur.needs.indexOf && cur.needs.indexOf('pandas') >= 0;
    var needScipy = cur.needs && cur.needs.indexOf && cur.needs.indexOf('scipy') >= 0;
    var miss = [];
    if (needPandas && !PyRunner.isPandasReady()) miss.push('pandas（约 23MB）');
    if (needScipy && !PyRunner.isScipyReady()) miss.push('scipy（约 30MB）');
    if (miss.length) {
      vBox.innerHTML = '<div class="verdict err"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> 本题需要 ' + miss.join(' + ') +
        '，正在加载，请稍候…<br><span class="muted">只需加载一次，之后同类题目都能直接跑。</span></div>';
      pre = PyRunner.ensureDeps(cur.needs, function (msg) {
        vBox.innerHTML = '<div class="verdict err"><span class="spin" style="display:inline-block;vertical-align:-3px"></span> ' + esc(msg) + '</div>';
      }).then(function () { vBox.innerHTML = ''; });
    }

    var t0 = performance.now();
    pre.then(function () { return Promise.all([PyRunner.run(code, cur.check), PyRunner.run(cur.sol, cur.check)]); }).then(function (arr) {
      var mine = arr[0], ref = arr[1];
      var ms = Math.round(performance.now() - t0);
      info.textContent = '耗时 ' + ms + 'ms';

      if (!ref.ok) {
        vBox.innerHTML = '<div class="verdict err"><b>参考解执行失败（这是平台问题，请反馈）：</b><pre class="code" style="margin-top:6px">' + esc(ref.err || '') + '</pre></div>';
        return;
      }
      if (!mine.ok) {
        TP.markQuiz('python', cur.id, false, 0);
        renderList(); refreshStats();
        vBox.innerHTML = '<div class="verdict bad"><b>✗ 代码报错</b>' +
          '<pre class="code" style="margin-top:7px;white-space:pre-wrap">' + esc(mine.err || '') + '</pre>' +
          (mine.out ? '<div style="margin-top:6px"><b>输出：</b><pre class="code" style="white-space:pre-wrap">' + esc(mine.out) + '</pre></div>' : '') +
          '<div class="muted" style="margin-top:6px">看错误栈的最后一行，通常是变量名拼错或漏了某一步。已记入错题。</div></div>';
        return;
      }
      var cmp = PyRunner.compare(mine.val, ref.val);
      var rec = TP.markQuiz('python', cur.id, cmp.ok, cmp.ok ? 100 : 0);
      renderList(); refreshStats();

      var out = '';
      if (mine.out) out += '<div class="sec-t">程序输出</div><div class="py-out">' + esc(mine.out) + '</div>';
      out += '<div class="sec-t">你的结果（answer 变量）</div><div class="py-out">' + esc(mine.val) + '</div>';
      if (!cmp.ok) out += '<div class="sec-t">参考答案的结果</div><div class="py-out">' + esc(ref.val) + '</div>';
      oBox.innerHTML = out;

      vBox.innerHTML = cmp.ok
        ? '<div class="verdict ok"><b>✅ 通过！</b>' + esc(cmp.reason) + '　耗时 ' + ms + 'ms（第 ' + rec.tries + ' 次尝试' + (rec.firstTry ? ' · 一次做对 👏' : '') + '）</div>'
        : '<div class="verdict bad"><b>✗ 结果不对：</b>' + esc(cmp.reason) +
          '<br><span class="muted">对照下方「你的结果」与「参考答案的结果」，检查口径（比如该用 nunique 还是 count、要不要排除最后一天）。</span></div>';
    }).catch(function (e) {
      vBox.innerHTML = '<div class="verdict err"><b>运行失败：</b>' + esc(e.message || e) + '</div>';
      info.textContent = '';
    });
  }

  function refreshStats() {
    var el = document.getElementById('pyStats');
    if (!el) return;
    var s = TP.quizStats('python', PY_TASKS.length);
    var env = started && PyRunner.isReady()
      ? '<span style="color:var(--green)">已启动</span>'
      : '<span style="color:var(--text3)">未启动</span>';
    el.innerHTML =
      '<div class="stat cy"><b>' + s.done + '<span style="font-size:12px;color:var(--text3)">/' + s.total + '</span></b><span>已通过</span></div>' +
      '<div class="stat em"><b>' + s.mastery + '%</b><span>一次做对率</span></div>' +
      '<div class="stat am"><b>' + s.tries + '</b><span>累计尝试</span></div>' +
      '<div class="stat vi"><b style="font-size:13px">' + env + '</b><span>Python 环境</span></div>';
  }

  /* ---------- 启动环境 ---------- */
  function startEnv() {
    var box = document.getElementById('pyEnv');
    if (!box) return;
    box.innerHTML = '<div class="py-status"><span class="spin"></span><span id="pyMsg">正在准备…</span>' +
      '<span class="py-progress"><i id="pyBar"></i></span></div>';
    PyRunner.init(function (msg, pct) {
      var m = document.getElementById('pyMsg'), b = document.getElementById('pyBar');
      if (m) m.textContent = msg;
      if (b && pct) b.style.width = pct + '%';
    }).then(function () {
      started = true;
      box.innerHTML = '<div class="py-status" style="border-color:var(--green);background:rgba(5,150,105,.07)">' +
        '<span style="color:var(--green);font-weight:800">✅ Python 环境已就绪</span>' +
        '<span class="muted">pandas + scipy 已加载，数据集已导入（users/events/orders/channels 四个 DataFrame 直接可用）</span></div>';
      refreshStats();
      renderTask();
    }).catch(function (e) {
      box.innerHTML = '<div class="verdict err"><b>❌ 环境启动失败：</b>' + esc(e.message || e) +
        '<br><span class="muted">需要联网下载 Python 运行时（约 30MB）。请检查网络后重试，或先练其它模块。</span></div>';
    });
  }

  /* ---------- 挂载 ---------- */
  function mount(host) {
    var firstUndone = null;
    for (var i = 0; i < PY_TASKS.length; i++) { if (!TP.quizGet('python', PY_TASKS[i].id) || !TP.quizGet('python', PY_TASKS[i].id).ok) { firstUndone = PY_TASKS[i]; break; } }
    cur = firstUndone || PY_TASKS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">Python 实算</span> · 数据分析与统计检验</div>' +
      '<div class="sub">浏览器内跑真实 Python（Pyodide + pandas + scipy）· 无需安装环境 · 自动比对 answer 变量</div>' +
      '<div class="stats" id="pyStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:12px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.85">💡 ' + PY_META.intro + '</div></div>' +
      '<div id="pyEnv" style="margin-bottom:14px">' +
        '<div class="py-status">' +
          '<span>🐍 ' + esc(PY_META.loadNote) + '</span>' +
          '<button class="btn primary" id="pyStart" style="margin-left:auto">▶ 启动 Python 环境</button>' +
        '</div>' +
      '</div>' +
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">任务列表</div><div class="qlist" id="pyList"></div></div>' +
        '<div><div class="pane" id="pyMain"></div></div>' +
      '</div>';

    renderList(); renderTask(); refreshStats();

    document.getElementById('pyStart').onclick = startEnv;

    /* 如果已在本会话启动过，直接复用 */
    if (PyRunner.isReady()) {
      started = true;
      document.getElementById('pyEnv').innerHTML = '<div class="py-status" style="border-color:var(--green);background:rgba(5,150,105,.07)">' +
        '<span style="color:var(--green);font-weight:800">✅ Python 环境已就绪</span>' +
        '<span class="muted">pandas + scipy 已加载，数据集已导入</span></div>';
      renderTask(); refreshStats();
    }
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
