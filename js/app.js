/* 应用入口：路由 + 首页 + 模块导航 + 自检 */
var App = (function () {

  /* 能力模型：基于字节跳动策略运营岗真实 JD 反推（9 维） */
  var ABILITY = [
    { n: 'SQL 数据提取',        jd: '熟练使用SQL（硬性）',              train: 5, mod: 'SQL 训练场',      m: 1 },
    { n: '数据分析与问题拆解',   jd: '较强的数据分析与问题拆解能力（硬性）', train: 5, mod: '数据集实验室',    m: 2 },
    { n: 'AI/LLM/Agent 理解',   jd: '对AI产品/LLM/Agent/Workflow有较强兴趣（硬性）', train: 5, mod: 'AI Agent 实操', m: 6 },
    { n: 'AI 提升运营效率',      jd: 'AI与自动化工具落地应用（硬性）',    train: 4, mod: 'AI Agent 实操', m: 6 },
    { n: '量化拆解·系统思考',    jd: '复杂业务问题量化拆解和系统化思考（硬性）', train: 4, mod: 'Case 拆解训练', m: 5 },
    { n: '实验分析 (A/B)',      jd: '有实验分析经验加分',               train: 4, mod: '实验分析训练',    m: 4 },
    { n: '指标体系设计',         jd: '有指标体系设计经验加分',           train: 4, mod: '指标设计工坊',    m: 3 },
    { n: '运营SOP/工作流设计',   jd: '运营SOP优化、工作流建设（职责）',   train: 3, mod: 'Case 拆解训练',   m: 5 },
    { n: '方法论沉淀',           jd: '沉淀方法论与最佳实践（职责）',       train: 3, mod: '能力雷达',        m: 7 }
  ];

  var MODULES = [
    { m: 1, icon: '🗄️', t: 'SQL 训练场', d: '浏览器内跑真实 SQLite：20 道分层题（基础→窗口函数→业务场景）+ 自动判分 + 错题本', r: '#/sql', ready: true },
    { m: 2, icon: '🔬', t: '数据集实验室', d: '给你业务问题、自己去数据里找答案：渠道质量/留存诊断/预算决策/用户分层/召回', r: '#/lab', ready: true, hot: true },
    { m: 3, icon: '📐', t: '指标设计工坊', d: '6 个业务场景：从候选指标里挑出该纳入指标体系的，识别虚荣指标与存量指标陷阱', r: '#/metrics', ready: true },
    { m: 4, icon: '🧪', t: '实验分析训练', d: '6 个真实 A/B 判读：显著性决策、peeking、分层异质性、统计显著≠业务显著、AA 校验', r: '#/abtest', ready: true },
    { m: 5, icon: '🧩', t: 'Case 拆解训练', d: '5 个运营现象：头部作者流失/渠道留存跳变/付费率下滑/版本权衡/push 衰减', r: '#/case', ready: true },
    { m: 6, icon: '🤖', t: 'AI Agent 实操', d: '从 0 搭运营 Agent（自动周报/自动分析），并量化到底省了多少时间', r: '#/agent', ready: false },
    { m: 7, icon: '🎯', t: '能力雷达', d: '9 维能力自评 → 对标 JD → 输出差距清单与学习建议', r: '#/radar', ready: false }
  ];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 首页 ---------- */
  function renderHome(host) {
    var s = TP.stats(SQL_QUESTIONS.length);
    var ls = TP.labStats(LAB_QUESTIONS.length);
    var h = '';
    h += '<div class="h1"><span class="grad">能力训练平台</span></div>';
    h += '<div class="sub">目标方向：<b>策略运营 / 用户增长</b> · 依据大厂公开招聘要求反推能力模型 · 纯前端零成本 · 练的是"动手做"不是"看资料"</div>';

    h += '<div class="card" style="margin-bottom:16px">';
    h += '<div class="row" style="justify-content:space-between;align-items:flex-start">';
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:6px">📌 当前进度</div>';
    h += '<div class="muted">SQL 训练场：已完成 ' + s.done + '/' + s.total + ' 题 · 一次做对率 ' + s.mastery + '%（真实掌握度）· 累计运行 ' + s.runs + ' 次</div>';
    h += '<div class="muted">数据集实验室：已完成 ' + ls.done + '/' + ls.total + ' 个业务分析</div>';
    var ms = TP.quizStats('metrics', METRICS_QUIZZES.length);
    var as = TP.quizStats('abtest', ABTEST_QUIZZES.length);
    var csDone = 0; CASE_QUESTIONS.forEach(function (q) { if (TP.isOpenDone('case', q.id)) csDone++; });
    h += '<div class="muted">指标设计 ' + ms.done + '/' + ms.total + ' · 实验分析 ' + as.done + '/' + as.total + ' · Case 拆解 ' + csDone + '/' + CASE_QUESTIONS.length + (s.updated ? ' · 最近 ' + s.updated : '') + '</div></div>';
    h += '<div class="ring" style="background:conic-gradient(var(--cy) ' + (s.pct * 3.6) + 'deg, rgba(255,255,255,.08) 0deg)"><i><b>' + s.pct + '%</b><em>SQL 完成度</em></i></div>';
    h += '</div></div>';

    h += '<div class="sec-t">训练模块</div><div class="mods">';
    MODULES.forEach(function (mo) {
      var badge = mo.ready ? '<span class="badge on">● 已上线</span>' : '<span class="badge soon">规划中</span>';
      if (mo.hot) badge += ' <span class="badge hot">先练这个</span>';
      var cls = 'card hoverable mod' + (mo.ready ? ' top' : '');
      h += '<a class="' + cls + '" href="' + (mo.ready ? mo.r : 'javascript:void(0)') + '"' + (mo.ready ? '' : ' onclick="App.soon(\'' + esc(mo.t) + '\')"') + '>' +
           '<span class="mi">' + mo.icon + '</span><div class="mt">' + esc(mo.t) + '</div>' +
           '<div class="md">' + esc(mo.d) + '</div>' +
           '<div class="mf">' + badge + '<span class="muted mono">M' + mo.m + '</span></div></a>';
    });
    h += '</div>';

    /* 能力模型 */
    h += '<div class="sec-t">能力模型（对标大厂策略运营 JD）</div>';
    h += '<div class="card"><div class="muted" style="margin-bottom:10px">9 维能力逐项对应训练模块。★ 越多=越能通过系统训练提升。</div>';
    h += '<div class="tblwrap" style="max-height:none"><table class="dg" style="font-family:var(--sans);font-size:12px">';
    h += '<thead><tr><th>能力</th><th>JD 依据</th><th>可训练性</th><th>对应模块</th></tr></thead><tbody>';
    ABILITY.forEach(function (a) {
      var stars = '★'.repeat(a.train) + '<span style="opacity:.25">' + '★'.repeat(5 - a.train) + '</span>';
      h += '<tr><td style="color:var(--txt);font-weight:600">' + esc(a.n) + '</td><td style="white-space:normal">' + esc(a.jd) + '</td>' +
           '<td style="color:var(--am)">' + stars + '</td><td style="color:var(--cy)">M' + a.m + ' ' + esc(a.mod) + '</td></tr>';
    });
    h += '</tbody></table></div></div>';

    /* 数据集 */
    if (typeof DATASET_META !== 'undefined') {
      h += '<div class="sec-t">训练数据集</div><div class="card">';
      h += '<div style="font-size:13px;font-weight:700;margin-bottom:6px">' + esc(DATASET_META.name) + '</div>';
      h += '<div class="muted" style="white-space:pre-line;margin-bottom:10px">' + esc(DATASET_META.note) + '</div>';
      h += '<div class="dsgrid">';
      DATASET_META.tables.forEach(function (t) {
        h += '<div class="dscard"><b>' + esc(t.name) + '</b> <span class="r">' + t.rows + ' 行</span><p>' + esc(t.desc) + '</p></div>';
      });
      h += '</div></div>';
    }

    /* 路线 */
    h += '<div class="sec-t">实施路线</div><div class="card">';
    h += '<div style="font-size:12.5px;line-height:2;color:var(--txt2)">' +
      '<b style="color:var(--em)">阶段 1（已上线）</b> SQL 训练场 —— 硬门槛，先把 SQL 练到能上手<br>' +
      '<b style="color:var(--em)">阶段 2（已上线）</b> 数据集实验室 —— 从"会写 SQL"到"会分析业务"<br>' +
      '<b style="color:var(--txt3)">阶段 3</b> 指标设计 / 实验分析 / Case 拆解 —— JD 加分项<br>' +
      '<b style="color:var(--txt3)">阶段 4</b> AI Agent 实操 + 进度回流个人网站 —— JD 第 2 条硬性要求</div></div>';

    host.innerHTML = h;
  }

  /* ---------- 占位 ---------- */
  function renderSoon(host, name) {
    host.innerHTML = '<div class="h1"><span class="grad">' + esc(name || '该模块') + '</span></div>' +
      '<div class="sub">规划中 · 按阶段实施</div>' +
      '<div class="card"><div style="font-size:13px;line-height:1.9;color:var(--txt2)">' +
      '这个模块还没开发。当前已上线的是 <b style="color:var(--cy)">阶段 1 · SQL 训练场</b>。<br>' +
      '先把 SQL 练到至少 L1-L3 全通（尤其是业务场景题），再上后面的模块效果更好。</div>' +
      '<div style="margin-top:12px"><a class="btn primary" href="#/sql">▶ 去练 SQL</a> <a class="btn ghost" href="#/home">返回首页</a></div></div>';
  }

  /* ---------- 路由 ---------- */
  var ROUTES = {
    '#/home': function (host) { renderHome(host); },
    '#/sql': function (host) { SQLModule.mount(host); },
    '#/lab': function (host) { LabModule.mount(host); },
    '#/metrics': function (host) {
      QuizModule.mount(host, { ns: 'metrics', type: 'multi', title: '指标设计工坊', suffix: '用户增长',
        sub: '给业务场景 → 从候选指标里挑出该纳入指标体系的 · 自动判分 · 含虚荣指标陷阱',
        data: METRICS_QUIZZES, meta: METRICS_META });
    },
    '#/abtest': function (host) {
      QuizModule.mount(host, { ns: 'abtest', type: 'single', title: '实验分析训练', suffix: 'A/B 判读',
        sub: '给实验数据 → 判断能不能上线 / 下一步做什么 · 自动判分 · 每题一个真实高频错误',
        data: ABTEST_QUIZZES, meta: ABTEST_META });
    },
    '#/case': function (host) { CaseModule.mount(host); },
    '#/agent': function (host) { renderSoon(host, 'AI Agent 实操'); },
    '#/radar': function (host) { renderSoon(host, '能力雷达'); }
  };

  function nav() {
    var hash = location.hash || '#/home';
    if (!ROUTES[hash]) hash = '#/home';
    var host = document.getElementById('view');
    if (!host) return;
    ROUTES[hash](host);
    Array.prototype.forEach.call(document.querySelectorAll('.nav a[href^="#/"]'), function (a) {
      a.classList.toggle('on', a.getAttribute('href') === hash);
    });
    if (hash === '#/sql') { try { SQLModule.onShow(); } catch (e) {} }
    if (hash === '#/lab') { try { LabModule.onShow(); } catch (e) {} }
    if (hash === '#/metrics' || hash === '#/abtest') { try { QuizModule.onShow(); } catch (e) {} }
    if (hash === '#/case') { try { CaseModule.onShow(); } catch (e) {} }
    window.scrollTo(0, 0);
  }

  /* ---------- 自检（部署验证用：?selftest=1）---------- */
  function selfTest() {
    var box = document.createElement('div');
    box.id = 'selftestOut';
    box.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(box);
    SQLRunner.init(function () {}).then(function () {
      var res = SQLRunner.selfTest(SQL_QUESTIONS);
      var lab = SQLRunner.selfTestLab(LAB_QUESTIONS);
      var all = res.concat(lab);
      var pass = all.filter(function (r) { return r.ok; }).length;
      var lines = all.map(function (r) { return (r.ok ? 'PASS' : 'FAIL') + ' ' + r.id + ' rows=' + r.rows + ' cols=' + r.cols + (r.err ? ' err=' + r.err : ''); });
      box.textContent = 'SELFTEST_RESULT ' + pass + '/' + all.length + ' (SQL ' + res.filter(function(r){return r.ok;}).length + '/' + res.length + ', LAB ' + lab.filter(function(r){return r.ok;}).length + '/' + lab.length + ')\n' + lines.join('\n');
      document.title = 'SELFTEST ' + pass + '/' + all.length;
      if (window.console) console.log(box.textContent);
    }).catch(function (e) {
      box.textContent = 'SELFTEST_RESULT 0 ERROR ' + (e.message || e);
      document.title = 'SELFTEST ERROR';
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    window.addEventListener('hashchange', nav);
    nav();
    if (/[?&]selftest=1/.test(location.search)) selfTest();
  }

  return { boot: boot, soon: function (n) { location.hash = '#/home'; setTimeout(function () { renderSoon(document.getElementById('view'), n); }, 30); }, ABILITY: ABILITY };
})();

document.addEventListener('DOMContentLoaded', App.boot);
