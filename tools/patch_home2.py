# -*- coding: utf-8 -*-
"""替换 app.js 的 renderHome 为新的首页（求职方向 + 能力目标 + 使用方法 + 进度）"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\app.js'
c = open(FP, 'r', encoding='utf-8').read()

start = c.find('  /* ---------- 首页 ---------- */')
end = c.find('  /* ---------- 占位 ---------- */')
if start < 0 or end < 0:
    print('MISS 边界', start, end); sys.exit(1)

NEW = r'''  /* ---------- 首页 ---------- */
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

'''
c = c[:start] + NEW + c[end:]
open(FP, 'w', encoding='utf-8').write(c)
print('OK renderHome 已替换')
