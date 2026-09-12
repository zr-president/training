/* 30 天训练计划 · 每日任务打勾 */
var PlanModule = (function () {
  var START_KEY = 'tp_plan_start';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) {
    return Math.floor((new Date(b) - new Date(a)) / 86400000);
  }
  function getStart() {
    try { return localStorage.getItem(START_KEY) || null; } catch (e) { return null; }
  }
  function setStart(v) {
    try { localStorage.setItem(START_KEY, v); } catch (e) {}
  }
  /* 今天是计划的第几天（1-based）；未开始返回 0 */
  function currentDayNo() {
    var s = getStart();
    if (!s) return 0;
    return Math.max(1, daysBetween(s, todayStr()) + 1);
  }
  function taskKey(day, i) { return 'd' + day + '::' + i; }
  function dayDone(d) {
    for (var i = 0; i < d.tasks.length; i++) if (!TP.isOpenDone('plan', taskKey(d.day, i))) return false;
    return true;
  }
  function dayProgress(d) {
    var n = 0;
    for (var i = 0; i < d.tasks.length; i++) if (TP.isOpenDone('plan', taskKey(d.day, i))) n++;
    return n;
  }
  function totalStats() {
    var doneTasks = 0, totalTasks = 0, doneDays = 0;
    PLAN_DAYS.forEach(function (d) {
      totalTasks += d.tasks.length;
      doneTasks += dayProgress(d);
      if (dayDone(d)) doneDays++;
    });
    return { doneTasks: doneTasks, totalTasks: totalTasks, doneDays: doneDays,
             totalDays: PLAN_DAYS.length,
             pct: Math.round(doneTasks / totalTasks * 100) };
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var host = document.getElementById('view');
    var cur = currentDayNo();
    var s = totalStats();
    var start = getStart();

    var h = '';
    h += '<div class="h1"><span class="grad">30 天训练计划</span> · 从 0 开始</div>';
    h += '<div class="sub">' + esc(PLAN_META.intro) + '</div>';

    /* 顶部进度 + 开始/今天 */
    h += '<div class="card" style="margin-bottom:14px;padding:15px 17px">';
    h += '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px">';
    h += '<div style="flex:1;min-width:220px">';
    if (!start) {
      h += '<div style="font-size:13.5px;font-weight:800;margin-bottom:6px">准备好了就开始 —— 今天设为 Day 1</div>';
      h += '<div class="muted" style="line-height:1.8">每天 ' + esc(PLAN_META.dailyTime) + ' · 30 天覆盖全部 11 个模块<br>完成后你的 SQL / 数据分析 / 业务分析 / AI 产品能力都会有可展示的产出</div>';
      h += '<div style="margin-top:11px"><button class="btn primary" id="planStart">▶ 开始 30 天计划</button></div>';
    } else {
      var dayNo = Math.min(cur, PLAN_DAYS.length);
      var todayObj = PLAN_DAYS[dayNo - 1];
      h += '<div style="font-size:13.5px;font-weight:800;margin-bottom:6px">' +
           (cur > PLAN_DAYS.length ? '🎉 30 天计划已走完（第 ' + cur + ' 天）' : '📅 今天是第 ' + cur + ' 天 · ' + esc(todayObj.title)) + '</div>';
      h += '<div class="muted" style="line-height:1.85">开始日期：' + esc(start) +
           '　·　已完成 <b style="color:var(--green)">' + s.doneDays + '/' + s.totalDays + '</b> 天　·　任务 <b style="color:var(--accent)">' + s.doneTasks + '/' + s.totalTasks + '</b>';
      if (cur > PLAN_DAYS.length) h += '<br>如果还想继续，可以重置计划再来一轮（下面有按钮）';
      h += '</div>';
      h += '<div style="margin-top:11px" class="row">';
      if (cur <= PLAN_DAYS.length) h += '<button class="btn primary" id="planToday">🎯 跳到我今天的任务</button>';
      h += '<button class="btn" id="planReset">重置计划（重新从 Day 1 开始）</button>';
      h += '</div>';
    }
    h += '</div>';
    h += '<div class="ring" style="background:conic-gradient(var(--accent) ' + (s.pct * 3.6) + 'deg, var(--border) 0deg)"><i><b>' + s.pct + '%</b><em>任务完成</em></i></div>';
    h += '</div></div>';

    /* 阶段总览 */
    h += '<div class="sec-t">四个阶段</div><div class="mods" style="margin-bottom:6px">';
    PLAN_META.phases.forEach(function (p, i) {
      var ds = PLAN_DAYS.filter(function (d) { return d.phase === p.name; });
      var dn = ds.filter(dayDone).length;
      var pct = ds.length ? Math.round(dn / ds.length * 100) : 0;
      h += '<div class="card" style="padding:13px 15px">' +
           '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;font-weight:800;padding:1px 8px;border-radius:9px;background:var(--accent-light);color:var(--accent)">阶段 ' + (i + 1) + '</span>' +
           '<span style="font-size:12.5px;font-weight:700">' + esc(p.name) + '</span>' +
           '<span style="margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text3)">' + esc(p.days) + '</span></div>' +
           '<div style="font-size:11.5px;color:var(--text2);line-height:1.7;margin-top:6px">' + esc(p.goal) + '</div>' +
           '<div style="height:5px;background:var(--bg2);border-radius:3px;margin-top:9px;overflow:hidden"><div class="barfill" style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>' +
           '<div class="muted" style="margin-top:5px">' + dn + '/' + ds.length + ' 天完成</div>' +
           '</div>';
    });
    h += '</div>';

    /* 每日任务 */
    h += '<div class="sec-t">每日任务（点一下打勾，进度自动保存）</div>';
    var lastPhase = '';
    PLAN_DAYS.forEach(function (d) {
      if (d.phase !== lastPhase) {
        lastPhase = d.phase;
        h += '<div class="lvhead" style="font-size:11px;margin-top:12px">' + esc(d.phase) + '</div>';
      }
      var dn = dayDone(d), pr = dayProgress(d), isToday = (start && d.day === Math.min(cur, PLAN_DAYS.length));
      var border = dn ? 'var(--green)' : (isToday ? 'var(--accent)' : 'var(--border)');
      h += '<div class="card" id="plan-day-' + d.day + '" style="margin-bottom:9px;padding:12px 15px;border-left:3px solid ' + border + '">';
      h += '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">';
      h += '<span style="font-family:var(--mono);font-size:11px;font-weight:800;padding:2px 9px;border-radius:9px;background:' + (dn ? 'rgba(5,150,105,.12)' : 'var(--bg2)') + ';color:' + (dn ? 'var(--green)' : 'var(--text3)') + '">Day ' + d.day + '</span>';
      h += '<span style="font-size:13px;font-weight:700;color:' + (dn ? 'var(--green)' : 'var(--text)') + '">' + esc(d.title) + '</span>';
      if (dn) h += '<span class="badge on">✓ 已完成</span>';
      else if (isToday) h += '<span class="badge hot">今天</span>';
      h += '<span style="margin-left:auto;font-size:10px;color:var(--text3)">' + esc(d.time) + '　' + pr + '/' + d.tasks.length + '</span>';
      h += '</div>';
      h += '<div style="margin-top:8px">';
      d.tasks.forEach(function (t, i) {
        var k = taskKey(d.day, i), on = TP.isOpenDone('plan', k);
        h += '<label style="display:flex;gap:9px;align-items:flex-start;padding:6px 0;cursor:pointer;border-bottom:1px solid var(--border)">' +
             '<input type="checkbox" data-day="' + d.day + '" data-i="' + i + '" ' + (on ? 'checked' : '') +
             ' style="margin-top:2px;width:15px;height:15px;cursor:pointer;accent-color:#4f46e5;flex:0 0 auto">' +
             '<span style="font-size:12px;line-height:1.7;color:' + (on ? 'var(--text3)' : 'var(--text2)') + ';text-decoration:' + (on ? 'line-through' : 'none') + '">' + esc(t.t) +
             (t.link ? ' <a href="' + t.link + '" style="color:var(--accent);text-decoration:none;font-size:11px;white-space:nowrap">去练 →</a>' : '') +
             '</span></label>';
      });
      h += '</div></div>';
    });

    host.innerHTML = h;

    /* 事件 */
    var sb = document.getElementById('planStart');
    if (sb) sb.onclick = function () {
      setStart(todayStr());
      toast('计划已开始，今天是 Day 1 🎉');
      render(); refreshStats();
    };
    var tb = document.getElementById('planToday');
    if (tb) tb.onclick = function () {
      var el = document.getElementById('plan-day-' + Math.min(cur, PLAN_DAYS.length));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    var rb = document.getElementById('planReset');
    if (rb) rb.onclick = function () {
      if (!confirm('重置后所有打勾记录会清空（其它模块进度不受影响），确定吗？')) return;
      PLAN_DAYS.forEach(function (d) { for (var i = 0; i < d.tasks.length; i++) TP.markOpen('plan', taskKey(d.day, i), false); });
      try { localStorage.removeItem(START_KEY); } catch (e) {}
      toast('计划已重置');
      render(); refreshStats();
    };
    Array.prototype.forEach.call(host.querySelectorAll('input[data-day]'), function (cb) {
      cb.onchange = function () {
        var day = +cb.getAttribute('data-day'), i = +cb.getAttribute('data-i');
        TP.markOpen('plan', taskKey(day, i), cb.checked);
        var d = PLAN_DAYS[day - 1];
        if (cb.checked && dayDone(d)) toast('Day ' + day + ' 全部完成 ✅');
        render(); refreshStats();
      };
    });
    try { TP.exportSummary(); } catch (e) {}
  }

  function refreshStats() {
    var el = document.getElementById('planStats');
    if (!el) return;
    var s = totalStats(), cur = currentDayNo();
    el.innerHTML =
      '<div class="stat cy"><b>' + s.doneTasks + '<span style="font-size:12px;color:var(--text3)">/' + s.totalTasks + '</span></b><span>任务完成</span></div>' +
      '<div class="stat em"><b>' + s.doneDays + '<span style="font-size:12px;color:var(--text3)">/' + s.totalDays + '</span></b><span>天数完成</span></div>' +
      '<div class="stat am"><b>' + (cur ? 'Day ' + Math.min(cur, 30) : '未开始') + '</b><span>当前进度</span></div>' +
      '<div class="stat vi"><b>' + s.pct + '%</b><span>整体完成度</span></div>';
  }

  function mount(host) { render(); }
  function onShow() { render(); }

  return { mount: mount, onShow: onShow, stats: totalStats, currentDay: currentDayNo, dayDone: dayDone,
           taskKey: taskKey, isStarted: function () { return !!getStart(); }, startDate: getStart };
})();
