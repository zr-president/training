/* 学习学院 · 模块 v2
   结构从「领域 = 1 个单元」改成「领域 = 一门课 = N 个由浅入深的单元」。

   为什么改：v1 每个领域只有一个单元，等于只有一层皮毛。
   正确做法是一门课有 4-8 个单元，后面的单元假定前面的已掌握。

   数据来自两处：
     ACADEMY_COURSES —— 11 门课与各自单元清单（含 status: ready / outline）
     ACADEMY.units   —— 已写全内容的单元（目前 2 个，7 步齐全）
   两个按 unit.id 关联。 */
var AcademyModule = (function () {
  var NS = 'academy';
  var cur = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function courses() {
    return (typeof ACADEMY_COURSES !== 'undefined') ? ACADEMY_COURSES : [];
  }
  function allUnits() {
    var out = [];
    courses().forEach(function (c) {
      c.units.forEach(function (u) {
        out.push({ course: c, unit: u });
      });
    });
    return out;
  }
  function unitContent(id) {
    for (var i = 0; i < ACADEMY.units.length; i++) if (ACADEMY.units[i].id === id) return ACADEMY.units[i];
    return null;
  }
  function findMeta(id) {
    var all = allUnits();
    for (var i = 0; i < all.length; i++) if (all[i].unit.id === id) return all[i];
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

  var STATUS_LABEL = { ready: '可学', outline: '大纲已定', planned: '规划中' };
  var DEPTH_COLOR = { '入门': 'var(--cy)', '进阶': 'var(--vi)', '实战': 'var(--am)' };

  /* ---------------- 列表：按层 → 课 → 单元 ---------------- */
  function renderList() {
    var box = document.getElementById('acList');
    if (!box) return;
    var h = '';

    ACADEMY.layers.forEach(function (L) {
      var cs = courses().filter(function (c) { return c.layer === L.id; });
      var readyN = 0, totalN = 0;
      cs.forEach(function (c) {
        c.units.forEach(function (u) { totalN++; if (u.status === 'ready') readyN++; });
      });
      h += '<div class="ac-layer">';
      h += '<div class="ac-layer-hd"><span class="ac-layer-id">' + L.id + '</span>' +
           '<span class="ac-layer-name">' + esc(L.name) + '</span>' +
           '<span class="ac-layer-cnt">' + cs.length + ' 门课 / ' + totalN + ' 单元</span></div>';
      h += '<div class="ac-layer-note">' + esc(L.note) + '</div>';

      cs.forEach(function (c) {
        var isOpen = cur && findMeta(cur.id) && findMeta(cur.id).course.id === c.id;
        var doneN = c.units.filter(function (u) { return isLearned(u.id); }).length;
        h += '<div class="ac-course' + (isOpen ? ' open' : '') + '">';
        h += '<div class="ac-course-hd" data-cid="' + c.id + '">' +
             '<span class="ac-course-arrow">' + (isOpen ? '▾' : '▸') + '</span>' +
             '<span class="ac-course-name">' + esc(c.name) + '</span>' +
             '<span class="ac-course-cnt">' + doneN + '/' + c.units.length + '</span>' +
             '</div>';
        if (isOpen) {
          h += '<div class="ac-course-body">';
          h += '<div class="ac-course-goal">' + esc(c.goal) + '</div>';
          c.units.forEach(function (u, i) {
            var on = cur && cur.id === u.id;
            var can = u.status === 'ready';
            h += '<div class="ac-unit' + (on ? ' on' : '') + (can ? '' : ' dim') + '" data-uid="' + u.id + '">' +
                 '<div class="ac-unit-n">' + (i + 1) + '</div>' +
                 '<div class="ac-unit-main">' +
                 '<div class="ac-unit-t">' + esc(u.title) + '</div>' +
                 '<div class="ac-unit-m">' +
                 '<span style="color:' + (DEPTH_COLOR[u.depth] || 'var(--text3)') + ';font-weight:700">' + esc(u.depth) + '</span>' +
                 ' · ' + (STATUS_LABEL[u.status] || u.status) +
                 (isLearned(u.id) ? ' · <b style="color:var(--em)">已学习</b>' : '') +
                 '</div></div></div>';
          });
          h += '</div>';
        }
        h += '</div>';
      });
      h += '</div>';
    });

    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('.ac-course-hd'), function (el) {
      el.onclick = function () {
        var cid = el.getAttribute('data-cid');
        var first = null;
        courses().forEach(function (c) {
          if (c.id === cid) {
            for (var i = 0; i < c.units.length; i++) {
              if (c.units[i].status === 'ready') { first = c.units[i]; break; }
            }
            if (!first && c.units.length) first = c.units[0];
          }
        });
        if (first) open(first.id);
      };
    });
    Array.prototype.forEach.call(box.querySelectorAll('.ac-unit'), function (el) {
      el.onclick = function () { open(el.getAttribute('data-uid')); };
    });
  }

  /* ---------------- 单元详情 ---------------- */
  function open(id) {
    var meta = findMeta(id);
    if (meta && meta.unit.status !== 'ready') {
      cur = { id: id, outlineOnly: true };
      renderList();
      renderOutline(meta);
      return;
    }
    var c = unitContent(id);
    if (!c) {
      cur = { id: id, outlineOnly: true };
      renderList();
      renderOutline(meta);
      return;
    }
    cur = c;
    cur.outlineOnly = false;
    renderList();
    renderUnit();
  }

  function renderOutline(meta) {
    var box = document.getElementById('acMain');
    if (!box || !meta) return;
    var c = meta.course, u = meta.unit;
    var h = '';
    h += '<div class="ac-unit-title">' + esc(u.title) + '</div>';
    h += '<div class="ac-meta"><span>' + esc(c.name) + '</span><span>' + esc(u.depth) + '</span>' +
         '<span style="color:var(--am)">内容未写</span></div>';
    h += '<div class="ac-goalbox"><b>这一单元的目标</b><div>' + esc(u.goal) + '</div></div>';
    h += '<div class="ac-callout"><b>这一单元还没写内容。</b><br>' +
         '大纲已经定了（上面那句就是它的目标），但 7 步内容还没做。' +
         '目前只有 2 个单元写全了：<b>金融 · 第 1 单元</b> 和 <b>经营分析 · 第 1 单元</b>。<br><br>' +
         '为什么要先给你看大纲：一门课的 8 个单元如果只写了第 1 个，你看到的就只是皮毛。' +
         '先确认整个序列值不值得写，再批量做内容。<br><br>' +
         '<b>本门课其余单元</b>：' + esc(c.units.map(function (x) { return x.title; }).join(' ／ ')) +
         '</div>';
    h += '<div class="ac-callout" style="background:var(--bg2);border-left-color:var(--text3)"><b>这门课为什么在你的路线里</b><br>' + esc(c.why || '') + '</div>';
    box.innerHTML = h;
  }

  function stepBadge(n, label) {
    return '<div class="ac-step-hd"><span class="ac-step-n">' + n + '</span>' + esc(label) + '</div>';
  }

  function renderStep(s, idx) {
    var h = '';
    if (s.type === 'scene' || s.type === 'figure' || s.type === 'example') {
      var n = s.type === 'scene' ? '①' : (s.type === 'figure' ? '②' : '③');
      h += stepBadge(n, s.title) + '<div class="ac-body">' + s.html + '</div>';
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
      h += '<div class="ac-hints"></div><div class="ac-ans"></div></div>';
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
      h += '</div><div class="ac-tip">' + esc(s.tip) + '</div></div>';
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
    if (!box || !cur || cur.outlineOnly) return;
    var meta = findMeta(cur.id);
    var h = '';
    /* 面包屑：第几个单元 / 共几个 */
    if (meta) {
      var idx = meta.course.units.map(function (u) { return u.id; }).indexOf(cur.id) + 1;
      h += '<div class="ac-crumb">' + esc(meta.course.name) + ' · 第 ' + idx + ' / ' + meta.course.units.length + ' 单元</div>';
    }
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

  function wire() {
    var box = document.getElementById('acMain');
    if (!box) return;

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

    var v = box.querySelector('.ac-step[data-type="variant"]');
    if (v) {
      var vs = null;
      for (var j = 0; j < cur.steps.length; j++) if (cur.steps[j].type === 'variant') vs = cur.steps[j];
      var ta = v.querySelector('.ac-ta');
      try {
        var draft = TP.getNote(NS, cur.id + '_draft');
        if (draft) ta.value = draft;
      } catch (e) {}
      ta.oninput = function () { try { TP.setNote(NS, cur.id + '_draft', ta.value); } catch (e) {} };
      v.querySelector('.ac-ref').onclick = function () {
        v.querySelector('.ac-refbox').innerHTML = '<div class="ac-explain">' + vs.reference.replace(/\n/g, '<br>') + '</div>';
      };
    }

    var sch = box.querySelector('.ac-sch');
    if (sch) {
      var rs = null;
      for (var k = 0; k < cur.steps.length; k++) if (cur.steps[k].type === 'retest') rs = cur.steps[k];
      sch.onclick = function () {
        var at = scheduleRetest(cur.id, rs.days);
        renderUnit();
        toast('已安排 ' + at + ' 复测');
      };
    }

    var mk = box.querySelector('.ac-mark');
    if (mk) mk.onclick = function () {
      var v2 = mk.getAttribute('data-v') === '1';
      markLearned(cur.id, v2);
      try { if (typeof Ledger !== 'undefined') Ledger.add('active', 'academy', 0, {}); } catch (e) {}
      renderList();
      renderUnit();
      toast(v2 ? '已标记为已学习（不代表已掌握）' : '已取消');
    };
  }

  function toast(msg) {
    var t = document.getElementById('acToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function refreshStats() {
    var el = document.getElementById('acStats');
    if (!el) return;
    var all = allUnits();
    var ready = all.filter(function (x) { return x.unit.status === 'ready'; });
    var learned = all.filter(function (x) { return isLearned(x.unit.id); }).length;
    var outlines = all.filter(function (x) { return x.unit.status === 'outline'; }).length;
    var retests = all.filter(function (x) { return !!retestAt(x.unit.id); }).length;
    el.innerHTML =
      '<div class="stat cy"><b>' + courses().length + '</b><span>门课</span></div>' +
      '<div class="stat em"><b>' + learned + '<span style="font-size:12px;color:var(--txt3)">/' + ready.length + '</span></b><span>已学习 / 可学单元</span></div>' +
      '<div class="stat am"><b>' + outlines + '</b><span>大纲已定（待写内容）</span></div>' +
      '<div class="stat vi"><b>' + retests + '</b><span>已安排复测</span></div>';
  }

  function mount(host) {
    if (!host) return;
    var all = allUnits();
    var firstReady = null;
    for (var i = 0; i < all.length; i++) if (all[i].unit.status === 'ready') { firstReady = all[i].unit; break; }
    if (firstReady) { cur = unitContent(firstReady.id); cur.outlineOnly = false; }

    var h = '';
    h += '<div class="h1"><span class="grad">学习学院</span> · 系统分层教学</div>';
    h += '<div class="sub">11 门课 / ' + allUnits().length + ' 个单元，由浅入深。每单元 15-25 分钟，固定 7 步：场景 → 核心图 → 例题 → 引导练习（带提示阶梯）→ 独立变式 → 迁移产物 → 3 天后复测</div>';
    h += '<div class="stats" id="acStats" style="margin-bottom:14px"></div>';
    h += '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.9">' +
         '📐 <b>先看大纲，再决定要不要写</b>　一门课的 8 个单元如果只写了第 1 个，你看到的只是皮毛。' +
         '所以这里先把 <b>11 门课的全部单元</b>列出来（标「大纲已定」的还没写内容），' +
         '目前只有 <b>2 个单元</b>写全了 7 步：<b>金融 · 第 1 单元</b>、<b>经营分析 · 第 1 单元</b>。<br>' +
         '<span style="color:var(--text3)">确认序列值得写之后，再按顺序批量做内容。</span>' +
         '</div></div>';
    h += '<div class="lab">';
    h += '<div><div class="sec-t" style="margin-top:0">课程目录</div><div class="ac-list" id="acList"></div></div>';
    h += '<div><div class="pane" id="acMain"></div></div>';
    h += '</div>';
    h += '<div id="acToast" class="toast"></div>';
    host.innerHTML = h;
    renderList();
    if (cur && !cur.outlineOnly) renderUnit();
    refreshStats();
  }

  function onShow() { refreshStats(); }

  return {
    mount: mount, onShow: onShow, open: open,
    _courses: courses, _allUnits: allUnits, _findMeta: findMeta
  };
})();
