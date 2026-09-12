/* 能力雷达 · 9 维自评 + SVG 雷达图 + JD 差距分析 */
var RadarModule = (function () {
  var KEY = 'tp_radar_v1';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  /* ---------- 训练进度证据 ---------- */
  function evidenceText(key) {
    if (!key) return '';
    try {
      if (key === 'sql') { var s = TP.stats(SQL_QUESTIONS.length); return 'SQL 训练场 ' + s.done + '/' + s.total + ' 题（一次做对率 ' + s.mastery + '%）'; }
      if (key === 'lab') { var l = TP.labStats(LAB_QUESTIONS.length); return '数据集实验室 ' + l.done + '/' + l.total + ' 个分析'; }
      if (key === 'metrics') { var m = TP.quizStats('metrics', METRICS_QUIZZES.length); return '指标设计 ' + m.done + '/' + m.total; }
      if (key === 'abtest') { var a = TP.quizStats('abtest', ABTEST_QUIZZES.length); return '实验分析 ' + a.done + '/' + a.total; }
      if (key === 'case') { var c = 0; CASE_QUESTIONS.forEach(function (q) { if (TP.isOpenDone('case', q.id)) c++; }); return 'Case 拆解 ' + c + '/' + CASE_QUESTIONS.length; }
      if (key === 'agent_quiz') {
        var d = 0; AGENT_CONTENT.designs.forEach(function (x) { if (TP.isQuizDone('agent', x.id)) d++; });
        var su = TP.quizGet('agent', AGENT_CONTENT.suitability.id);
        return 'Agent 判读 ' + (d + (su && su.ok ? 1 : 0)) + '/' + (AGENT_CONTENT.designs.length + 1);
      }
      if (key === 'agent_task') {
        var t = 0; AGENT_CONTENT.tasks.forEach(function (x) { if (TP.isOpenDone('agent', x.id)) t++; });
        return 'Agent 实操任务 ' + t + '/' + AGENT_CONTENT.tasks.length;
      }
    } catch (e) { return ''; }
    return '';
  }

  /* ---------- SVG 雷达图 ---------- */
  function radarSVG(self, target) {
    var N = RADAR_DIMS.length, R = 108, cx = 155, cy = 150;
    function pt(i, val) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / N;
      var rr = R * (val / 5);
      return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
    }
    function poly(vals) {
      return vals.map(function (v, i) { var p = pt(i, v); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    }
    var h = '<svg viewBox="0 0 310 300" style="width:100%;max-width:360px;height:auto">';
    /* 网格 */
    for (var lv = 1; lv <= 5; lv++) {
      var ring = [];
      for (var i = 0; i < N; i++) { var p = pt(i, lv); ring.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
      h += '<polygon points="' + ring.join(' ') + '" fill="none" stroke="var(--border)" stroke-width="1"/>';
    }
    /* 轴线 + 标签 */
    for (var j = 0; j < N; j++) {
      var e = pt(j, 5);
      h += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="var(--border)"/>';
      var lp = pt(j, 6.15);
      var anchor = lp[0] > cx + 6 ? 'start' : (lp[0] < cx - 6 ? 'end' : 'middle');
      h += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" fill="var(--text2)" font-size="9" text-anchor="' + anchor + '" font-family="system-ui">' + esc(RADAR_DIMS[j].short) + '</text>';
    }
    /* 目标（虚线） */
    h += '<polygon points="' + poly(RADAR_DIMS.map(function (d) { return d.target; })) + '" fill="var(--purple)" fill-opacity="0.10" stroke="var(--purple)" stroke-width="1.5" stroke-dasharray="4 3"/>';
    /* 自评（实线） */
    h += '<polygon points="' + poly(RADAR_DIMS.map(function (d) { return self[d.id] || 0; })) + '" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="2"/>';
    RADAR_DIMS.forEach(function (d, i) {
      var p = pt(i, self[d.id] || 0);
      h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="var(--accent)"/>';
    });
    h += '</svg>';
    h += '<div style="display:flex;gap:16px;justify-content:center;font-size:11px;color:var(--txt2);margin-top:4px">' +
         '<span><i style="display:inline-block;width:18px;height:2px;background:var(--accent);vertical-align:middle;margin-right:5px"></i>我的自评</span>' +
         '<span><i style="display:inline-block;width:18px;height:0;border-top:2px dashed var(--purple);vertical-align:middle;margin-right:5px"></i>岗位要求</span></div>';
    return h;
  }

  /* ---------- 页面 ---------- */
  function render(host) {
    var self = load();

    var h = '';
    h += '<div class="h1"><span class="grad">能力雷达</span> · 对标策略运营 JD</div>';
    h += '<div class="sub">9 维自评 → 对比岗位要求 → 输出优先补齐清单（含对应训练模块与当前进度）</div>';
    h += '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.85">💡 ' + esc(RADAR_META.intro) + '</div></div>';

    h += '<div class="lab">';
    /* 左：雷达图 */
    h += '<div><div class="pane" style="text-align:center">' + radarSVG(self, null);
    h += '<div id="radarScore" style="margin-top:8px"></div></div></div>';
    /* 右：评分 + 分析 */
    h += '<div><div class="pane" id="radarRate"></div></div>';
    h += '</div>';

    h += '<div id="radarGap" style="margin-top:14px"></div>';

    host.innerHTML = h;
    renderRate(host);
    renderScore();
    renderGap();
  }

  function renderRate(host) {
    var self = load();
    var box = document.getElementById('radarRate');
    var h = '<div style="font-size:13px;font-weight:700;margin-bottom:10px">📝 我的自评（1-5 级）</div>';
    h += '<div class="muted" style="margin-bottom:12px">1=没接触过 ｜ 2=了解概念 ｜ 3=能照着做 ｜ 4=能独立完成 ｜ 5=能设计并教别人</div>';
    RADAR_DIMS.forEach(function (d) {
      var v = self[d.id] || 0;
      h += '<div style="margin-bottom:11px">';
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
           '<span style="font-size:12px;font-weight:600;color:var(--txt)">' + esc(d.n) + '</span>' +
           (d.hard ? '<span class="badge hot">硬性</span>' : '<span class="badge soon">加分/职责</span>') +
           '<span style="margin-left:auto;font-size:11px;color:var(--txt3)">要求 ' + d.target + ' 级　当前 <b style="color:var(--cy)" id="rv_' + d.id + '">' + (v || '未评') + '</b></span>' +
           '</div>';
      h += '<input type="range" min="1" max="5" step="1" value="' + (v || 1) + '" data-dim="' + d.id + '" ' +
           'style="width:100%;accent-color:var(--accent);cursor:pointer">';
      h += '</div>';
    });
    h += '<div class="row" style="margin-top:12px"><button class="btn primary" id="radarSave">💾 保存自评</button>' +
         '<button class="btn" id="radarReset">清空重评</button></div>';
    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('[data-dim]'), function (sl) {
      sl.oninput = function () {
        var id = sl.getAttribute('data-dim');
        var cur = load(); cur[id] = +sl.value; save(cur);
        var lab = document.getElementById('rv_' + id);
        if (lab) lab.textContent = sl.value;
        document.querySelector('.pane').innerHTML = radarSVG(cur, null) +
          '<div style="display:flex;gap:16px;justify-content:center;font-size:11px;color:var(--txt2);margin-top:4px">' +
          '<span><i style="display:inline-block;width:18px;height:2px;background:var(--accent);vertical-align:middle;margin-right:5px"></i>我的自评</span>' +
          '<span><i style="display:inline-block;width:18px;height:0;border-top:2px dashed var(--purple);vertical-align:middle;margin-right:5px"></i>岗位要求</span></div>' +
          '<div id="radarScore" style="margin-top:8px"></div>';
        renderScore(); renderGap();
      };
    });
    document.getElementById('radarSave').onclick = function () {
      var cur = load();
      RADAR_DIMS.forEach(function (d) {
        var sl = box.querySelector('[data-dim="' + d.id + '"]');
        if (sl) cur[d.id] = +sl.value;
      });
      save(cur);
      var t = document.getElementById('toast'); if (t) { t.textContent = '自评已保存'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800); }
      renderScore(); renderGap();
    };
    document.getElementById('radarReset').onclick = function () {
      if (!confirm('确定清空所有自评？')) return;
      save({});
      render(document.getElementById('view'));
    };
  }

  function renderScore() {
    var el = document.getElementById('radarScore');
    if (!el) return;
    var self = load();
    var total = 0, max = 0, filled = 0;
    RADAR_DIMS.forEach(function (d) { var v = self[d.id] || 0; if (v) filled++; total += v; max += d.target; });
    var pct = max ? Math.round(total / max * 100) : 0;
    el.innerHTML = '<div style="font-size:11px;color:var(--txt3);line-height:1.9">已评 ' + filled + '/' + RADAR_DIMS.length +
      ' 项　·　总分 <b style="color:var(--cy);font-family:var(--mono)">' + total + '</b> / 岗位要求合计 <b style="font-family:var(--mono)">' + max + '</b>' +
      '<br>达成度 <b style="color:' + (pct >= 80 ? 'var(--em)' : pct >= 55 ? 'var(--am)' : 'var(--rd)') + ';font-family:var(--mono)">' + pct + '%</b></div>';
  }

  function renderGap() {
    var box = document.getElementById('radarGap');
    if (!box) return;
    var self = load();
    var rows = RADAR_DIMS.map(function (d) {
      var v = self[d.id] || 0;
      return { d: d, v: v, gap: v ? Math.max(0, d.target - v) : d.target, rated: !!v };
    }).filter(function (r) { return r.gap > 0; });
    /* 排序：硬性要求优先，其次 gap 大 */
    rows.sort(function (a, b) {
      if (a.d.hard !== b.d.hard) return a.d.hard ? -1 : 1;
      return b.gap - a.gap;
    });

    var h = '<div class="sec-t">🎯 优先补齐清单（按"硬性 × 差距"排序）</div>';
    if (!rows.length) {
      h += '<div class="card" style="padding:14px 16px"><div style="font-size:12.5px;color:var(--em)">✅ 所有维度都达到了岗位要求等级。建议：①把训练成果写成作品集 ②开始投递并在面试中主动讲这些项目 ③把自评提到 5 级（能设计并教别人）</div></div>';
      box.innerHTML = h; return;
    }
    rows.forEach(function (r, i) {
      var d = r.d;
      var ev = evidenceText(d.evidence);
      h += '<div class="card" style="margin-bottom:9px;padding:12px 15px;border-left:3px solid ' + (d.hard ? 'var(--rd)' : 'var(--am)') + '">';
      h += '<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:6px">';
      h += '<span style="font-size:10px;font-weight:800;padding:1px 8px;border-radius:9px;background:var(--border);color:var(--txt3)">P' + (i + 1) + '</span>';
      h += '<span style="font-size:12.5px;font-weight:700;color:var(--txt)">' + esc(d.n) + '</span>';
      h += d.hard ? '<span class="badge hot">硬性要求</span>' : '<span class="badge soon">加分/职责</span>';
      h += '<span style="margin-left:auto;font-size:11px;color:var(--txt3)">要求 ' + d.target + '　' + (r.rated ? '当前 ' + r.v : '未评') + '　<b style="color:var(--rd)">差 ' + r.gap + '</b></span>';
      h += '</div>';
      h += '<div style="font-size:11.5px;color:var(--txt2);line-height:1.75"><b style="color:var(--cy)">JD 依据</b>　' + esc(d.jd) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--txt2);line-height:1.75;margin-top:3px"><b style="color:var(--em)">怎么补</b>　' + esc(d.how) + '</div>';
      if (ev) h += '<div style="font-size:11px;color:var(--txt3);line-height:1.7;margin-top:3px">📊 当前进度：' + esc(ev) + '</div>';
      h += '<div style="margin-top:7px"><a class="btn sm" href="' + d.module + '">去练 → ' + esc(d.modName) + '</a></div>';
      h += '</div>';
    });
    h += '<div class="card" style="padding:12px 15px;margin-top:6px"><div style="font-size:11.5px;color:var(--txt2);line-height:1.85">' +
         '📌 <b>补短板的顺序建议</b>：先把<b style="color:var(--rd)">硬性要求</b>里差距最大的补上（它们是筛简历的硬门槛），再补加分项。' +
         '不要平均用力——把时间压在"最可能被刷掉"的那一项上，收益最高。</div></div>';
    box.innerHTML = h;
  }

  function mount(host) { render(host); }
  function onShow() { render(document.getElementById('view')); }

  return { mount: mount, onShow: onShow };
})();
