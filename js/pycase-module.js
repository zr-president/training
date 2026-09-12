/* Python 数据分析案例 · 教学模块（案例代码 + 真实运行结果 + 逐点讲解） */
var PyCaseModule = (function () {
  var curCase = null, curTask = null;
  var NS = 'pycase';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  function copyText(txt, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('已复制' + (label || '')); },
        function () { toast('复制失败，请手动选中'); });
    } else { toast('浏览器不支持自动复制，请手动选中'); }
  }

  /* ---------- 轻量 Python 语法高亮（先 tokenize 再转义，避免嵌套替换出错） ---------- */
  var KW = 'import|from|as|def|return|for|in|if|elif|else|while|try|except|finally|with|lambda|not|and|or|is|None|True|False|print|pass|class|break|continue|global|nonlocal|yield|assert|del|raise';
  var TOKEN_RE = new RegExp(
    '(#[^\\n]*)' +                                   // 1 注释
    '|(\'\'\'[\\s\\S]*?\'\'\'|"""[\\s\\S]*?""")' +   // 2 三引号字符串
    '|(\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")' + // 3 普通字符串
    '|(\\b(?:' + KW + ')\\b)' +                      // 4 关键字
    '|(\\b\\d+(?:\\.\\d+)?\\b)',                     // 5 数字
    'g');

  function highlight(code) {
    var out = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'c-com' : (m[2] || m[3]) ? 'c-str' : m[4] ? 'c-kw' : 'c-num';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    out += esc(code.slice(last));
    return out;
  }

  /* 带行号的代码块 */
  function codeBlock(code, withLineNo) {
    var lines = code.replace(/\s+$/, '').split('\n');
    var html = '';
    lines.forEach(function (ln, i) {
      if (withLineNo !== false) html += '<span class="ln">' + String(i + 1).padStart(2, ' ') + '</span>';
      html += highlight(ln.replace(/\n$/, '')) + '\n';
    });
    return html;
  }

  /* ---------- Tab 1：常用案例 ---------- */
  function renderCaseList() {
    var box = document.getElementById('pycList');
    if (!box) return;
    var h = '', last = '';
    PY_CASES.forEach(function (c, i) {
      if (c.group !== last) { last = c.group; h += '<div class="lvhead">' + esc(c.group) + '</div>'; }
      var done = TP.isOpenDone(NS, c.id);
      var hot = (c.exam || []).some(function (t) { return /必考|最容易错/.test(t); });
      h += '<div class="qitem' + (curCase && curCase.id === c.id ? ' on' : '') + '" data-cid="' + c.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(c.title) + '">' + (hot ? '🔥 ' : '') + esc(c.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { selectCase(el.getAttribute('data-cid')); };
    });
  }

  function selectCase(id) {
    for (var i = 0; i < PY_CASES.length; i++) if (PY_CASES[i].id === id) { curCase = PY_CASES[i]; break; }
    renderCaseList(); renderCase();
  }

  function renderCase() {
    var box = document.getElementById('pycMain');
    if (!box || !curCase) return;
    var c = curCase;
    var idx = PY_CASES.indexOf(c);
    var done = TP.isOpenDone(NS, c.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(c.group) + '</span><span>' + esc(c.title) + '</span>';
    (c.exam || []).forEach(function (t) {
      var cls = /必考|最容易错/.test(t) ? 'badge l5' : (/常考|核心/.test(t) ? 'badge l4' : 'badge soon');
      h += '<span class="' + cls + '">' + (/必考|最容易错/.test(t) ? '🔥 ' : '') + esc(t) + '</span>';
    });
    if (done) h += '<span class="badge on">已学</span>';
    h += '<span class="muted" style="margin-left:auto;font-family:var(--mono)">' + (idx + 1) + '/' + PY_CASES.length + '</span></div>';
    h += '<div class="qctx">🎯 <b>场景</b>　' + esc(c.scenario) + '</div>';

    /* 代码 */
    h += '<div class="sec-t" style="margin-top:12px">💻 代码' + '</div>';
    h += '<div class="codewrap"><div class="codebar">' +
         '<span>python</span><span class="muted">可直接复制到本地运行</span>' +
         '<button class="btn sm" data-copy="code">📋 复制代码</button></div>' +
         '<pre class="codepre">' + codeBlock(c.code) + '</pre></div>';

    /* 运行结果（真实捕获） */
    h += '<div class="sec-t">📤 运行结果（真实执行输出）</div>';
    h += '<div class="codewrap out"><div class="codebar"><span>stdout</span>' +
         '<span class="muted">由真实 pandas 运行捕获，非手写示意</span></div>' +
         '<pre class="codepre out">' + esc(c.output || '（无输出）') + '</pre></div>';

    /* 讲解 */
    h += '<div class="sec-t">📖 逐点讲解</div><div class="card" style="padding:13px 16px">';
    h += '<div style="font-size:12.5px;line-height:2;color:var(--text2)">';
    c.notes.forEach(function (n, i) { h += '<div style="margin-bottom:6px">' + (i + 1) + '. ' + n.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--text)">$1</b>').replace(/`(.+?)`/g, '<code class="ic">$1</code>') + '</div>'; });
    h += '</div></div>';

    /* 常见坑 */
    h += '<div class="sec-t">⚠️ 常见坑</div><div class="card" style="padding:13px 16px;border-left:3px solid var(--red)">';
    h += '<div style="font-size:12.5px;line-height:1.95;color:var(--text2)">';
    c.pitfalls.forEach(function (p) { h += '· ' + p.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--red)">$1</b>').replace(/`(.+?)`/g, '<code class="ic">$1</code>') + '<br>'; });
    h += '</div></div>';

    /* 操作 */
    h += '<div class="row" style="margin-top:14px">' +
         '<button class="btn" data-nav="prev" ' + (idx === 0 ? 'disabled' : '') + '>← 上一个</button>' +
         '<button class="btn primary" data-nav="next" ' + (idx === PY_CASES.length - 1 ? 'disabled' : '') + '>下一个 →</button>' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="pycDone" style="margin-left:auto;' + (done ? '' : 'background:linear-gradient(135deg,var(--green),#10b981)') + '">' +
         (done ? '✅ 已学（点击取消）' : '✅ 标记为已学') + '</button></div>';

    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('[data-copy]'), function (b) {
      b.onclick = function () { copyText(c.code, '代码'); };
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-nav]'), function (b) {
      b.onclick = function () {
        var d = b.getAttribute('data-nav');
        var ni = d === 'next' ? idx + 1 : idx - 1;
        if (ni >= 0 && ni < PY_CASES.length) {
          selectCase(PY_CASES[ni].id);
          var t = document.getElementById('pycMain');
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    });
    document.getElementById('pycDone').onclick = function () {
      var now = !TP.isOpenDone(NS, c.id);
      TP.markOpen(NS, c.id, now);
      toast(now ? '已标记为已学 ✅' : '已取消');
      renderCaseList(); renderCase(); refreshStats();
    };
  }

  /* ---------- Tab 2：代码实例题 ---------- */
  function refOf(id) {
    if (typeof PY_TASK_REFS === 'undefined') return null;
    for (var i = 0; i < PY_TASK_REFS.length; i++) if (PY_TASK_REFS[i].id === id) return PY_TASK_REFS[i];
    return null;
  }

  function renderTaskList() {
    var box = document.getElementById('pytList');
    if (!box) return;
    var h = '';
    PY_TASKS.forEach(function (t, i) {
      var done = TP.isOpenDone(NS, 'task_' + t.id);
      h += '<div class="qitem' + (curTask && curTask.id === t.id ? ' on' : '') + '" data-tid="' + t.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(t.title) + '">' + esc(t.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { selectTask(el.getAttribute('data-tid')); };
    });
  }

  function selectTask(id) {
    for (var i = 0; i < PY_TASKS.length; i++) if (PY_TASKS[i].id === id) { curTask = PY_TASKS[i]; break; }
    renderTaskList(); renderTask();
  }

  function renderTask() {
    var box = document.getElementById('pytMain');
    if (!box || !curTask) return;
    var t = curTask;
    var ref = refOf(t.id);
    var done = TP.isOpenDone(NS, 'task_' + t.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(t.tag) + '</span><span class="badge l' + (t.level === '入门' ? '1' : t.level === '基础' ? '2' : '4') + '">' + esc(t.level) + '</span>' +
         '<span>' + esc(t.title) + '</span>' + (done ? '<span class="badge on">已做</span>' : '') + '</div>';
    h += '<div class="qctx" style="white-space:normal">' + esc(t.ctx).replace(/\n/g, '<br>') + '</div>';
    h += '<div class="card" style="margin:10px 0;padding:11px 14px;border-left:3px solid var(--mc)"><div style="font-size:12.5px;color:var(--text);line-height:1.85"><b style="color:var(--mc)">任务</b>　' + esc(t.task).replace(/\n/g, '<br>') + '</div></div>';

    /* 起始模板 */
    h += '<div class="sec-t" style="margin-top:12px">📝 起始模板（建议先自己写完再看参考解）</div>';
    h += '<div class="codewrap"><div class="codebar"><span>python</span><button class="btn sm" data-cp="starter">📋 复制</button></div>' +
         '<pre class="codepre">' + codeBlock(t.starter) + '</pre></div>';

    if (ref) {
      h += '<details class="acc answer" style="margin-top:12px"><summary>✅ 参考答案 · 参考解 + 预期结果（真实运行）</summary><div class="accbody">';
      h += '<div class="codewrap"><div class="codebar"><span>reference</span><button class="btn sm" data-cp="sol">📋 复制</button></div>' +
           '<pre class="codepre">' + codeBlock(ref.code) + '</pre></div>';
      h += '<div style="margin-top:10px;font-size:12.5px;line-height:1.9"><b style="color:var(--green)">预期结果 answer =</b> <code class="ic">' + esc(ref.answer) + '</code></div>';
      if (ref.output) h += '<div style="margin-top:8px"><b style="color:var(--text2);font-size:12px">程序输出</b><pre class="codepre out" style="margin-top:5px">' + esc(ref.output) + '</pre></div>';
      h += '</div></details>';
    } else {
      h += '<div class="verdict err" style="margin-top:12px">参考解数据缺失（请运行 tools/gen_pycases.py 重新生成）</div>';
    }

    h += '<details class="acc"><summary>💡 提示</summary><div class="accbody">' + esc(t.hint) + '</div></details>';
    h += '<details class="acc"><summary>🎯 业务含义</summary><div class="accbody">' + esc(t.why) + '</div></details>';

    h += '<div class="row" style="margin-top:12px"><button class="btn' + (done ? '' : ' primary') + '" id="pytDone" style="' + (done ? '' : 'background:linear-gradient(135deg,var(--green),#10b981)') + '">' +
         (done ? '✅ 我已独立写出（点击取消）' : '✅ 我已独立写出') + '</button>' +
         '<span class="muted">对照参考解检查：口径对不对、有没有漏条件</span></div>';

    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('[data-cp]'), function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-cp');
        copyText(k === 'sol' && ref ? ref.code : t.starter, k === 'sol' ? '参考解' : '模板');
      };
    });
    document.getElementById('pytDone').onclick = function () {
      var now = !TP.isOpenDone(NS, 'task_' + t.id);
      TP.markOpen(NS, 'task_' + t.id, now);
      toast(now ? '已标记 ✅' : '已取消');
      renderTaskList(); renderTask(); refreshStats();
    };
  }

  function renderTasksTab(container) {
    container.innerHTML =
      '<div class="card" style="margin-bottom:12px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.85">' +
      '🎯 <b>代码实例题</b>：给出任务与起始模板，建议先自己写，再展开参考解对照。' +
      '参考解下方标注的 <b>预期结果</b> 是真实运行得到的，可以直接用来判断自己写得对不对。</div></div>' +
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">练习列表</div><div class="qlist" id="pytList"></div></div>' +
        '<div><div class="pane" id="pytMain"></div></div>' +
      '</div>';
    if (!curTask) {
      var first = null;
      for (var i = 0; i < PY_TASKS.length; i++) { if (!TP.isOpenDone(NS, 'task_' + PY_TASKS[i].id)) { first = PY_TASKS[i]; break; } }
      curTask = first || PY_TASKS[0];
    }
    renderTaskList(); renderTask();
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    var el = document.getElementById('pycStats');
    if (!el) return;
    var learned = 0;
    PY_CASES.forEach(function (c) { if (TP.isOpenDone(NS, c.id)) learned++; });
    var taskDone = 0;
    PY_TASKS.forEach(function (t) { if (TP.isOpenDone(NS, 'task_' + t.id)) taskDone++; });
    var groups = {};
    PY_CASES.forEach(function (c) { groups[c.group] = 1; });
    el.innerHTML =
      '<div class="stat cy"><b>' + learned + '<span style="font-size:12px;color:var(--text3)">/' + PY_CASES.length + '</span></b><span>已学案例</span></div>' +
      '<div class="stat em"><b>' + taskDone + '<span style="font-size:12px;color:var(--text3)">/' + PY_TASKS.length + '</span></b><span>已完成练习</span></div>' +
      '<div class="stat am"><b>' + Object.keys(groups).length + '</b><span>知识分组</span></div>' +
      '<div class="stat vi"><b>' + PY_CASES.length + '</b><span>可复制案例</span></div>';
  }

  /* ---------- 挂载 ---------- */
  function mount(host) {
    if (!curCase) curCase = PY_CASES[0];
    host.innerHTML =
      '<div class="h1"><span class="grad">Python 数据分析案例</span> · 教学模块</div>' +
      '<div class="sub">' + esc(PY_CASE_META.intro) + '</div>' +
      '<div class="ans-tip">✅ <b>答案怎么看</b>　每道题下方都有<b>绿色「参考答案 ·」折叠区</b>，点开即可查看参考解 / 参考结论 / 逐点讲解；先自己想一遍再看效果最好。</div>' +
      '<div class="stats" id="pycStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px">' +
        '<div style="font-size:11.5px;color:var(--text2);line-height:1.9">' +
        '🧪 <b>环境</b>　' + esc(PY_CASE_META.env) + '<br>' +
        '📌 <b>说明</b>　不需要在这里在线运行——直接「复制代码」到你的 Jupyter / VS Code 里跑即可；下面每个案例都附了真实运行结果，方便你对照。' +
        '</div></div>' +
      '<div class="row" style="gap:6px;margin-bottom:12px">' +
        '<button class="btn primary" data-tab="cases">① 常用案例</button>' +
        '<button class="btn" data-tab="tasks">② 代码实例题</button>' +
      '</div>' +
      '<div id="pycPanel"></div>';

    var panel = document.getElementById('pycPanel');
    function show(tab) {
      Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
        b.className = 'btn' + (b.getAttribute('data-tab') === tab ? ' primary' : '');
      });
      if (tab === 'tasks') renderTasksTab(panel);
      else {
        panel.innerHTML =
          '<div class="lab">' +
            '<div><div class="sec-t" style="margin-top:0">案例导航</div><div class="qlist" id="pycList"></div></div>' +
            '<div><div class="pane" id="pycMain"></div></div>' +
          '</div>';
        renderCaseList(); renderCase();
      }
      refreshStats();
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
      b.onclick = function () { show(b.getAttribute('data-tab')); };
    });
    show('cases');
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
