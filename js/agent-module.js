/* AI Agent 实操 · 交互模块（判读 / 提效计算器 / 实操任务 / 模板） */
var AgentModule = (function () {
  var mounted = {};

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

  /* ---------- 提效计算器 ---------- */
  var CALC_KEY = 'tp_agent_calc_v1';
  function loadCalc() {
    try { return JSON.parse(localStorage.getItem(CALC_KEY)) || null; } catch (e) { return null; }
  }
  function saveCalc(v) { try { localStorage.setItem(CALC_KEY, JSON.stringify(v)); } catch (e) {} }

  function compute(v) {
    var freq = +v.freq || 0, manual = +v.manual || 0, agent = +v.agent || 0;
    var review = +v.review || 0, upkeep = +v.upkeep || 0, rate = +v.rate || 0;
    var beforeWeek = freq * manual;                       /* 原来每周人工分钟 */
    var afterWeek = freq * (agent + review) + upkeep;     /* 现在每周（生成+审核）*频次 + 维护 */
    var savedWeek = beforeWeek - afterWeek;               /* 每周净节省分钟 */
    var savedYearH = savedWeek * 52 / 60;                 /* 年化小时 */
    var valueYear = savedYearH * rate;                    /* 年化价值 */
    var effRate = beforeWeek > 0 ? (savedWeek / beforeWeek * 100) : 0;
    var naiveWeek = freq * (manual - agent);              /* 错误算法：只算人工-生成 */
    return {
      beforeWeek: beforeWeek, afterWeek: afterWeek, savedWeek: savedWeek,
      savedYearH: savedYearH, valueYear: valueYear, effRate: effRate,
      naiveWeek: naiveWeek, naiveYearH: naiveWeek * 52 / 60,
      overhead: freq * review + upkeep,
      overheadPct: beforeWeek > 0 ? ((freq * review + upkeep) / beforeWeek * 100) : 0
    };
  }

  function fmtM(m) {
    m = Math.round(m);
    if (Math.abs(m) < 60) return m + ' 分钟';
    return (m / 60).toFixed(1) + ' 小时';
  }

  function renderCalc(container) {
    var cfg = AGENT_CONTENT.calc;
    var v = loadCalc();
    if (!v) { v = {}; cfg.presets[0] ? Object.keys(cfg.presets[0]).forEach(function (k) { v[k] = cfg.presets[0][k]; }) : null; }

    var h = '<div class="card" style="padding:14px 16px">';
    h += '<div style="font-size:13px;font-weight:700;margin-bottom:6px">🧮 ' + esc(cfg.title) + '</div>';
    h += '<div style="font-size:11.5px;line-height:1.8;color:var(--am);background:rgba(251,191,36,.08);border-left:3px solid var(--am);border-radius:8px;padding:9px 12px;margin-bottom:12px">⚠️ ' + esc(cfg.warning) + '</div>';

    h += '<div class="row" style="gap:6px;margin-bottom:12px"><span class="muted">快速套用：</span>';
    cfg.presets.forEach(function (p, i) { h += '<button class="btn sm" data-preset="' + i + '">' + esc(p.name) + '</button>'; });
    h += '</div>';

    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:9px">';
    cfg.fields.forEach(function (f) {
      h += '<label style="display:block"><span style="font-size:11px;color:var(--txt3)">' + esc(f.label) + '（' + esc(f.unit) + '）</span>' +
           '<input type="number" id="ac_' + f.k + '" value="' + (v[f.k] !== undefined ? v[f.k] : '') + '" ' +
           'style="width:100%;margin-top:4px;padding:7px 10px;background:var(--code-bg);border:1px solid var(--border2);border-radius:8px;color:var(--code-text);font-family:var(--mono);font-size:13px;outline:none"></label>';
    });
    h += '</div>';

    h += '<div id="calcOut" style="margin-top:14px"></div>';
    container.innerHTML = h;

    function read() {
      var o = {};
      cfg.fields.forEach(function (f) {
        var el = document.getElementById('ac_' + f.k);
        o[f.k] = el ? (+el.value || 0) : 0;
      });
      return o;
    }
    function refresh() {
      var val = read(); saveCalc(val);
      var r = compute(val);
      var positive = r.savedWeek > 0;
      var box = document.getElementById('calcOut');
      box.innerHTML =
        '<div class="stats">' +
        '<div class="stat ' + (positive ? 'em' : 'am') + '"><b>' + fmtM(r.savedWeek) + '</b><span>每周净节省</span></div>' +
        '<div class="stat ' + (positive ? 'cy' : 'am') + '"><b>' + r.savedYearH.toFixed(0) + ' h</b><span>年化节省</span></div>' +
        '<div class="stat vi"><b>¥' + Math.round(r.valueYear).toLocaleString() + '</b><span>年化价值（按时薪折算）</span></div>' +
        '<div class="stat am"><b>' + r.effRate.toFixed(0) + '%</b><span>提效幅度</span></div>' +
        '</div>' +
        '<div class="card" style="margin-top:12px;padding:12px 14px">' +
        '<div style="font-size:12px;line-height:2;color:var(--txt2)">' +
        '<b style="color:var(--txt)">账目明细</b><br>' +
        '· 原来每周人工：<b>' + fmtM(r.beforeWeek) + '</b><br>' +
        '· 现在每周总计：<b>' + fmtM(r.afterWeek) + '</b>（含生成 + 审核 ' + fmtM(val.freq * val.review) + ' + 维护 ' + fmtM(val.upkeep) + '）<br>' +
        '· <b style="color:var(--am)">审核+维护占总耗时 ' + r.overheadPct.toFixed(0) + '%</b>——这部分最容易被漏算<br>' +
        '</div>' +
        '<div style="margin-top:10px;font-size:11.5px;line-height:1.85;color:' + (positive ? 'var(--em)' : 'var(--rd)') + ';background:var(--bg2);border-radius:8px;padding:9px 12px">' +
        (positive
          ? '✅ 净节省为正。注意：如果只按"人工−生成"的错算法，会算成每周省 <b>' + fmtM(r.naiveWeek) + '</b>（年化 ' + r.naiveYearH.toFixed(0) + 'h）——比真实的 <b>' + fmtM(r.savedWeek) + '</b> 高估了 ' +
            (r.naiveWeek > 0 ? Math.round((r.naiveWeek / r.savedWeek - 1) * 100) : 0) + '%。<b>面试时如果你能主动说出这个差距，专业度会立刻体现出来。</b>'
          : '❌ 净节省为负——这个任务做成 Agent 反而更费时间。原因通常是：频次太低（省下的时间摊不薄开发维护成本）或审核成本过高。<b>结论：这种场景不该做 Agent，直接用普通 LLM 单次生成即可。</b>') +
        '</div></div>';
    }
    cfg.fields.forEach(function (f) {
      var el = document.getElementById('ac_' + f.k);
      if (el) el.addEventListener('input', refresh);
    });
    Array.prototype.forEach.call(container.querySelectorAll('[data-preset]'), function (b) {
      b.onclick = function () {
        var p = cfg.presets[+b.getAttribute('data-preset')];
        Object.keys(p).forEach(function (k) {
          if (k === 'name') return;
          var el = document.getElementById('ac_' + k);
          if (el) el.value = p[k];
        });
        refresh();
        toast('已套用「' + p.name + '」');
      };
    });
    refresh();
  }

  /* ---------- 实操任务清单 ---------- */
  function renderTasks(container) {
    var h = '<div class="card" style="padding:14px 16px">';
    h += '<div style="font-size:13px;font-weight:700;margin-bottom:4px">🛠️ 实操任务清单（做完才算"理解 AI 如何提升效率"）</div>';
    h += '<div class="muted" style="margin-bottom:12px">JD 要的是"理解与思考"，而理解只能来自动手。建议按顺序做，每完成一项打勾。</div>';
    AGENT_CONTENT.tasks.forEach(function (t, i) {
      var done = TP.isOpenDone('agent', t.id);
      h += '<div class="card" style="margin-bottom:9px;padding:12px 14px;border-left:3px solid ' + (done ? 'var(--em)' : 'var(--line2)') + '">';
      h += '<div style="display:flex;gap:10px;align-items:flex-start">';
      h += '<input type="checkbox" data-task="' + t.id + '" ' + (done ? 'checked' : '') + ' style="margin-top:3px;width:15px;height:15px;cursor:pointer;accent-color:var(--accent)">';
      h += '<div style="flex:1">';
      h += '<div style="font-size:12.5px;font-weight:700;color:' + (done ? 'var(--em)' : 'var(--txt)') + '">T' + (i + 1) + ' · ' + esc(t.title) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--txt2);line-height:1.75;margin-top:4px"><b style="color:var(--cy)">目标</b>　' + esc(t.goal) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--txt2);line-height:1.75;margin-top:3px"><b style="color:var(--em)">完成标准</b>　' + esc(t.standard) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--txt3);line-height:1.75;margin-top:3px">💡 ' + esc(t.tips) + '</div>';
      h += '</div></div></div>';
    });
    h += '<div style="margin-top:10px;font-size:11.5px;color:var(--txt3);line-height:1.8">完成 T4 后，你就有了一个可以写进简历/面试讲的 Agent 项目——<b style="color:var(--cy)">"我做过、我量化过"永远比"我了解"更有说服力</b>。</div>';
    h += '</div>';
    container.innerHTML = h;
    Array.prototype.forEach.call(container.querySelectorAll('[data-task]'), function (cb) {
      cb.onchange = function () {
        TP.markOpen('agent', cb.getAttribute('data-task'), cb.checked);
        renderTasks(container);
        refreshStats();
      };
    });
  }

  /* ---------- 模板 ---------- */
  function renderTemplates(container) {
    var h = '<div class="card" style="padding:14px 16px">';
    h += '<div style="font-size:13px;font-weight:700;margin-bottom:4px">📋 可复用模板（直接拿去跑）</div>';
    h += '<div class="muted" style="margin-bottom:12px">这三份东西可以直接用：Prompt 模板、工作流脚本骨架、提效核算表（写作品集用）。</div>';
    AGENT_CONTENT.templates.forEach(function (t) {
      h += '<details class="acc" style="margin-bottom:8px"><summary>' + esc(t.name) + '</summary><div class="accbody">';
      h += '<div style="font-size:11.5px;color:var(--txt2);line-height:1.75;margin-bottom:8px">' + esc(t.desc) + '</div>';
      h += '<pre class="code" id="tpl_' + esc(t.name).replace(/[^a-zA-Z0-9]/g, '') + '" style="max-height:420px">' + esc(t.body) + '</pre>';
      h += '<div style="margin-top:7px"><button class="btn sm" data-copy="' + esc(t.name) + '">📋 复制</button></div>';
      h += '</div></details>';
    });
    h += '<div class="sec-t">相关资源</div>';
    AGENT_CONTENT.resources.forEach(function (r) {
      h += '<div style="font-size:11.5px;line-height:1.8;color:var(--txt2);margin-bottom:6px">· <b style="color:var(--txt)">' + esc(r.t) + '</b>　' + esc(r.d) + '</div>';
    });
    h += '</div>';
    container.innerHTML = h;
    Array.prototype.forEach.call(container.querySelectorAll('[data-copy]'), function (b) {
      b.onclick = function () {
        var name = b.getAttribute('data-copy');
        var t = null;
        AGENT_CONTENT.templates.forEach(function (x) { if (x.name === name) t = x; });
        if (!t) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t.body).then(function () { toast('已复制到剪贴板'); },
            function () { toast('复制失败，请手动选中代码'); });
        } else { toast('浏览器不支持自动复制，请手动选中'); }
      };
    });
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    var el = document.getElementById('agStats');
    if (!el) return;
    var suitRec = TP.quizGet('agent', AGENT_CONTENT.suitability.id);
    var designDone = 0;
    AGENT_CONTENT.designs.forEach(function (d) { if (TP.isQuizDone('agent', d.id)) designDone++; });
    var taskDone = 0;
    AGENT_CONTENT.tasks.forEach(function (t) { if (TP.isOpenDone('agent', t.id)) taskDone++; });
    var v = loadCalc() || {};
    var r = compute(v);
    el.innerHTML =
      '<div class="stat ' + (suitRec && suitRec.ok ? 'em' : 'am') + '"><b>' + (suitRec && suitRec.ok ? '✓' : '—') + '</b><span>场景判读</span></div>' +
      '<div class="stat ' + (designDone === AGENT_CONTENT.designs.length ? 'em' : 'cy') + '"><b>' + designDone + '/' + AGENT_CONTENT.designs.length + '</b><span>设计判读</span></div>' +
      '<div class="stat ' + (taskDone === AGENT_CONTENT.tasks.length ? 'em' : 'vi') + '"><b>' + taskDone + '/' + AGENT_CONTENT.tasks.length + '</b><span>实操任务</span></div>' +
      '<div class="stat am"><b>' + (r.savedWeek > 0 ? (r.savedWeek / 60).toFixed(1) + 'h' : '—') + '</b><span>每周净节省（你的测算）</span></div>';
  }

  /* ---------- 挂载（Tab 切换） ---------- */
  function mount(host) {
    host.innerHTML =
      '<div class="h1"><span class="grad">AI Agent 实操</span> · 运营提效</div>' +
      '<div class="sub">对应字节 JD 第 2 条硬性要求：理解 AI 如何提升运营效率 · 判读设计 → 算清账 → 动手做 → 沉淀模板</div>' +
      '<div class="stats" id="agStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.85">💡 ' + esc(AGENT_CONTENT.intro) + '</div></div>' +
      '<div class="row" style="gap:6px;margin-bottom:12px">' +
        '<button class="btn primary" data-tab="quiz">① 判读</button>' +
        '<button class="btn" data-tab="calc">② 提效计算器</button>' +
        '<button class="btn" data-tab="tasks">③ 实操任务</button>' +
        '<button class="btn" data-tab="tpl">④ 模板</button>' +
      '</div>' +
      '<div id="agPanel"></div>';

    var panel = document.getElementById('agPanel');

    function show(tab) {
      Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
        b.className = 'btn' + (b.getAttribute('data-tab') === tab ? ' primary' : '');
      });
      if (tab === 'calc') { renderCalc(panel); }
      else if (tab === 'tasks') { renderTasks(panel); }
      else if (tab === 'tpl') { renderTemplates(panel); }
      else {
        panel.innerHTML = '';
        var inner = document.createElement('div');
        inner.id = 'agentQuizHost';
        panel.appendChild(inner);
        var data = [AGENT_CONTENT.suitability].concat(AGENT_CONTENT.designs);
        QuizModule.mount(inner, {
          ns: 'agent', type: 'single', title: 'AI Agent 判读', suffix: '设计题',
          sub: '场景适配判断 + Agent 设计判读 · 自动判分 · 每题对应一个真实设计错误',
          data: data, meta: { intro: 'Agent 设计的核心纪律：①取数与生成分离（数字用代码算）②保留人工审核 ③失败必须告警不静默 ④模型选型匹配任务难度。' }
        });
      }
      refreshStats();
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) {
      b.onclick = function () { show(b.getAttribute('data-tab')); };
    });
    show('quiz');
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
