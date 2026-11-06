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
    { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true },
    { m: 11, icon: '🔄', t: 'AI 工作流实验室', d: '110 题（36 核心 + 72 变式 + 2 关底挑战，按题族组织）', r: '#/workflow', ready: true, hot: true },
    { m: 12, icon: '🎙️', t: '语音复述训练', d: '朗读给定材料 → 浏览器转写 → 计算字符错误率并标出漏字/说错的字 · 不需要 API Key · 测的是数字与术语的准确度', r: '#/speech', ready: true },
    { m: 13, icon: '🎓', t: '学习学院', d: '系统分层教学：每课 15-25 分钟，7 步走完（场景 → 核心图 → 例题 → 带提示阶梯的引导练习 → 独立变式 → 迁移产物 → 3 天后复测）· 先开 2 课样板', r: '#/academy', ready: true, hot: true },
    { m: 14, icon: '🎯', t: '预测日志', d: '把「我判断得准不准」变成数字：记下判断与概率 → 到期判定对错 → 算 Brier 分数与校准表（说 70% 的那些是不是真的对了七成）', r: '#/predict', ready: true },
  ];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 首页 ---------- */
  function renderHome(host) {
    /* ===== 极简首页 =====
       刻意不再放：等级条、成长币、账本、复查队列、连击天数。
       用户原话：「还是看我自己想不想学习，而不是靠游戏风格去刺激我学习」。
       所以这里只回答三件事：我在做什么 / 从哪开始 / 上次到哪了。 */
    var st = null;
    try { st = TP.stats(SQL_QUESTIONS.length); } catch (e) {}
    var learnedN = 0, readyN = 0;
    try {
      if (typeof ACADEMY_COURSES !== 'undefined') {
        ACADEMY_COURSES.forEach(function (c) {
          c.units.forEach(function (u) {
            if (u.status === 'ready') {
              readyN++;
              if (TP.getNote('academy', u.id + '_learned') === '1') learnedN++;
            }
          });
        });
      }
    } catch (e) {}
    var predN = 0, predDue = 0;
    try {
      if (typeof Predict !== 'undefined') {
        var ps2 = Predict.stats(Predict.load());
        predN = ps2.total; predDue = ps2.due;
      }
    } catch (e) {}

    var h = '';

    /* ---- 1 定位 + 状态 ---- */
    h += '<div class="home-hero2">';
    h += '<div class="home-kicker">策略分析 · 能力训练</div>';
    h += '<div class="home-title">把<em>重复劳动</em>变成可以被检查的流程</div>';
    h += '<div class="home-sub">经营分析 / 商业化运营 / 渠道质量 / 增量评估这四个方向，靠的是同一件事：' +
         '看见数字背后发生了什么，并说清凭什么。这个平台只做一件事——把「会了」变成可验证的。</div>';
    h += '<div class="home-stat">';
    h += '<div><b>' + learnedN + '/' + readyN + '</b><span>学院已学 / 可学</span></div>';
    h += '<div><b>' + (st ? st.done : 0) + '</b><span>SQL 已通过</span></div>';
    h += '<div><b>' + predN + '</b><span>记录中的预测</span></div>';
    h += '</div></div>';

    /* ---- 2 三个入口 ---- */
    h += '<div class="home-entries">';
    h += '<a class="home-entry" href="#/academy">' +
         '<div class="he-k">01 · 系统学</div>' +
         '<div class="he-t">学习学院</div>' +
         '<div class="he-d">15 门课 / 88 个单元，由浅入深。每单元 7 步：场景 → 核心图 → 例题 → 带提示的练习 → 变式 → 产物 → 3 天后复测。</div>' +
         '<div class="he-a">从金融 · 指数与估值开始 →</div></a>';
    h += '<a class="home-entry" href="#/sql">' +
         '<div class="he-k">02 · 动手练</div>' +
         '<div class="he-t">专项训练</div>' +
         '<div class="he-d">SQL 31 题 · 数据集实验室 · 指标设计 · 实验分析 · Case 拆解 · AI 工作流 110 题 · 语音复述。</div>' +
         '<div class="he-a">去 SQL 训练场 →</div></a>';
    h += '<a class="home-entry" href="#/predict">' +
         '<div class="he-k">03 · 检验判断</div>' +
         '<div class="he-t">预测日志</div>' +
         '<div class="he-d">写下判断和概率，到期判定对错，算出 Brier 分数与校准表。' +
         (predDue ? '<b style="color:var(--rd)">　有 ' + predDue + ' 条到期待判定</b>' : '') + '</div>' +
         '<div class="he-a">' + (predN ? '看我的校准' : '记第一条预测') + ' →</div></a>';
    h += '</div>';

    /* ---- 2.5 训练场概览（整体说明） ---- */
    h += '<div class="home-sec">';
    h += '<div class="home-sec-h"><h3>这个训练场是什么</h3><span>一句话：它不教我「知道」，只验证我「会」</span></div>';
    h += '<div class="home-about">' +
         '<p>个人网站解决「我今天该关注什么」（信息中枢）；这里解决「我这项能力到底行不行」（刻意练习）。' +
         '三件事分开做：<b>系统学</b>（有人讲清为什么）→ <b>专项练</b>（动手做，自动判分）→ <b>检验判断</b>（写下预测，到期验证）。' +
         '全部纯前端，数据只存在本机浏览器，不上传任何服务器。</p>' +
         '</div>';
    h += '<div class="home-about-grid">';
    h += '<div><b>学</b><span>学习学院 · 15 门课 / 88 个单元</span><em>分 L0 元能力 / L1 决策素养 / L2 求职主线三层，每单元 7 步、以实战收尾</em></div>';
    h += '<div><b>练</b><span>专项训练 · 7 个模块 / 182 道题</span><em>SQL 31 · 数据集实验室 12 · 指标设计 8 · 实验分析 9 · Case 拆解 7 · AI 工作流 110 · 语音复述 5</em></div>';
    h += '<div><b>验</b><span>预测日志 + Brier 校准</span><em>写下判断与概率 → 到期判定对错 → 算出「说 70% 的那些是不是真对了七成」</em></div>';
    h += '</div>';

    /* 完整模块清单 */
    h += '<details class="acc" style="margin-top:12px"><summary>查看全部 15 个模块（各练什么）</summary><div class="accbody">';
    h += '<table class="home-tbl"><tr><th>模块</th><th>内容量</th><th>练什么</th></tr>';
    var MODROWS = [
      ['学习学院', '15 门课 / 88 单元', '系统教学：概念 + 核心图 + 例题 + 引导练习 + 变式 + 产物 + 复测'],
      ['预测日志', '—', '判断力校准：概率、Brier 分数、过度/欠自信'],
      ['SQL 训练场', '31 题 · 5 难度层', 'SQL 写法与自动判分（面试会现场出题）'],
      ['数据集实验室', '12 题 · 30 条参考 SQL', '分析思路：拆哪个维度、用什么口径'],
      ['指标设计', '8 场景 · 70 个候选指标', '辨别虚荣指标 / 存量指标 / 不可归因指标'],
      ['实验分析', '9 个 A/B 判读', 'peeking、护栏指标、分层异质性、分流质量'],
      ['Case 拆解', '7 个现象 · 34 个原因假设', '结构化拆解：列假设 → 设计验证 → 给方案'],
      ['AI 工作流', '110 题（36 核心 + 72 变式 + 2 挑战）', '把重复劳动拆成可检查的流程：工具 / 人工点 / 验收'],
      ['语音复述', '5 段材料 · CER 评分', '口头表达准确度：数字与术语最容易说错'],
      ['AI Agent 实操', '判读 3 + 实操 4 + 模板 3', '算清提效，而不是只看生成速度'],
      ['AI 产品经理', '判读 12 + PRD 4 + 面试 18', '（选修）AI 适用性、验收标准、成本测算、PRD 表达'],
      ['Python 案例', '22 个案例 + 6 道代码题', 'pandas 常用套路（读取/清洗/聚合/留存/统计）'],
      ['数据集', '4 张表在线预览', '字段结构与分页浏览，免下载'],
      ['30 天计划', '30 天 / 91 个任务', '从 0 开始的每日安排'],
      ['能力雷达', '9 维自评', '对照岗位要求，看先补哪个短板收益最高']
    ];
    MODROWS.forEach(function (r) {
      h += '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
    });
    h += '</table></div></details>';
    h += '</div>';

    /* ---- 3 接着上次 ---- */
    var lastUnit = null, lastUnitAt = null;
    try {
      if (typeof ACADEMY_COURSES !== 'undefined') {
        ACADEMY_COURSES.forEach(function (c) {
          c.units.forEach(function (u) {
            if (u.status !== 'ready') return;
            var t = TP.getNote('academy', u.id + '_retest');
            if (t && (!lastUnitAt || t > lastUnitAt)) { lastUnitAt = t; lastUnit = { c: c, u: u }; }
          });
        });
      }
    } catch (e) {}

    h += '<div class="home-sec">';
    h += '<div class="home-sec-h"><h3>接着上次</h3><span>' + (lastUnit ? '复测排在 ' + lastUnitAt : '还没有安排复测的单元') + '</span></div>';
    if (lastUnit) {
      h += '<a class="home-row" href="#/academy">' +
           '<span class="home-row-t">' + esc(lastUnit.c.name) + ' · ' + esc(lastUnit.u.title) + '</span>' +
           '<span class="home-row-m">' + esc(lastUnit.u.depth) + ' · 复测 ' + lastUnitAt + '</span></a>';
    } else {
      h += '<a class="home-row" href="#/academy">' +
           '<span class="home-row-t">金融 · 指数与估值：为什么「上证涨了」不等于你赚钱了</span>' +
           '<span class="home-row-m">22 分钟 · 零基础</span></a>';
    }
    if (st && st.done > 0) {
      h += '<a class="home-row" href="#/sql">' +
           '<span class="home-row-t">SQL 训练场</span>' +
           '<span class="home-row-m">已完成 ' + st.done + ' / ' + st.total + ' · 一次做对率 ' + (st.firstTryRate || 0) + '%</span></a>';
    }
    h += '</div>';


    /* ---- 5 折叠的技术说明（保留原内容，默认收起） ---- */
    h += '<details class="acc" style="margin-top:8px"><summary>关于这个平台（设计取舍与技术说明）</summary><div class="accbody">';
    h += '<div style="font-size:12.5px;color:var(--text2);line-height:1.95">' +
         '<b>为什么没有等级、金币、签到</b>　试过，但对我没用。真正决定我学不学的是「这件事我到底会不会」，' +
         '不是游戏化的即时反馈。所以首页只保留真实状态数字，不做激励包装。<br><br>' +
         '<b>学院为什么分批写</b>　一门课 8-9 个单元，如果只写第 1 个，看到的只是皮毛。' +
         '目前金融课 9 个单元已全部写完，其余课程按顺序继续。' +
         '先把 15 门课的全部 88 个单元大纲定下来，确认序列值得写，再按顺序批量做内容。<br><br>' +
         '<b>为什么强调「学完只标已学习」</b>　读完不等于掌握。掌握要看 3 天后不看原文能不能答出来 —— ' +
         '所以每个单元都排了复测。' +
         '</div>';
    h += '</div></details>';

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
  '#/workflow': function (host) { WorkflowModule.mount(host); },
  '#/speech': function (host) { SpeechModule.mount(host); },
'#/academy': function (host) { AcademyModule.mount(host); },
'#/predict': function (host) { Predict.mount(host); },
    '#/agent': function (host) { AgentModule.mount(host); },
    '#/radar': function (host) { RadarModule.mount(host); }
  };

  /* 路由 → 模块配色作用域（让每个模块的主标题/强调色不同） */
  var MOD_CLASS = {
    '#/plan': 'm0', '#/sql': 'm1', '#/lab': 'm2', '#/metrics': 'm3', '#/abtest': 'm4',
    '#/case': 'm5', '#/agent': 'm6', '#/radar': 'm7',
    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10', '#/workflow': 'm11', '#/speech': 'm12', '#/academy': 'm13', '#/predict': 'm14'
  };

  function nav() {
    var hash = location.hash || '#/home';
    if (!ROUTES[hash]) hash = '#/home';
    var host = document.getElementById('view');
    if (!host) return;
    host.className = 'fadein' + (MOD_CLASS[hash] ? ' ' + MOD_CLASS[hash] : '');
    ROUTES[hash](host);
    Array.prototype.forEach.call(document.querySelectorAll('.side-group a[href^="#/"]'), function (a) {
      a.classList.toggle('on', a.getAttribute('href') === hash);
    });
    if (hash === '#/plan') { try { PlanModule.onShow(); } catch (e) {} }
    if (hash === '#/sql') { try { SQLModule.onShow(); } catch (e) {} }
    if (hash === '#/lab') { try { LabModule.onShow(); } catch (e) {} }
    if (hash === '#/metrics' || hash === '#/abtest') { try { QuizModule.onShow(); } catch (e) {} }
    if (hash === '#/case') { try { CaseModule.onShow(); } catch (e) {} }
    if (hash === '#/agent') { try { AgentModule.onShow(); } catch (e) {} }
  if (hash === '#/workflow') { try { WorkflowModule.onShow(); } catch (e) {} }
  if (hash === '#/speech') { try { SpeechModule.onShow(); } catch (e) {} }
  if (hash === '#/academy') { try { AcademyModule.onShow(); } catch (e) {} }
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

/* 侧边栏折叠（状态存 localStorage，刷新后保持） */
(function () {
  function applyFold(v) {
    var side = document.getElementById('side');
    var btn = document.getElementById('sideFold');
    if (!side) return;
    side.classList.toggle('folded', !!v);
    if (btn) btn.textContent = v ? '›' : '‹';
    try { localStorage.setItem('tp_side_folded', v ? '1' : '0'); } catch (e) {}
  }
  function init() {
    var btn = document.getElementById('sideFold');
    if (!btn) return;
    var saved = null;
    try { saved = localStorage.getItem('tp_side_folded'); } catch (e) {}
    if (saved === '1') applyFold(true);
    btn.onclick = function () {
      var side = document.getElementById('side');
      applyFold(!(side && side.classList.contains('folded')));
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
