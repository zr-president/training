/* 远征指挥台（方案 G08-lite）+ 每日任务（G02-lite）
   首页只回答一个问题：**现在该做什么**。
   其余说明性内容收进下方，不占首屏。

   两个刻意的设计：
   1. 今日任务按「可用时间」给三档（15/30/60 分钟），并显示推荐原因、允许替换
   2. 求职进展与训练进度并排 —— 训练场再好也不能假装「投递 = 0」这件事不存在
      （投递数据来自个人站的 zh_apply_count / zh_apply_状态_*，两站同源） */
var CommandPanel = (function () {
  var BUDGET_KEY = 'tp_cmd_budget';
  var STATE_KEY = 'tp_cmd_state';
  var PLAN_KEY = 'tp_cmd_plan';

  /* 单项耗时预算（分钟） */
  var MIN = { review: 4, regular: 11, challenge: 25 };
  var BUDGETS = {
    15: { label: '15 分钟', want: { review: 1, regular: 1, challenge: 0 } },
    30: { label: '30 分钟', want: { review: 1, regular: 1, challenge: 1 } },
    60: { label: '60 分钟', want: { review: 2, regular: 2, challenge: 1 } }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------------- 偏好状态 ---------------- */
  function getBudget() {
    var b = parseInt(ls(BUDGET_KEY), 10);
    return BUDGETS[b] ? b : 30;
  }
  function setBudget(b) { if (BUDGETS[b]) lsSet(BUDGET_KEY, String(b)); }

  function getState() {
    var o = {};
    try { o = JSON.parse(ls(STATE_KEY) || '{}') || {}; } catch (e) {}
    if (!o.offset) o.offset = 0;
    if (!Array.isArray(o.excluded)) o.excluded = [];
    if (!o.day) o.day = Ledger.learningDay();
    /* 跨学习日自动重置替换记录 */
    if (o.day !== Ledger.learningDay()) { o.offset = 0; o.excluded = []; o.day = Ledger.learningDay(); }
    return o;
  }
  function saveState(o) { lsSet(STATE_KEY, JSON.stringify(o)); }

  /* ---------------- 跨站：求职进展 ---------------- */
  function jobStats() {
    var week = parseInt(ls('zh_apply_count') || '0', 10) || 0;
    var companies = [], i, k;
    try {
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (k && k.indexOf('zh_apply_状态_') === 0) companies.push(k.slice('zh_apply_状态_'.length));
      }
    } catch (e) {}

    var dist = { '未投递': 0, '已投递': 0, '约面': 0, '面试中': 0, '已拒绝': 0, '无回应': 0 };
    companies.forEach(function (nm) {
      var st = ls('zh_apply_状态_' + nm) || '未投递';
      if (dist[st] === undefined) dist[st] = 0;
      dist[st]++;
    });
    var applied = companies.length - (dist['未投递'] || 0);
    return { week: week, total: companies.length, applied: applied, dist: dist };
  }

  /* ---------------- 候选池 ---------------- */
  /* 每项：{qid, title, kind, minutes, reason, pri}
     kind: review（到期复习）/ weak（薄弱重做）/ fresh（未做过） */
  function candidates() {
    var out = [];
    var list;
    try { list = WorkflowModule._review(); } catch (e) { list = []; }

    list.forEach(function (x) {
      var q = x.q;
      var isCh = (q.kind === 'challenge');
      var base = isCh ? MIN.challenge : MIN.regular;

      if (x.pri === 0) {
        /* 需重做：自评 < 60% */
        out.push({
          qid: q.id, title: q.title, kind: 'weak', minutes: base, pri: 0,
          reason: '自评 ' + x.score + '/' + x.max + '（低于 60%）' +
                  (x.days === null ? '，还没做第二次' : '，距上次 ' + x.days + ' 天')
        });
      } else if (x.pri === 1 && x.due) {
        /* 建议复查且到期 */
        out.push({
          qid: q.id, title: q.title, kind: 'review', minutes: MIN.review, pri: 1,
          reason: '到期复查：' + (x.days === null ? '未记录时间' : x.days + ' 天前自评 ' + x.score + '/' + x.max)
        });
      } else if (x.pri === 3) {
        /* 未自评：区分核心 / 变式 / 挑战，便按时间预算搭配 */
        var kk = (q.kind === 'challenge') ? 'challenge' : 'fresh';
        out.push({
          qid: q.id, title: q.title, kind: kk, minutes: base, pri: (q.kind === 'variant' ? 3 : 2),
          reason: (q.kind === 'challenge' ? '关底挑战，要交实际产物' : (q.kind === 'variant' ? '变式题，验证真的会' : '核心题，这个题族的第一道'))
        });
      }
    });

    /* 同类内保持原顺序（_review 已按优先级与天数排好） */
    out.sort(function (a, b) { if (a.pri !== b.pri) return a.pri - b.pri; return 0; });
    return out;
  }

  /* 当天的任务必须冻结
     否则：你做完第一题 → 它变成「已掌握」→ 计划重排成新题 → 「全部完成」永远不成立。
     所以把选好的项整份存下来，当天复用；「换一组 / 换一项 / 改时间档」才重建。 */
  function savePlan(day, budget, items) {
    lsSet(PLAN_KEY, JSON.stringify({ day: day, budget: budget, items: items }));
  }
  function loadPlan(day, budget) {
    var o = null;
    try { o = JSON.parse(ls(PLAN_KEY) || 'null'); } catch (e) {}
    if (!o || o.day !== day || o.budget !== budget || !Array.isArray(o.items) || !o.items.length) return null;
    return o.items.filter(function (it) { return it && it.qid && it.minutes; });
  }
  function clearPlan() { lsSet(PLAN_KEY, ''); }

  /* 当前计划：当天已冻结过就复用，否则新建并冻结 */
  function currentPlan(budget) {
    var day = Ledger.learningDay();
    var cached = loadPlan(day, budget);
    if (cached && cached.length) {
      var tot = cached.reduce(function (a, p) { return a + p.minutes; }, 0);
      return { budget: budget, label: (BUDGETS[budget] || BUDGETS[30]).label, items: cached, total: tot };
    }
    var p = buildPlan(budget);
    savePlan(day, budget, p.items);
    return p;
  }

  /* 按预算组一份计划
     按「时间预算」填，不按条数 —— 否则 30 分钟只给一道 11 分钟的题。
     顺序：到期复习 → 薄弱重做 → 60 分钟档加一个关底挑战 → 用剩余时间补新题 */
  function buildPlan(budget) {
    var cfg = BUDGETS[budget] || BUDGETS[30];
    var target = budget;                 /* 分钟 */
    var slack = 6;                       /* 允许轻微超出，避免为了卡时间而少给题 */
    var st = getState();
    var pool = candidates().filter(function (c) { return st.excluded.indexOf(c.qid) < 0; });

    var picks = [], used = {}, total = 0;
    function addItem(c) {
      if (!c || used[c.qid]) return false;
      used[c.qid] = 1; picks.push(c); total += c.minutes; return true;
    }

    /* 1) 到期复习（60 分钟档最多 2 项） */
    var reviews = pool.filter(function (c) { return c.kind === 'review'; });
    reviews.slice(0, budget >= 60 ? 2 : 1).forEach(addItem);

    /* 2) 薄弱重做（只要还有时间余量就加） */
    var weak = pool.filter(function (c) { return c.kind === 'weak' && !used[c.qid]; })[0];
    if (weak && total + weak.minutes <= target + slack) addItem(weak);

    /* 3) 60 分钟档：优先放一个关底挑战 */
    if (budget >= 60) {
      var ch = pool.filter(function (c) { return c.kind === 'challenge' && !used[c.qid]; })[0];
      if (ch && total + ch.minutes <= target + slack + 10) addItem(ch);
    }

    /* 4) 用剩余时间补新题：核心题优先，变式次之 */
    var fresh = pool.filter(function (c) { return c.kind === 'fresh' && !used[c.qid]; });
    fresh.sort(function (a, b) { return a.pri - b.pri; });
    for (var i = 0; i < fresh.length; i++) {
      if (total >= target) break;
      if (total + fresh[i].minutes > target + slack) continue;
      addItem(fresh[i]);
    }

    /* 5) 15 分钟档可能一项都没有（一条复习 4 分钟太少时）→ 至少给一项 */
    if (!picks.length && pool.length) addItem(pool[0]);

    /* 6) offset：整体轮换（「换一组」用） */
    if (st.offset > 0 && picks.length > 1) {
      var rot = st.offset % picks.length;
      picks = picks.slice(rot).concat(picks.slice(0, rot));
    }

    var sum = picks.reduce(function (a, p) { return a + p.minutes; }, 0);
    return { budget: budget, label: cfg.label, items: picks, total: sum };
  }

  /* 某项是否已算“有进展” */
  function itemDone(qid) {
    try {
      if (TP.isOpenDone('workflow', qid)) return true;
      var q = null;
      for (var i = 0; i < WORKFLOW_QUESTIONS.length; i++) if (WORKFLOW_QUESTIONS[i].id === qid) { q = WORKFLOW_QUESTIONS[i]; break; }
      if (!q) return false;
      var dims = (q.kind === 'challenge')
        ? ['problem', 'evidence', 'method', 'result', 'limit']
        : ['a', 'b', 'c'];
      for (var j = 0; j < dims.length; j++) {
        var v = TP.getNote('workflow', qid + '_score_' + dims[j]);
        if (v !== null && v !== undefined && v !== '') return true;
      }
    } catch (e) {}
    return false;
  }

  function cmdSay(msg, ok) {
    var t = document.getElementById('cmdToast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = ok ? 'var(--em)' : 'var(--rd)';
    t.classList.add('show');
    clearTimeout(cmdSay._tm);
    cmdSay._tm = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  /* ---------------- 渲染：等级条 ---------------- */
  function levelBar() {
    /* xpSummary() 返回：{xp, level, inLevel, need, accAt, nextAt, toNext, ...} */
    var d = { xp: 0, level: 1, inLevel: 0, need: 100 };
    try {
      var r = TP.xpSummary();
      if (r && typeof r.level === 'number') d = r;
    } catch (e) {}
    var pct = d.need ? Math.min(100, Math.round(d.inLevel / d.need * 100)) : 0;
    return '<div style="margin-bottom:10px">' +
      '<div class="row" style="justify-content:space-between;align-items:baseline;margin-bottom:5px">' +
      '<div><span style="font-size:20px;font-weight:800;color:var(--text)">Lv.' + d.level + '</span>' +
      '<span style="font-size:12px;color:var(--text3);margin-left:6px">累计 ' + d.xp + ' XP</span></div>' +
      '<div style="font-size:12px;color:var(--text3);font-family:var(--mono)">' + d.inLevel + ' / ' + d.need + '</div></div>' +
      '<div style="height:9px;background:var(--bg2);border-radius:99px;overflow:hidden;border:1px solid var(--border)">' +
      '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--cy),var(--vi));border-radius:99px;transition:width .4s"></div>' +
      '</div></div>';
  }

  /* ---------------- 渲染：今日任务 ---------------- */
  function renderPlan() {
    var box = document.getElementById('cmdPlan');
    if (!box) return;
    var budget = getBudget();
    var plan = currentPlan(budget);
    var st = getState();
    var doneCount = plan.items.filter(function (p) { return itemDone(p.qid); }).length;
    var allDone = plan.items.length > 0 && doneCount === plan.items.length;
    var claimed = false;
    try { claimed = Ledger.has('daily', 'taskgroup'); } catch (e) {}

    var h = '';
    /* 时间选择 */
    h += '<div class="row" style="gap:6px;margin-bottom:12px">';
    [15, 30, 60].forEach(function (b) {
      var on = (b === budget);
      h += '<button class="btn' + (on ? ' primary' : ' ghost') + ' cmd-budget" data-b="' + b + '" ' +
           'style="padding:6px 14px;font-size:12px">' + BUDGETS[b].label + '</button>';
    });
    h += '<span style="font-size:12px;color:var(--text3);margin-left:4px">今天有多少时间？</span></div>';

    /* 任务列表 */
    if (!plan.items.length) {
      h += '<div style="font-size:13px;color:var(--text3);line-height:1.8">暂时没有可推荐的任务（题库没加载成功？）。</div>';
    } else {
      h += '<div style="display:flex;flex-direction:column;gap:8px">';
      plan.items.forEach(function (p, idx) {
        var done = itemDone(p.qid);
        var color = p.kind === 'weak' ? 'var(--rd)' : (p.kind === 'review' ? 'var(--am)' : (p.kind === 'challenge' ? 'var(--vi)' : 'var(--cy)'));
        h += '<div class="card" style="padding:11px 13px;border-left:3px solid ' + color + ';margin:0' +
             (done ? ';opacity:.62' : '') + '">' +
             '<div class="row" style="justify-content:space-between;gap:10px;align-items:flex-start">' +
             '<div style="min-width:0;flex:1">' +
             '<div style="font-size:13px;font-weight:700;color:var(--text);line-height:1.5">' +
             (done ? '✅ ' : '') + esc(p.title) + '</div>' +
             '<div style="font-size:12px;color:var(--text3);margin-top:3px;line-height:1.6">' +
             '<b style="color:' + color + '">推荐原因</b>　' + esc(p.reason) + '</div>' +
             '<div style="font-size:12px;color:var(--text3);margin-top:2px">约 ' + p.minutes + ' 分钟</div>' +
             '</div>' +
             '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">' +
             '<button class="btn primary cmd-go" data-q="' + p.qid + '" style="padding:5px 13px;font-size:12px">' + (done ? '再看' : '开始') + '</button>' +
             '<button class="btn ghost cmd-swap" data-q="' + p.qid + '" style="padding:4px 10px;font-size:12px">换一项</button>' +
             '</div></div></div>';
      });
      h += '</div>';

      /* 进度与领币 */
      h += '<div class="row" style="justify-content:space-between;margin-top:11px;gap:10px;flex-wrap:wrap">' +
           '<div style="font-size:12px;color:var(--text3)">预计 ' + plan.total + ' 分钟 · 已完成 ' + doneCount + '/' + plan.items.length + '</div>' +
           '<div class="row" style="gap:6px">' +
           '<button class="btn ghost cmd-reroll" style="padding:5px 12px;font-size:12px">换一组</button>' +
           (allDone
             ? (claimed
                 ? '<span style="font-size:12px;color:var(--em);font-weight:700">✅ 今日 10 币已领</span>'
                 : '<button class="btn primary cmd-claim" style="padding:5px 14px;font-size:12px">领今日 10 成长币</button>')
             : '<span style="font-size:12px;color:var(--text3)">全部有进展后可领 10 币</span>') +
           '</div></div>';
    }

    box.innerHTML = h;

    /* 绑定 */
    Array.prototype.forEach.call(box.querySelectorAll('.cmd-budget'), function (b) {
      b.onclick = function () { setBudget(parseInt(b.getAttribute('data-b'), 10)); var o = getState(); o.offset = 0; o.excluded = []; saveState(o); clearPlan(); renderPlan(); };
    });
    Array.prototype.forEach.call(box.querySelectorAll('.cmd-go'), function (b) {
      b.onclick = function () {
        try { location.hash = '#/workflow'; } catch (e) {}
        setTimeout(function () {
          var el = document.querySelector('#wfMain [data-wid], .qitem[data-wid="' + b.getAttribute('data-q') + '"]');
          var li = document.querySelector('[data-wid="' + b.getAttribute('data-q') + '"]');
          if (li) li.click();
        }, 260);
      };
    });
    Array.prototype.forEach.call(box.querySelectorAll('.cmd-swap'), function (b) {
      b.onclick = function () {
        var o = getState();
        o.excluded.push(b.getAttribute('data-q'));
        if (o.excluded.length > 12) o.excluded = o.excluded.slice(-12);
        saveState(o); clearPlan(); renderPlan();
      };
    });
    var rr = box.querySelector('.cmd-reroll');
    if (rr) rr.onclick = function () { var o = getState(); o.offset++; o.excluded = []; saveState(o); clearPlan(); renderPlan(); };
    var cl = box.querySelector('.cmd-claim');
    if (cl) cl.onclick = function () { claimDaily(); };
  }

  /* ---------------- 领今日成长币 ---------------- */
  function claimDaily() {
    var r = Ledger.add('daily', 'taskgroup', 10, {});
    var t = document.getElementById('cmdToast');
    if (t) {
      t.textContent = r.ok ? '已领取今日 10 成长币 ✅' : (r.reason === 'duplicate' ? '今天已经领过了' : '领取失败：' + r.reason);
      t.classList.add('show');
      clearTimeout(claimDaily._tm);
      claimDaily._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
    }
    renderAll();
  }

  /* ---------------- 渲染：求职进展（反逃避） ---------------- */
  function renderJob() {
    var box = document.getElementById('cmdJob');
    if (!box) return;
    var j = jobStats();
    var TARGET = 20;
    var pct = Math.min(100, Math.round(j.week / TARGET * 100));
    var appliedPct = j.total ? Math.round(j.applied / j.total * 100) : 0;

    var h = '';
    h += '<div class="row" style="justify-content:space-between;align-items:baseline;margin-bottom:8px">' +
         '<div><span style="font-size:20px;font-weight:800;color:' + (j.week ? 'var(--em)' : 'var(--rd)') + '">' + j.week + '</span>' +
         '<span style="font-size:12px;color:var(--text3);margin-left:5px">家 / 目标 ' + TARGET + '</span></div>' +
         '<div style="font-size:12px;color:var(--text3)">本周投递</div></div>';
    h += '<div style="height:9px;background:var(--bg2);border-radius:99px;overflow:hidden;border:1px solid var(--border);margin-bottom:10px">' +
         '<div style="height:100%;width:' + pct + '%;background:var(--em);border-radius:99px"></div></div>';

    if (j.total) {
      h += '<div style="font-size:12px;color:var(--text2);line-height:1.8">已记录 ' + j.total + ' 家（已投 ' + j.applied + '）';
      var parts = [];
      ['约面', '面试中', '已拒绝', '无回应'].forEach(function (k) { if (j.dist[k]) parts.push(k + ' ' + j.dist[k]); });
      if (parts.length) h += ' · ' + parts.join(' · ');
      h += '</div>';
    } else {
      h += '<div style="font-size:12px;color:var(--text3);line-height:1.8">还没有任何投递记录。</div>';
    }

    if (!j.week) {
      h += '<div style="margin-top:8px;padding:8px 10px;background:rgba(185,28,28,.07);border-radius:8px;font-size:12px;color:var(--rd);line-height:1.7">' +
           '⚠️ 本周投递还是 0。训练分数涨得再高，简历没投出去也不算进展。</div>';
    }
    h += '<div class="row" style="gap:6px;margin-top:10px">' +
         '<a class="btn ghost" href="https://zr-president.github.io/my-website/#applications" target="_blank" rel="noopener" ' +
         'style="padding:5px 12px;font-size:12px;text-decoration:none">去记投递 ↗</a></div>';

    box.innerHTML = h;
  }

  /* ---------------- 渲染：技能方向进度 ---------------- */
  function renderTracks() {
    var box = document.getElementById('cmdTracks');
    if (!box) return;
    var TRACKS = ['编排', '判断', '验收', '边界', '成本', '表达', '生活', '挑战'];
    var stat = {};
    TRACKS.forEach(function (t) { stat[t] = { done: 0, total: 0 }; });
    var list;
    try { list = WorkflowModule._review(); } catch (e) { list = []; }
    list.forEach(function (x) {
      var t = x.q.track;
      if (!stat[t]) stat[t] = { done: 0, total: 0 };
      stat[t].total++;
      if (x.pri === 2) stat[t].done++;   /* 已掌握 */
    });

    var h = '<div style="display:flex;flex-direction:column;gap:7px">';
    TRACKS.forEach(function (t) {
      var s = stat[t];
      if (!s.total) return;
      var pct = Math.round(s.done / s.total * 100);
      h += '<div>' +
           '<div class="row" style="justify-content:space-between;font-size:12px;margin-bottom:3px">' +
           '<span style="color:var(--text2);font-weight:700">' + t + '</span>' +
           '<span style="color:var(--text3);font-family:var(--mono)">' + s.done + '/' + s.total + '</span></div>' +
           '<div style="height:5px;background:var(--bg2);border-radius:99px;overflow:hidden">' +
           '<div style="height:100%;width:' + pct + '%;background:var(--cy);border-radius:99px"></div></div></div>';
    });
    h += '</div>';
    box.innerHTML = h;
  }

  /* ---------------- 渲染：账本摘要 ---------------- */
  function renderLedgerBox() {
    var box = document.getElementById('cmdLedger');
    if (!box) return;
    var coin = Ledger.coinBalance();
    var goal = Ledger.weekGoalProgress(4);
    var streak = Ledger.streakDays();
    var h = '';
    h += '<div class="row" style="justify-content:space-between;margin-bottom:9px">' +
         '<div><span style="font-size:20px;font-weight:800;color:var(--am)">' + coin + '</span>' +
         '<span style="font-size:12px;color:var(--text3);margin-left:5px">成长币</span></div>' +
         '<div style="font-size:12px;color:var(--em)">连续 ' + streak + ' 天</div></div>';

    /* 本周学习日 */
    h += '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">本周学习日 ' + goal.active + ' / ' + goal.target + (goal.done ? '　✅ 已达成' : '') + '</div>';
    h += '<div class="row" style="gap:5px;margin-bottom:10px">';
    var names = ['一', '二', '三', '四', '五', '六', '日'];
    for (var i = 0; i < 7; i++) {
      var d = Ledger.shiftDay(goal.weekStart, i);
      var on = goal.days.indexOf(d) >= 0;
      h += '<div title="' + d + '" style="flex:1;text-align:center;font-size:12px;padding:5px 0;border-radius:6px;' +
           'background:' + (on ? 'var(--em)' : 'var(--bg2)') + ';color:' + (on ? '#fff' : 'var(--text3)') + ';font-weight:' + (on ? '800' : '400') + '">' + names[i] + '</div>';
    }
    h += '</div>';
    h += '<div class="row" style="gap:6px">' +
         '<button class="btn ghost cmd-spend" style="padding:5px 12px;font-size:12px">兑换线下奖励</button>' +
         '<button class="btn ghost cmd-history" style="padding:5px 12px;font-size:12px">看账本</button>' +
         '</div>';
    h += '<div id="cmdHistory" style="margin-top:9px"></div>';
    box.innerHTML = h;

    var sp = box.querySelector('.cmd-spend');
    if (sp) sp.onclick = openSpend;
    var hi = box.querySelector('.cmd-history');
    if (hi) hi.onclick = function () { renderHistory(); };
  }

  /* 兑换：只做「你自己定的线下奖励」，不做皮肤商城 */
  function openSpend() {
    var box = document.getElementById('cmdHistory');
    if (!box) return;
    var coin = Ledger.coinBalance();
    box.innerHTML =
      '<div class="card" style="padding:11px 13px;margin:0">' +
      '<div style="font-size:12px;color:var(--text2);margin-bottom:7px">余额 <b>' + coin + '</b> 币。' +
      '奖励由你自己定 —— 系统不卖皮肤，只帮你记账。</div>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap">' +
      '<input id="cmdSpendName" placeholder="奖励名称（如：看一部电影）" style="flex:1;min-width:150px;padding:6px 9px;border:1px solid var(--border);border-radius:7px;font-size:12px;background:var(--bg2);color:var(--text)">' +
      '<input id="cmdSpendCost" type="number" min="1" value="30" style="width:76px;padding:6px 9px;border:1px solid var(--border);border-radius:7px;font-size:12px;background:var(--bg2);color:var(--text)">' +
      '<button class="btn primary cmd-do-spend" style="padding:6px 13px;font-size:12px">兑换</button>' +
      '</div></div>';
    box.querySelector('.cmd-do-spend').onclick = function () {
      var nm = (document.getElementById('cmdSpendName').value || '').trim();
      var cost = parseInt(document.getElementById('cmdSpendCost').value, 10);
      if (!nm) { cmdSay('先写个奖励名称', false); return; }
      if (!(cost > 0)) { cmdSay('花费要是正数', false); return; }
      if (cost > Ledger.coinBalance()) { cmdSay('余额不够（现有 ' + Ledger.coinBalance() + ' 币）', false); return; }
      var r = Ledger.add('spend', nm, -cost, { meta: { name: nm } });
      if (r.ok) cmdSay('已兑换：' + nm + '（-' + cost + ' 币）· 记得兑现', true);
      else cmdSay('兑换失败：' + r.reason, false);
      renderAll();
    };
  }

  function renderHistory() {
    var box = document.getElementById('cmdHistory');
    if (!box) return;
    var ev = Ledger.events().slice(-14).reverse();
    if (!ev.length) { box.innerHTML = '<div style="font-size:12px;color:var(--text3)">还没有记录。</div>'; return; }
    var h = '<div style="font-size:12px;color:var(--text3);margin-bottom:5px">最近 ' + ev.length + ' 笔</div>';
    h += '<div style="display:flex;flex-direction:column;gap:3px">';
    ev.forEach(function (e) {
      var sign = e.coin > 0 ? '+' : (e.coin < 0 ? '' : '');
      var color = e.coin > 0 ? 'var(--em)' : (e.coin < 0 ? 'var(--rd)' : 'var(--text3)');
      h += '<div class="row" style="justify-content:space-between;font-size:12px;color:var(--text3);padding:2px 0">' +
           '<span>' + esc(e.day) + ' · ' + esc((Ledger.KINDS[e.kind] || {}).label || e.kind) + ' <span style="opacity:.7">' + esc(e.key) + '</span></span>' +
           '<span style="color:' + color + ';font-family:var(--mono);font-weight:800">' + sign + (e.coin || 0) + '</span></div>';
    });
    h += '</div>';
    box.innerHTML = h;
  }

  /* ---------------- 总渲染 ---------------- */
  function renderAll() {
    renderPlan();
    renderJob();
    renderTracks();
    renderLedgerBox();
  }

  function html() {
    return '' +
      '<div style="margin-bottom:16px">' +
      '<div style="font-size:12px;color:var(--text3);letter-spacing:2px;font-weight:800;margin-bottom:4px">远征指挥台</div>' +
      '<div style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px;line-height:1.3">今天做这一组就够了</div>' +
      '</div>' +

      '<div class="cmd-grid">' +

      /* 今日任务：最大一块 */
      '<div class="card" style="padding:15px 17px;grid-column:1/-1;border-left:4px solid var(--cy)">' +
      '<div style="font-size:13px;font-weight:800;color:var(--cy);margin-bottom:10px">📋 今日任务</div>' +
      '<div id="cmdPlan"></div>' +
      '</div>' +

      /* 等级 */
      '<div class="card" style="padding:14px 16px">' +
      '<div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:9px">🎖 角色等级</div>' +
      levelBar() +
      '<div style="font-size:12px;color:var(--text3);line-height:1.7;margin-top:4px">' +
      '等级只看「做了多少」。能不能独立做对，看下面「技能方向」。</div>' +
      '</div>' +

      /* 账本 */
      '<div class="card" style="padding:14px 16px">' +
      '<div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:9px">🪙 成长账本</div>' +
      '<div id="cmdLedger"></div>' +
      '</div>' +

      /* 求职进展：反逃避 */
      '<div class="card" style="padding:14px 16px">' +
      '<div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:9px">🎯 求职进展（这笔账不能假装不存在）</div>' +
      '<div id="cmdJob"></div>' +
      '</div>' +

      /* 技能方向 */
      '<div class="card" style="padding:14px 16px">' +
      '<div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:9px">🧭 技能方向（已掌握 / 总题数）</div>' +
      '<div id="cmdTracks"></div>' +
      '</div>' +

      '</div>' +
      '<div id="cmdToast" class="toast"></div>';
  }

  function style() {
    if (document.getElementById('cmdStyle')) return;
    var s = document.createElement('style');
    s.id = 'cmdStyle';
    s.textContent =
      '.cmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;align-items:start}' +
      '.cmd-grid>*{min-width:0}' +
      '@media(max-width:860px){.cmd-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function mount(host) {
    if (!host) return;
    style();
    host.innerHTML = html();
    renderAll();
  }

  return { mount: mount, renderAll: renderAll, buildPlan: buildPlan, candidates: candidates, jobStats: jobStats, BUDGETS: BUDGETS, getBudget: getBudget, setBudget: setBudget };
})();
