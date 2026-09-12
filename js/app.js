/* 应用入口：路由 + 首页 + 模块导航 + 自检 */
/* ===== 主题（与个人网站共用 localStorage 键：theme / themeColor）===== */
function toggleTheme(){
  var h=document.documentElement;
  var isDark=h.getAttribute('data-theme')==='dark';
  var next=isDark?'light':'dark';
  h.setAttribute('data-theme',next);
  var btn=document.getElementById('themeToggle');
  if(btn) btn.textContent=next==='dark'?'☀️':'🌙';
  try{ localStorage.setItem('theme',next); }catch(e){}
}
function setColorTheme(name){
  document.documentElement.setAttribute('data-theme-color',name);
  try{ localStorage.setItem('themeColor',name); }catch(e){}
  var dots=document.querySelectorAll('.theme-dot');
  Array.prototype.forEach.call(dots,function(d){
    d.classList.toggle('active', d.classList.contains(name));
  });
}
function zh_initThemeUI(){
  var isDark=document.documentElement.getAttribute('data-theme')==='dark';
  var btn=document.getElementById('themeToggle');
  if(btn) btn.textContent=isDark?'☀️':'🌙';
  var box=document.getElementById('themeDots');
  if(!box) return;
  var colors=['indigo','ocean','emerald','rose','amber','slate'];
  var names={indigo:'靛蓝',ocean:'深海蓝',emerald:'墨绿金',rose:'玫瑰金',amber:'琥珀暖',slate:'石墨灰'};
  var cur=document.documentElement.getAttribute('data-theme-color')||'indigo';
  box.innerHTML=colors.map(function(c){
    return '<span class="theme-dot '+c+(c===cur?' active':'')+'" title="'+names[c]+'" onclick="setColorTheme(\''+c+'\')"></span>';
  }).join('');
}

var App = (function () {

  /* 能力模型：策略运营 + AI 产品 两个方向的能力要求（目标等级 1-5） */
  var ABILITY = [
    { n:'SQL 数据提取',      why:'两个方向的硬门槛，面试第一关；不会 SQL 基本过不了简历筛', target:5, hard:true,  radarId:'sql',      mod:'SQL 训练场',    r:'#/sql' },
    { n:'数据分析与问题拆解', why:'从"取数"到"给出结论"的核心能力，决定你是执行还是分析',   target:5, hard:true,  radarId:'analysis', mod:'数据集实验室 + Python 案例', r:'#/lab' },
    { n:'AI / LLM / Agent 理解', why:'AI 产品岗硬性要求；运营岗也越来越多要求"懂 AI 提效"', target:5, hard:true,  radarId:'ai',       mod:'AI 产品经理 · AI Agent', r:'#/aipm' },
    { n:'AI 提升运营效率',    why:'能落地自动化才算真懂；面试要讲出"我做过、省了多少时间"', target:4, hard:true,  radarId:'aieff',    mod:'AI Agent 实操',  r:'#/agent' },
    { n:'量化拆解 · 系统思考', why:'把模糊现象拆成可验证假设——Case 面试的核心考察点',      target:4, hard:true,  radarId:'think',    mod:'Case 拆解训练',  r:'#/case' },
    { n:'实验分析 (A/B)',    why:'增长岗必备；AI 功能上线也要靠实验验证，不会就无法做决策', target:4, hard:false, radarId:'ab',       mod:'实验分析训练',   r:'#/abtest' },
    { n:'指标体系设计',       why:'产品与运营都要"定义成功"；指标体系是数据驱动的前提',     target:4, hard:false, radarId:'metric',   mod:'指标设计工坊',   r:'#/metrics' },
    { n:'PRD 与需求表达',     why:'运营转产品的最大短板；不会写 PRD 就无法独立负责需求',     target:4, hard:true,  radarId:null,       mod:'AI 产品经理 · PRD 工坊', r:'#/aipm' },
    { n:'运营 SOP / 工作流设计', why:'把一次性方案变成可复用流程，是"资深"与"执行"的分界',   target:3, hard:false, radarId:'sop',      mod:'Case 拆解训练',  r:'#/case' },
    { n:'方法论沉淀',         why:'面试时最能体现成长性；也能让团队复制你的打法',           target:3, hard:false, radarId:'method',   mod:'能力雷达',       r:'#/radar' }
  ];

  /* 两个目标求职方向 */
  var DIRECTIONS = [
    { icon:'📈', name:'策略运营 / 用户增长', tag:'互联网行业',
      roles:'字节·抖音增长 / 美团·策略运营 / 小红书·增长运营 / 滴滴·策略运营',
      need:'SQL + 数据分析与拆解 + 指标体系 + 实验分析 + 量化拆解',
      core:'核心门槛：SQL 必须熟练（面试会现场出题），且要能把数据讲成业务结论。',
      path:'主线：SQL 训练场 → 数据集实验室 → 指标设计 → 实验分析 → Case 拆解',
      color:'var(--m1)' },
    { icon:'🧭', name:'AI 产品经理 (AI PM)', tag:'互联网行业',
      roles:'各大厂 AI 产品 / AI 应用产品 / AI 平台产品',
      need:'AI 适用性判断 + 方案选型 + 验收标准 + PRD 表达 + 成本测算',
      core:'核心门槛：能判断"什么该用 AI、什么不该"，并能写清"出问题怎么办"。',
      path:'主线：AI 产品经理（判读→PRD→面试题）→ AI Agent 实操 → Python 案例',
      color:'var(--m10)' }
  ];

  var MODULES = [
    { m: 0, icon: '🗓️', t: '30 天训练计划', d: '从 0 开始的每日任务清单，完成打勾、自动算今天是第几天 —— 不知道先学什么就从这里开始', r: '#/plan', ready: true, hot: true },
    { m: 1, icon: '🗄️', t: 'SQL 训练场', d: '浏览器内跑真实 SQLite：30 道分层题（基础→窗口函数→业务场景）+ 自动判分 + 错题本', r: '#/sql', ready: true },
    { m: 2, icon: '🔬', t: '数据集实验室', d: '给你业务问题、自己去数据里找答案：渠道质量/留存诊断/预算决策/用户分层/召回', r: '#/lab', ready: true, hot: true },
    { m: 3, icon: '📐', t: '指标设计工坊', d: '8 个业务场景：从候选指标里挑出该纳入指标体系的，识别虚荣指标与存量指标陷阱', r: '#/metrics', ready: true },
    { m: 4, icon: '🧪', t: '实验分析训练', d: '9 个真实 A/B 判读：显著性决策、peeking、分层异质性、统计显著≠业务显著、AA 校验', r: '#/abtest', ready: true },
    { m: 5, icon: '🧩', t: 'Case 拆解训练', d: '7 个运营现象：头部作者流失/渠道留存跳变/付费率下滑/版本权衡/push 衰减', r: '#/case', ready: true },
    { m: 6, icon: '🤖', t: 'AI Agent 实操', d: '判读 Agent 设计 + 提效计算器（含审核/维护成本）+ 4 个实操任务 + 可复制模板', r: '#/agent', ready: true },
    { m: 7, icon: '🎯', t: '能力雷达', d: '9 维自评 → SVG 雷达图对比岗位要求 → 输出优先补齐清单（含当前训练进度）', r: '#/radar', ready: true },
    { m: 8, icon: '🐍', t: 'Python 数据分析案例', d: '16 个可复制案例（读取/清洗/聚合/留存/统计）+ 6 道代码实例题，均附真实运行结果', r: '#/python', ready: true },
    { m: 9, icon: '🗂️', t: '数据集（在线预览）', d: '在线看字段结构 + 分页浏览数据 + 快速 SQL 查询，不必下载 CSV 才能看字段', r: '#/data', ready: true },
    { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true }
  ];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 首页 ---------- */
  function renderHome(host) {
    var s = TP.stats(SQL_QUESTIONS.length);
    var ps = (typeof PlanModule !== 'undefined' && PlanModule.stats) ? PlanModule.stats() : null;
    var curDay = (typeof PlanModule !== 'undefined' && PlanModule.currentDay) ? PlanModule.currentDay() : 0;
    var radar = {};
    try { radar = JSON.parse(localStorage.getItem('tp_radar_v1') || '{}'); } catch (e) {}

    var h = '';

    /* ===== Hero ===== */
    h += '<div class="home-hero">';
    h += '<div class="home-hero-t">能力训练平台</div>';
    h += '<div class="home-hero-s">为 <b>策略运营 / 用户增长</b> 与 <b>AI 产品经理</b> 两个求职方向，提供可动手、可打勾、可量化的能力训练。</div>';
    h += '<div class="home-hero-tags"><span class="htag">互联网行业</span><span class="htag">11 个训练模块</span><span class="htag">纯前端 · 数据只存本机</span></div>';
    h += '<div class="row" style="gap:8px;margin-top:15px">';
    if (!curDay) h += '<a class="btn primary" href="#/plan">▶ 开始 30 天计划</a>';
    else h += '<a class="btn primary" href="#/plan">🎯 继续 Day ' + Math.min(curDay, 30) + '</a>';
    h += '<a class="btn" href="#/radar">🎯 先做能力自评</a>';
    h += '<a class="btn ghost" href="#/sql">🗄️ 直接练 SQL</a>';
    h += '</div></div>';

    /* ===== 两个求职方向 ===== */
    h += '<div class="sec-t">你的两个求职方向</div><div class="mods">';
    DIRECTIONS.forEach(function (d) {
      h += '<div class="card" style="padding:0;overflow:hidden"><div style="height:3px;background:' + d.color + '"></div><div style="padding:14px 17px">';
      h += '<div class="row" style="gap:8px"><span style="font-size:19px">' + d.icon + '</span>' +
           '<span style="font-size:14px;font-weight:800;color:' + d.color + '">' + esc(d.name) + '</span>' +
           '<span class="badge soon">' + esc(d.tag) + '</span></div>';
      h += '<div style="font-size:11px;color:var(--text3);line-height:1.7;margin-top:8px">目标岗位举例<br><span style="color:var(--text2)">' + esc(d.roles) + '</span></div>';
      h += '<div style="font-size:11.5px;color:var(--text2);line-height:1.75;margin-top:8px"><b style="color:' + d.color + '">需要的能力</b><br>' + esc(d.need) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--text2);line-height:1.75;margin-top:8px">' + esc(d.core) + '</div>';
      h += '<div style="font-size:11px;color:var(--text3);line-height:1.7;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' + esc(d.path) + '</div>';
      h += '</div></div>';
    });
    h += '</div>';

    /* ===== 能力目标 ===== */
    h += '<div class="sec-t">需要具备的能力 · 以及要练到什么程度</div>';
    h += '<div class="card" style="padding:14px 16px">';
    h += '<div class="muted" style="margin-bottom:10px;line-height:1.8">目标等级含义：<b style="color:var(--red)">5</b> = 能设计并教别人　<b style="color:var(--accent)">4</b> = 能独立完成　<b>3</b> = 能照着做。<br>' +
         '「当前自评」来自「能力雷达」——还没自评就是空的，先花 3 分钟评一次，这张表立刻变成你的行动清单。<a href="#/radar" style="color:var(--accent);text-decoration:none">去自评 →</a></div>';
    h += '<div class="tblwrap" style="max-height:none"><table class="dg" style="font-family:var(--sans);font-size:12px">';
    h += '<thead><tr><th>能力</th><th>为什么需要</th><th>目标</th><th>当前</th><th>差距</th><th>主练模块</th></tr></thead><tbody>';
    ABILITY.forEach(function (a) {
      var self = a.radarId ? (radar[a.radarId] || 0) : 0;
      var gap = self ? Math.max(0, a.target - self) : null;
      var bar = '';
      for (var i = 1; i <= 5; i++) {
        var on = i <= a.target;
        bar += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:2px;background:' + (on ? (a.hard ? 'var(--red)' : 'var(--accent)') : 'var(--border)') + '"></span>';
      }
      h += '<tr>' +
           '<td style="color:var(--text);font-weight:700;white-space:normal">' + esc(a.n) + (a.hard ? '<br><span class="badge hot" style="font-size:8.5px">硬性要求</span>' : '') + '</td>' +
           '<td style="white-space:normal;color:var(--text2)">' + esc(a.why) + '</td>' +
           '<td style="white-space:nowrap">' + bar + '</td>' +
           '<td style="white-space:nowrap;font-family:var(--mono);color:' + (self ? 'var(--accent)' : 'var(--text3)') + '">' + (self ? self + ' 级' : '未评') + '</td>' +
           '<td style="white-space:nowrap;font-weight:700;color:' + (gap === null ? 'var(--text3)' : (gap > 0 ? 'var(--orange)' : 'var(--green)')) + '">' + (gap === null ? '—' : (gap > 0 ? '差 ' + gap + ' 级' : '已达标')) + '</td>' +
           '<td style="white-space:nowrap"><a href="' + a.r + '" style="color:var(--accent);text-decoration:none">' + esc(a.mod) + ' →</a></td>' +
           '</tr>';
    });
    h += '</tbody></table></div></div>';

    /* ===== 怎么用 ===== */
    h += '<div class="sec-t">怎么用这个系统（3 步）</div><div class="mods">';
    [
      { i:'1', t:'先自评', d:'打开「能力雷达」给 10 项能力打分，立刻知道自己起点和最大短板。', r:'#/radar', b:'去自评' },
      { i:'2', t:'按天练', d:'打开「30 天训练计划」，每天 40-60 分钟，做完打勾。不用纠结先学什么。', r:'#/plan', b:'看计划' },
      { i:'3', t:'验证产出', d:'用判读题、PRD 工坊、面试题库检验——能讲清楚才算真会。', r:'#/aipm', b:'去验证' }
    ].forEach(function (x) {
      h += '<div class="card" style="padding:14px 16px"><div class="row" style="gap:10px;align-items:flex-start">' +
           '<span style="flex:0 0 auto;width:25px;height:25px;border-radius:50%;display:grid;place-items:center;font-size:12.5px;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff">' + x.i + '</span>' +
           '<div style="min-width:0"><div style="font-size:13px;font-weight:700">' + x.t + '</div>' +
           '<div style="font-size:11.5px;color:var(--text2);line-height:1.75;margin-top:4px">' + x.d + '</div>' +
           '<a class="btn sm" href="' + x.r + '" style="margin-top:8px">' + x.b + ' →</a></div></div></div>';
    });
    h += '</div>';

    /* ===== 答案在哪看 ===== */
    h += '<div class="ans-tip" style="margin-top:13px;align-items:flex-start">' +
         '<span style="font-size:14px">❓</span><span><b>答案在哪看？</b>　每道题都有参考答案，位置如下：<br>' +
         '· <b>SQL 训练场 / 数据集实验室 / Case 拆解 / PRD 工坊 / Python 案例</b>：题目下方的<b>绿色「参考答案 ·」折叠区</b>，点开就是参考解与讲解<br>' +
         '· <b>判读题（指标设计 / 实验分析 / AI Agent / AI PM）</b>：点「提交判分」逐项显示对错原因，或点「👀 直接看答案」不判分直接看<br>' +
         '· <b>Python 案例</b>：直接展示代码 + <b>真实运行结果</b>（真跑出来的，不是示意）<br>' +
         '· <b>面试题库</b>：每题直接给出「考察意图 / 回答框架 / 参考要点 / 加分与减分说法」</span></div>';

    /* ===== 当前进度 ===== */
    h += '<div class="sec-t">当前进度</div><div class="card" style="padding:14px 16px">';
    if (ps) {
      h += '<div class="row" style="justify-content:space-between;align-items:center;gap:12px;margin-bottom:11px">' +
           '<div><div style="font-size:13px;font-weight:700">🗓️ 30 天计划：' + (curDay ? '第 ' + Math.min(curDay, 30) + ' 天' : '未开始') + '</div>' +
           '<div class="muted" style="margin-top:3px">已完成 ' + ps.doneDays + '/' + ps.totalDays + ' 天 · 任务 ' + ps.doneTasks + '/' + ps.totalTasks + '</div></div>' +
           '<div class="ring" style="width:60px;height:60px;background:conic-gradient(var(--accent) ' + (ps.pct * 3.6) + 'deg, var(--border) 0deg)">' +
           '<i style="width:44px;height:44px"><b style="font-size:13px">' + ps.pct + '%</b></i></div></div>';
    }
    var pys = TP.quizStats('python', PY_TASKS.length);
    var aipmQ = TP.quizStats('aipm', AIPM_QUIZZES.length);
    var pcaseDone = 0; PY_CASES.forEach(function (c2) { if (TP.isOpenDone('pycase', c2.id)) pcaseDone++; });
    var aipmPrd = 0; AIPM_PRD_TASKS.forEach(function (t) { if (TP.isOpenDone('prd', t.id)) aipmPrd++; });
    var aipmIv = 0; if (typeof AIPM_INTERVIEW !== 'undefined') AIPM_INTERVIEW.forEach(function (t) { if (TP.isOpenDone('interview', t.id)) aipmIv++; });

    var rows = [
      { n:'SQL 训练场', v:s.done, t:s.total, x:(s.mastery ? '一次做对率 ' + s.mastery + '%' : ''), r:'#/sql' },
      { n:'数据集实验室', v:(function(){var l=TP.labStats(LAB_QUESTIONS.length); return l.done;})(), t:LAB_QUESTIONS.length, x:'', r:'#/lab' },
      { n:'指标设计工坊', v:TP.quizStats('metrics', METRICS_QUIZZES.length).done, t:METRICS_QUIZZES.length, x:'', r:'#/metrics' },
      { n:'实验分析训练', v:TP.quizStats('abtest', ABTEST_QUIZZES.length).done, t:ABTEST_QUIZZES.length, x:'', r:'#/abtest' },
      { n:'Case 拆解训练', v:(function(){var n=0;CASE_QUESTIONS.forEach(function(q){if(TP.isOpenDone('case',q.id))n++;});return n;})(), t:CASE_QUESTIONS.length, x:'', r:'#/case' },
      { n:'AI Agent 实操', v:(function(){var n=0;var su=TP.quizGet('agent',AGENT_CONTENT.suitability.id);if(su&&su.ok)n++;AGENT_CONTENT.designs.forEach(function(d){if(TP.isQuizDone('agent',d.id))n++;});AGENT_CONTENT.tasks.forEach(function(t2){if(TP.isOpenDone('agent',t2.id))n++;});return n;})(), t:(1+AGENT_CONTENT.designs.length+AGENT_CONTENT.tasks.length), x:'', r:'#/agent' },
      { n:'Python 数据分析案例', v:pcaseDone, t:PY_CASES.length, x:'另有 ' + pys.total + ' 道代码实例题', r:'#/python' },
      { n:'AI 产品经理', v:(aipmQ.done + aipmPrd), t:(aipmQ.total + AIPM_PRD_TASKS.length), x:'面试题已准备 ' + aipmIv + '/' + (typeof AIPM_INTERVIEW !== 'undefined' ? AIPM_INTERVIEW.length : 0), r:'#/aipm' }
    ];
    rows.forEach(function (r2) {
      var pct = r2.t ? Math.round(r2.v / r2.t * 100) : 0;
      var col = pct >= 100 ? 'var(--green)' : (pct > 0 ? 'var(--accent)' : 'var(--text3)');
      h += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">' +
           '<a href="' + r2.r + '" style="flex:1;min-width:0;font-size:12px;color:var(--text2);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r2.n) + (r2.x ? ' <span style="font-size:9.5px;color:var(--text3)">' + esc(r2.x) + '</span>' : '') + '</a>' +
           '<span style="width:96px;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden;flex:0 0 auto"><span class="barfill" style="display:block;height:100%;width:' + pct + '%;background:' + col + ';border-radius:3px"></span></span>' +
           '<span style="font-size:10.5px;font-family:var(--mono);color:' + col + ';width:52px;text-align:right;flex:0 0 auto">' + r2.v + '/' + r2.t + '</span></div>';
    });
    h += '<div class="muted" style="margin-top:9px">训练数据只存在你的浏览器（localStorage），换设备不会同步。</div>';
    h += '</div>';

    /* ===== 训练模块 ===== */
    h += '<div class="sec-t">训练模块（' + MODULES.length + ' 个）</div><div class="mods stagger">';
    MODULES.forEach(function (mo) {
      var badge = mo.ready ? '<span class="badge on">● 已上线</span>' : '<span class="badge soon">规划中</span>';
      if (mo.hot) badge += ' <span class="badge hot">从这里开始</span>';
      h += '<a class="card hoverable mod m' + mo.m + '" href="' + mo.r + '">' +
           '<span class="shine"></span>' +
           '<span class="mi">' + mo.icon + '</span><div class="mt">' + esc(mo.t) + '</div>' +
           '<div class="md">' + esc(mo.d) + '</div>' +
           '<div class="mf">' + badge + '<span class="muted mono">M' + mo.m + '</span></div></a>';
    });
    h += '</div>';

    /* ===== 数据说明 ===== */
    if (typeof DATASET_META !== 'undefined') {
      h += '<div class="sec-t">训练数据集</div><div class="card" style="padding:14px 16px">';
      h += '<div style="font-size:12.5px;font-weight:700;margin-bottom:5px">' + esc(DATASET_META.name) + '</div>';
      h += '<div class="muted" style="white-space:pre-line;line-height:1.85;margin-bottom:10px">' + esc(DATASET_META.note) + '</div>';
      h += '<div class="dsgrid">';
      DATASET_META.tables.forEach(function (t) {
        h += '<a class="dscard" href="#/data" style="text-decoration:none;display:block"><b>' + esc(t.name) + '</b> <span class="r">' + t.rows + ' 行</span><p>' + esc(t.desc) + '</p></a>';
      });
      h += '</div><div class="muted" style="margin-top:9px">点击任意表可在线查看字段结构与数据，不需要下载。</div></div>';
    }

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
    '#/plan': function (host) { PlanModule.mount(host); },
    '#/sql': function (host) { SQLModule.mount(host); },
    '#/data': function (host) { DataModule.mount(host); },
    '#/python': function (host) { PyCaseModule.mount(host); },
    '#/aipm': function (host) { AipmModule.mount(host); },
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
    '#/agent': function (host) { AgentModule.mount(host); },
    '#/radar': function (host) { RadarModule.mount(host); }
  };

  /* 路由 → 模块配色作用域（让每个模块的主标题/强调色不同） */
  var MOD_CLASS = {
    '#/plan': 'm0', '#/sql': 'm1', '#/lab': 'm2', '#/metrics': 'm3', '#/abtest': 'm4',
    '#/case': 'm5', '#/agent': 'm6', '#/radar': 'm7',
    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10'
  };

  function nav() {
    var hash = location.hash || '#/home';
    if (!ROUTES[hash]) hash = '#/home';
    var host = document.getElementById('view');
    if (!host) return;
    host.className = 'fadein' + (MOD_CLASS[hash] ? ' ' + MOD_CLASS[hash] : '');
    ROUTES[hash](host);
    Array.prototype.forEach.call(document.querySelectorAll('.nav a[href^="#/"]'), function (a) {
      a.classList.toggle('on', a.getAttribute('href') === hash);
    });
    if (hash === '#/plan') { try { PlanModule.onShow(); } catch (e) {} }
    if (hash === '#/sql') { try { SQLModule.onShow(); } catch (e) {} }
    if (hash === '#/lab') { try { LabModule.onShow(); } catch (e) {} }
    if (hash === '#/metrics' || hash === '#/abtest') { try { QuizModule.onShow(); } catch (e) {} }
    if (hash === '#/case') { try { CaseModule.onShow(); } catch (e) {} }
    if (hash === '#/agent') { try { AgentModule.onShow(); } catch (e) {} }
    if (hash === '#/radar') { try { RadarModule.onShow(); } catch (e) {} }
    if (hash === '#/python') { try { PyCaseModule.onShow(); } catch (e) {} }
    if (hash === '#/data') { try { DataModule.onShow(); } catch (e) {} }
    if (hash === '#/aipm') { try { AipmModule.onShow(); } catch (e) {} }
    /* 同步导出进度摘要（供同源的个人网站读取） */
    try { TP.exportSummary(); } catch (e) {}
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
    zh_initThemeUI();
    window.addEventListener('hashchange', nav);
    nav();
    if (/[?&]selftest=1/.test(location.search)) selfTest();
  }

  return { boot: boot, soon: function (n) { location.hash = '#/home'; setTimeout(function () { renderSoon(document.getElementById('view'), n); }, 30); }, ABILITY: ABILITY };
})();

document.addEventListener('DOMContentLoaded', App.boot);
