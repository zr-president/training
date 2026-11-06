/* 学习学院 · 模块
   渲染 ACADEMY 的三层与单元；单元内按 7 步顺序展示。

   两个刻意的设计：
   1. 引导练习有「提示阶梯」：三级，逐次揭示。用了几级会被记下来 ——
      用了提示不算失败，但不算「独立完成」。
   2. 学完只能标「已学习」，不能标「已掌握」。真正的掌握要看 3 天后复测。 */
var AcademyModule = (function () {
  var NS = 'academy';
  var cur = null;
  var hintLevel = {};      /* 每个单元用了第几级提示 */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function unitById(id) {
    for (var i = 0; i < ACADEMY.units.length; i++) if (ACADEMY.units[i].id === id) return ACADEMY.units[i];
    return null;
  }

  function isLearned(id) {
    try { return TP.getNote(NS, id + '_learned') === '1'; } catch (e) { return false; }
  }
  function markLearned(id, v) {
    try { TP.setNote(NS, id + '_learned', v ? '1' : ''); } catch (e) {}
  }
  function retestAt(id) {
    try { return TP.getNote(NS, id + '_retest'); } catch (e) { return null; }
  }
  function scheduleRetest(id, days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    var s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    try { TP.setNote(NS, id + '_retest', s); } catch (e) {}
    return s;
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------------- 列表 ---------------- */
  function renderList() {
    var box = document.getElementById('acList');
    if (!box) return;
    var h = '';

    ACADEMY.layers.forEach(function (L) {
      var units = ACADEMY.units.filter(function (u) { return u.layer === L.id; });
      var planned = ACADEMY.roadmap.filter(function (r) { return r.layer === L.id; });
      h += '<div class="ac-layer">';
      h += '<div class="ac-layer-hd"><span class="ac-layer-id">' + L.id + '</span><span class="ac-layer-name">' + esc(L.name) + '</span>' +
           '<span class="ac-layer-cnt">' + units.length + ' 课已开 / ' + planned.length + ' 课规划中</span></div>';
      h += '<div class="ac-layer-note">' + esc(L.note) + '</div>';

      units.forEach(function (u) {
        var on = cur && cur.id === u.id;
        h += '<div class="ac-unit' + (on ? ' on' : '') + '" data-uid="' + u.id + '">' +
             '<div class="ac-unit-t">' + esc(u.title) + '</div>' +
             '<div class="ac-unit-m">' + esc(u.domain) + ' · ' + u.minutes + ' 分钟 · ' + esc(u.level) +
             (isLearned(u.id) ? ' · <b style="color:var(--em)">已学习</b>' : '') + '</div>' +
             '</div>';
      });

      if (planned.length) {
        h += '<details class="ac-plan"><summary>' + planned.length + ' 课规划中（未开课）</summary><div class="ac-plan-body">';
        planned.forEach(function (r) {
          h += '<div class="ac-plan-item"><span>' + esc(r.title) + '</span><em>' + esc(r.why) + '</em></div>';
        });
        h += '</div></details>';
      }
      h += '</div>';
    });

    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.ac-unit'), function (el) {
      el.onclick = function () { open(el.getAttribute('data-uid')); };
    });
  }

  /* ---------------- 单元详情 ---------------- */
  function open(id) {
    cur = unitById(id);
    hintLevel = {};
    renderList();
    renderUnit();
  }

  function stepBadge(n, label) {
    return '<div class="ac-step-hd"><span class="ac-step-n">' + n + '</span>' + esc(label) + '</div>';
  }

  function renderStep(s, idx) {
    var h = '';
    if (s.type === 'scene') {
      h += stepBadge('①', s.title) + '<div class="ac-body">' + s.html + '</div>';
    } else if (s.type === 'figure') {
      h += stepBadge('②', s.title) + '<div class="ac-body">' + s.html + '</div>';
    } else if (s.type === 'example') {
      h += stepBadge('③', s.title) + '<div class="ac-body">' + s.html + '</div>';
    } else if (s.type === 'guided') {
      h += stepBadge('④', s.title);
      h += '<div class="ac-body"><div class="ac-q">' + s.question + '</div>';
      h += '<div class="ac-opts">';
      s.options.forEach(function (o, i) {
        h += '<button class="ac-opt" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + esc(o.text) + '</button>';
      });
      h += '</div>';
      h += '<div class="ac-hintbar"><button class="btn ghost ac-hint-btn" style="padding:5px 12px;font-size:12px">💡 我需要提示</button>' +
           '<span class="ac-hint-cnt">用了 0 级提示</span></div>';
      h += '<div class="ac-hints"></div>';
      h += '<div class="ac-ans"></div></div>';
    } else if (s.type === 'variant') {
      h += stepBadge('⑤', s.title);
      h += '<div class="ac-body"><div class="ac-q">' + s.question.replace(/\n/g, '<br>') + '</div>' +
           '<textarea class="ac-ta" rows="5" placeholder="' + esc(s.placeholder) + '"></textarea>' +
           '<div class="ac-row"><button class="btn primary ac-ref" style="padding:6px 14px;font-size:12px">看参考</button></div>' +
           '<div class="ac-refbox"></div></div>';
    } else if (s.type === 'artifact') {
      h += stepBadge('⑥', s.title);
      h += '<div class="ac-body"><div class="ac-task">' + s.task.replace(/\n/g, '<br>') + '</div>';
      h += '<div class="ac-check"><b>自查清单</b>';
      s.selfCheck.forEach(function (c, i) {
        h += '<label class="ac-check-item"><input type="checkbox" data-ci="' + i + '"> ' + esc(c) + '</label>';
      });
      h += '</div>';
      h += '<div class="ac-tip">' + esc(s.tip) + '</div></div>';
    } else if (s.type === 'retest') {
      var at = retestAt(cur.id);
      var due = at && at <= todayStr();
      h += stepBadge('⑦', s.title);
      h += '<div class="ac-body">';
      h += '<div class="ac-tip" style="margin-bottom:10px">' + esc(s.howTo) + '</div>';
      h += '<ol class="ac-retest">';
      s.questions.forEach(function (q) { h += '<li>' + esc(q) + '</li>'; });
      h += '</ol>';
      if (at) {
        h += '<div class="ac-callout" style="margin-top:12px">复测日期：<b>' + at + '</b>' +
             (due ? '　<b style="color:var(--rd)">已到期，现在就可以做</b>' : '　还没到') + '</div>';
      } else {
        h += '<div class="ac-row"><button class="btn primary ac-sch" style="padding:6px 14px;font-size:12px">安排 ' + s.days + ' 天后复测</button></div>';
      }
      h += '</div>';
    }
    return '<div class="ac-step" data-step="' + idx + '" data-type="' + s.type + '">' + h + '</div>';
  }

  function renderUnit() {
    var box = document.getElementById('acMain');
    if (!box || !cur) return;
    var h = '';
    h += '<div class="ac-unit-title">' + esc(cur.title) + '</div>';
    h += '<div class="ac-unit-sub">' + esc(cur.subtitle) + '</div>';
    h += '<div class="ac-meta">' +
         '<span>' + esc(cur.domain) + '</span><span>' + cur.minutes + ' 分钟</span><span>' + esc(cur.level) + '</span>' +
         '<span>先修：' + esc(cur.prereq) + '</span></div>';
    h += '<div class="ac-goalbox"><b>学完你能做到</b><div>' + esc(cur.goal) + '</div></div>';

    h += '<div class="ac-concepts"><b>涉及概念</b>';
    cur.concepts.forEach(function (c) { h += '<span class="ac-chip">' + esc(c) + '</span>'; });
    h += '</div>';

    cur.steps.forEach(function (s, i) { h += renderStep(s, i); });

    h += '<div class="ac-foot">';
    h += '<div class="ac-foot-note">学完只标「已学习」。<b>不代表已掌握</b> —— 掌握要看 3 天后不看原文能不能答出来。</div>';
    h += '<div class="ac-row">';
    h += isLearned(cur.id)
      ? '<button class="btn ghost ac-mark" data-v="0" style="padding:6px 14px;font-size:12px">取消「已学习」</button>'
      : '<button class="btn primary ac-mark" data-v="1" style="padding:6px 14px;font-size:12px">标记为已学习</button>';
    h += '</div></div>';

    box.innerHTML = h;
    wire();
  }

  /* ---------------- 交互 ---------------- */
  function wire() {
    var box = document.getElementById('acMain');
    if (!box) return;

    /* 引导练习 */
    var g = box.querySelector('.ac-step[data-type="guided"]');
    if (g) {
      var s = null;
      for (var i = 0; i < cur.steps.length; i++) if (cur.steps[i].type === 'guided') s = cur.steps[i];
      var cnt = g.querySelector('.ac-hint-cnt');
      var hb = g.querySelector('.ac-hint-btn');
      var hintsBox = g.querySelector('.ac-hints');
      var lvl = 0;
      hb.onclick = function () {
        if (lvl >= s.hints.length) { hb.disabled = true; hb.textContent = '提示已全部给出'; return; }
        var d = document.createElement('div');
        d.className = 'ac-hint';
        d.textContent = s.hints[lvl];
        hintsBox.appendChild(d);
        lvl++;
        cnt.textContent = '用了 ' + lvl + ' 级提示';
        cnt.style.color = lvl >= 3 ? 'var(--am)' : '';
        hintLevel[cur.id] = lvl;
        try { TP.setNote(NS, cur.id + '_hint', String(lvl)); } catch (e) {}
        if (lvl >= s.hints.length) { hb.disabled = true; hb.textContent = '提示已全部给出'; }
      };
      Array.prototype.forEach.call(g.querySelectorAll('.ac-opt'), function (b) {
        b.onclick = function () {
          var idx = parseInt(b.getAttribute('data-i'), 10);
          var correct = s.options[idx].correct;
          Array.prototype.forEach.call(g.querySelectorAll('.ac-opt'), function (x) {
            x.disabled = true;
            var xi = parseInt(x.getAttribute('data-i'), 10);
            if (s.options[xi].correct) x.classList.add('right');
            else if (x === b) x.classList.add('wrong');
          });
          var ans = g.querySelector('.ac-ans');
          ans.innerHTML = '<div class="ac-callout ' + (correct ? 'okc' : 'badc') + '">' +
            (correct ? '✅ 正确' : '❌ 不对，正确答案是「' + esc(s.answer) + '」') + '</div>' +
            '<div class="ac-explain">' + s.explain + '</div>';
        };
      });
    }

    /* 独立变式 */
    var v = box.querySelector('.ac-step[data-type="variant"]');
    if (v) {
      var vs = null;
      for (var j = 0; j < cur.steps.length; j++) if (cur.steps[j].type === 'variant') vs = cur.steps[j];
      var ta = v.querySelector('.ac-ta');
      /* 回填草稿 */
      try {
        var draft = TP.getNote(NS, cur.id + '_draft');
        if (draft) ta.value = draft;
      } catch (e) {}
      ta.oninput = function () { try { TP.setNote(NS, cur.id + '_draft', ta.value); } catch (e) {} };
      v.querySelector('.ac-ref').onclick = function () {
        v.querySelector('.ac-refbox').innerHTML = '<div class="ac-explain">' + vs.reference.replace(/\n/g, '<br>') + '</div>';
      };
    }

    /* 复测安排 */
    var sch = box.querySelector('.ac-sch');
    if (sch) {
      var rs = null;
      for (var k = 0; k < cur.steps.length; k++) if (cur.steps[k].type === 'retest') rs = cur.steps[k];
      sch.onclick = function () {
        var at = scheduleRetest(cur.id, rs.days);
        renderUnit();
        var t = document.getElementById('acToast');
        if (t) { t.textContent = '已安排 ' + at + ' 复测'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2400); }
      };
    }

    /* 标记已学习 */
    var mk = box.querySelector('.ac-mark');
    if (mk) mk.onclick = function () {
      var v2 = mk.getAttribute('data-v') === '1';
      markLearned(cur.id, v2);
      try {
        if (typeof Ledger !== 'undefined') Ledger.add('active', 'academy', 0, {});
      } catch (e) {}
      renderList();
      renderUnit();
      var t = document.getElementById('acToast');
      if (t) { t.textContent = v2 ? '已标记为已学习（不代表已掌握）' : '已取消'; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2400); }
    };
  }

  /* ---------------- 统计 ---------------- */
  function refreshStats() {
    var el = document.getElementById('acStats');
    if (!el) return;
    var total = ACADEMY.units.length;
    var learned = ACADEMY.units.filter(function (u) { return isLearned(u.id); }).length;
    var retests = ACADEMY.units.filter(function (u) { return !!retestAt(u.id); }).length;
    var dueCnt = ACADEMY.units.filter(function (u) { var a = retestAt(u.id); return a && a <= todayStr(); }).length;
    el.innerHTML =
      '<div class="stat cy"><b>' + learned + '<span style="font-size:12px;color:var(--txt3)">/' + total + '</span></b><span>已学习单元</span></div>' +
      '<div class="stat am"><b>' + retests + '</b><span>已安排复测</span></div>' +
      '<div class="stat ' + (dueCnt ? 'rd' : 'em') + '"><b>' + dueCnt + '</b><span>复测已到期</span></div>' +
      '<div class="stat vi"><b>' + ACADEMY.roadmap.length + '</b><span>规划中单元</span></div>';
  }

  function mount(host) {
    if (!host) return;
    cur = ACADEMY.units[0] || null;
    var h = '';
    h += '<div class="h1"><span class="grad">学习学院</span> · 系统分层教学</div>';
    h += '<div class="sub">每课 15-25 分钟，固定 7 步：场景 → 核心图 → 例题 → 引导练习（带提示阶梯）→ 独立变式 → 迁移产物 → 3 天后复测</div>';
    h += '<div class="stats" id="acStats" style="margin-bottom:14px"></div>';
    h += '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.9">' +
         '💡 <b>为什么先只开 2 课</b>　这两课是<b>样板</b>：一个金融（你看不懂指数的痛点），一个经营分析（你的求职主线）。' +
         '先看这两课的讲法你能不能看懂，再决定要不要铺剩下的 ' + ACADEMY.roadmap.length + ' 课。<br>' +
         '<span style="color:var(--text3)">学完只能标「已学习」，<b>不代表已掌握</b> —— 掌握要看 3 天后不看原文能不能答出来。</span>' +
         '</div></div>';
    h += '<div class="lab">';
    h += '<div><div class="sec-t" style="margin-top:0">课程目录</div><div class="ac-list" id="acList"></div></div>';
    h += '<div><div class="pane" id="acMain"></div></div>';
    h += '</div>';
    h += '<div id="acToast" class="toast"></div>';
    host.innerHTML = h;
    renderList();
    renderUnit();
    refreshStats();
  }

  function onShow() { refreshStats(); }

  return {
    mount: mount, onShow: onShow, open: open,
    /* 供单测 */
    _unitById: unitById, _isLearned: isLearned, _scheduleRetest: scheduleRetest
  };
})();
