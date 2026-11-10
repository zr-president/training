/* 学习学院 · 模块 v4
   结构：15 门课 / 88 单元（courses → units，data 来自 academy_courses.js + academy.js）

   v3：单元内容改成【书本翻页】—— 顶部固定标题区 + 页签，下方只显示当前页，
       底部翻页按钮 + 键盘左右键 + 页码进度，翻到哪页会被记住。
   v4 的两处改动：
     ① 【密度自适应】v3 是「7 步 = 7 页」，每页只有约 640 字符，太薄。
        实测 88 个单元内容量 3368-6845 字符，最短单元任何 2 分法都会让某页到 3200 字符，
        所以目标密度定为约 2000 字符/页 → 绝大多数单元 3 页，长的 4 页（代码仍支持 2 页）。
        分页在 7 个 step 的边界上动态求最优切分（最小化最长的页）。
     ② 【全局索引】新增「索引」视图：概念 → 单元 反查 + 单元速查表，可搜索。 */
var AcademyModule = (function () {
  var NS = 'academy';
  var cur = null;
  var curPage = 0;
  var VIEW = 'unit';   /* 'unit' | 'index' */

  var STEP_LABELS = ['场景', '核心图', '例题', '引导练习', '独立变式', '迁移产物', '复测'];
  var STEP_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
  /* 页面标签用的短名 */
  var SHORT = {
    scene: '场景', figure: '概念图', example: '例题', guided: '练习',
    variant: '变式', artifact: '产物', retest: '复测'
  };
  /* 交互组件与表格的额外竖向占位（字符当量）——让「体量」更接近真实渲染高度 */
  var OVER = { scene: 0, figure: 260, example: 220, guided: 520, variant: 460, artifact: 360, retest: 160 };
  /* 目标密度：字符/页。实测 2000 能落到「多数 3 页、长的 4 页」 */
  var DENSITY = 2000;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function courses() { return (typeof ACADEMY_COURSES !== 'undefined') ? ACADEMY_COURSES : []; }
  function allUnits() {
    var out = [];
    courses().forEach(function (c) { c.units.forEach(function (u) { out.push({ course: c, unit: u }); }); });
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

  /* ---------------- 分页：把 7 个 step 按内容量切成 2-4 页 ---------------- */
  function stepWeight(s) {
    var n = OVER[s.type] || 0;
    ['title', 'html', 'question', 'task', 'tip', 'howTo', 'answer', 'explain', 'reference', 'placeholder']
      .forEach(function (k) { if (typeof s[k] === 'string') n += s[k].length; });
    (s.options || []).forEach(function (o) { n += (o.text || '').length; });
    ['hints', 'questions', 'selfCheck'].forEach(function (k) {
      (s[k] || []).forEach(function (x) { n += x.length; });
    });
    return n;
  }

  /* 在 step 边界上切成 k 段，使「最长的一段」尽量短 */
  function bestSplit(weights, k) {
    var n = weights.length;
    if (k > n) k = n;
    if (k < 1) k = 1;
    var pre = [0];
    for (var i = 0; i < n; i++) pre.push(pre[i] + weights[i]);
    function seg(a, b) { return pre[b] - pre[a]; }
    var best = null, cuts = [];
    (function rec(start, left) {
      if (left === 0) {
        var all = [0].concat(cuts).concat([n]);
        var mx = 0, sums = [];
        for (var i = 0; i < all.length - 1; i++) {
          var v = seg(all[i], all[i + 1]);
          sums.push(v);
          if (v > mx) mx = v;
        }
        if (!best || mx < best.mx) best = { mx: mx, all: all, sums: sums };
        return;
      }
      for (var c = start; c <= n - left; c++) { cuts.push(c); rec(c + 1, left - 1); cuts.pop(); }
    })(1, k - 1);
    return best;
  }

  function labelOf(types) {
    var names = types.map(function (t) { return SHORT[t] || t; });
    if (names.length <= 3) return names.join('·');
    return names[0] + '…' + names[names.length - 1];
  }

  var PAGES_CACHE = {};
  var IX_OPEN = {};   /* 索引视图：哪些课程是展开的（记在内存里，切视图不丢） */
  function buildPages(unit) {
    if (PAGES_CACHE[unit.id]) return PAGES_CACHE[unit.id];
    var w = unit.steps.map(stepWeight);
    var total = w.reduce(function (a, b) { return a + b; }, 0);
    var k = Math.round(total / DENSITY);
    k = Math.max(2, Math.min(4, k));
    if (k > w.length) k = w.length;
    var b = bestSplit(w, k);
    var pages = [];
    for (var i = 0; i < b.all.length - 1; i++) {
      var idx = [];
      for (var j = b.all[i]; j < b.all[i + 1]; j++) idx.push(j);
      pages.push({
        idx: idx,
        label: labelOf(idx.map(function (x) { return unit.steps[x].type; })),
        weight: b.sums[i]
      });
    }
    PAGES_CACHE[unit.id] = pages;
    return pages;
  }

  function isLearned(id) { try { return TP.getNote(NS, id + '_learned') === '1'; } catch (e) { return false; } }
  function markLearned(id, v) { try { TP.setNote(NS, id + '_learned', v ? '1' : ''); } catch (e) {} }
  function retestAt(id) { try { return TP.getNote(NS, id + '_retest'); } catch (e) { return null; } }
  function scheduleRetest(id, days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    var s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    try { TP.setNote(NS, id + '_retest', s); } catch (e) {}
    return s;
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* 翻到第几页会被记住（下次进来接着看） */
  function getPage(id) {
    try { var v = TP.getNote(NS, id + '_page'); var n = v ? parseInt(v, 10) : 0; return isNaN(n) ? 0 : n; } catch (e) { return 0; }
  }
  function setPage(id, p) { try { TP.setNote(NS, id + '_page', String(p)); } catch (e) {} }

  var STATUS_LABEL = { ready: '可学', outline: '大纲已定', planned: '规划中' };
  var DEPTH_COLOR = { '入门': 'var(--cy)', '进阶': 'var(--vi)', '实战': 'var(--am)' };

  /* ---------------- 左侧目录 ---------------- */
  function renderList() {
    var box = document.getElementById('acList');
    if (!box) return;
    var h = '';

    ACADEMY.layers.forEach(function (L) {
      var cs = courses().filter(function (c) { return c.layer === L.id; });
      var totalN = 0;
      cs.forEach(function (c) { totalN += c.units.length; });
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
             '<span class="ac-course-cnt">' + doneN + '/' + c.units.length + '</span></div>';
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
        var cid = el.getAttribute('data-cid'), first = null;
        courses().forEach(function (c) {
          if (c.id !== cid) return;
          for (var i = 0; i < c.units.length; i++) if (c.units[i].status === 'ready') { first = c.units[i]; break; }
          if (!first && c.units.length) first = c.units[0];
        });
        if (first) open(first.id);
      };
    });
    Array.prototype.forEach.call(box.querySelectorAll('.ac-unit'), function (el) {
      el.onclick = function () { open(el.getAttribute('data-uid')); };
    });
  }

  /* ---------------- 打开单元 ---------------- */
  function open(id) {
    VIEW = 'unit';
    var meta = findMeta(id);
    if (meta && meta.unit.status !== 'ready') {
      cur = { id: id, outlineOnly: true };
      renderList(); renderOutline(meta); return;
    }
    var c = unitContent(id);
    if (!c) {
      cur = { id: id, outlineOnly: true };
      renderList(); renderOutline(meta); return;
    }
    var sameUnit = cur && cur.id === id;
    cur = c;
    cur.outlineOnly = false;
    if (!sameUnit) curPage = getPage(id);
    renderList(); renderMain();
  }

  function renderMain() {
    syncViewBtns();
    if (VIEW === 'index') return renderIndex();
    return renderUnit();
  }

  function syncViewBtns() {
    var a = document.getElementById('ixBtnUnit');
    var b = document.getElementById('ixBtnIndex');
    if (a) a.className = 'btn ' + (VIEW === 'unit' ? 'primary' : 'ghost');
    if (b) b.className = 'btn ' + (VIEW === 'index' ? 'primary' : 'ghost');
  }

  /* ---------------- 全局索引：概念 → 单元 反查 ---------------- */
  function conceptMap() {
    var m = {};
    ACADEMY.units.forEach(function (u) {
      (u.concepts || []).forEach(function (c) { (m[c] = m[c] || []).push(u.id); });
    });
    return m;
  }

  function renderIndex() {
    var box = document.getElementById('acMain');
    if (!box) return;
    var cmap = conceptMap();
    var concepts = Object.keys(cmap).sort(function (a, b) {
      return (cmap[b].length - cmap[a].length) || a.localeCompare(b, 'zh');
    });
    var all = allUnits().filter(function (x) { return x.unit.status === 'ready'; });
    /* 概念很多（400+），一次全铺开会把单元表挤到屏幕外 —— 默认只放前 48 个 */
    var TOPN = 48;
    var multi = concepts.filter(function (c) { return cmap[c].length > 1; }).length;

    var h = '';
    h += '<div class="bk-head">';
    h += '<div class="ac-crumb">学习学院 · 全局索引</div>';
    h += '<div class="bk-title">全局索引：按 15 门课折叠</div>';
    h += '<div class="bk-sub">点课程名展开该门课的索引（每行给「概念 + 一条最容易踩的坑」）。' +
         '搜概念 / 标题 / 编号（如 sq02）会自动展开命中的课程。' +
         '需要按概念横跨多门课反查时，展开下面的概念云（' + concepts.length + ' 个概念，其中 ' + multi + ' 个跨单元）。</div>';
    h += '<div class="ix-search"><input id="ixQ" type="search" placeholder="搜概念 / 单元标题 / 课程名 / 编号…"></div>';
    h += '</div>';

    h += '<div class="bk-page">';
    h += '<details class="bk-info ix-cloud"><summary>按概念反查（' + concepts.length + ' 个）</summary>';
    h += '<div class="ix-chips" id="ixChips">';
    concepts.forEach(function (c, i) {
      var hidden = i >= TOPN;
      h += '<button class="ix-chip' + (hidden ? ' more' : '') + '" data-c="' + esc(c) + '"' +
           (hidden ? ' style="display:none"' : '') + '>' + esc(c) +
           '<i>' + cmap[c].length + '</i></button>';
    });
    h += '</div>';
    if (concepts.length > TOPN) {
      h += '<button class="btn ghost ix-more" style="padding:5px 12px;font-size:12px;margin-top:4px">' +
           '展开全部 ' + concepts.length + ' 个 ↓</button>';
    }
    h += '</details>';
    h += '<div class="ix-toolbar"><span id="ixCount"></span>' +
         '<button class="btn ghost ix-all" style="padding:4px 11px;font-size:11.5px">全部展开</button>' +
         '<button class="btn ghost ix-none" style="padding:4px 11px;font-size:11.5px">全部收起</button></div>';
    h += '<div class="ix-list" id="ixList"></div>';
    h += '</div>';
    box.innerHTML = h;

    renderIndexList('');
    wireIndex();
  }

  function renderIndexList(q) {
    var listEl = document.getElementById('ixList');
    if (!listEl) return;
    var qq = String(q || '').trim().toLowerCase();
    var h = '', shown = 0, courseCount = 0;

    courses().forEach(function (co) {
      var total = 0;
      var units = co.units.filter(function (u) {
        if (u.status !== 'ready') return false;
        total++;
        if (!qq) return true;
        /* 大纲对象的 concepts 可能为空，必须从内容对象取（否则按概念筛不出东西） */
        var ct = unitContent(u.id);
        var cs = (ct && ct.concepts) || u.concepts || [];
        var blob = (u.id + ' ' + u.title + ' ' + (u.subtitle || '') + ' ' + co.name + ' ' +
                    cs.join(' ')).toLowerCase();
        return blob.indexOf(qq) >= 0;
      });
      if (!units.length) return;
      /* 搜索时自动展开命中的课程；否则按记忆里的展开状态 */
      var open = qq ? true : !!IX_OPEN[co.id];
      shown += units.length;
      courseCount++;

      h += '<div class="ix-course' + (open ? ' open' : '') + '" data-cid="' + co.id + '">';
      h += '<div class="ix-course-hd">' +
           '<span class="ix-course-arrow">' + (open ? '▾' : '▸') + '</span>' +
           '<span class="ix-course-nm">' + esc(co.name) + '</span>' +
           '<span class="ix-course-layer">' + esc(co.layer) + '</span>' +
           '<span class="ix-course-cnt">' + units.length + ' / ' + total + ' 单元</span>' +
           '</div>';
      h += '<div class="ix-course-body">';
      units.forEach(function (u) {
        var content = unitContent(u.id);
        var cs = (content && content.concepts) || u.concepts || [];
        var pit = (content && content.pitfalls && content.pitfalls[0]) || '';
        var pgs = content ? buildPages(content).length : 0;
        /* minutes / subtitle 也只写在内容对象里，大纲对象上没有 */
        var mins = (content && content.minutes) || u.minutes || '';
        var sub = (content && content.subtitle) || u.subtitle || '';
        h += '<div class="ix-row" data-uid="' + u.id + '">';
        h += '<div class="ix-row-t">' + esc(u.title) + '</div>';
        h += '<div class="ix-row-m">' + esc(u.depth) +
             (mins ? ' · ' + mins + ' 分钟' : '') + ' · ' + pgs + ' 页' +
             (isLearned(u.id) ? ' · <b style="color:var(--em)">已学习</b>' : '') + '</div>';
        if (sub) h += '<div class="ix-row-s">' + esc(sub) + '</div>';
        h += '<div class="ix-row-c">' + cs.map(function (c) {
          return '<span class="ix-cc">' + esc(c) + '</span>';
        }).join('') + '</div>';
        if (pit) h += '<div class="ix-row-p">⚠️ ' + esc(pit) + '</div>';
        h += '</div>';
      });
      h += '</div></div>';
    });

    listEl.innerHTML = shown ? h
      : '<div class="ac-callout" style="margin-top:12px">没有匹配的单元。换个词试试，或者清空搜索框。</div>';

    var cntEl = document.getElementById('ixCount');
    if (cntEl) cntEl.textContent = qq
      ? '命中 ' + shown + ' 个单元 · ' + courseCount + ' 门课（已自动展开）'
      : '共 ' + shown + ' 个单元 · ' + courseCount + ' 门课（默认收起，点课程名展开）';

    /* 课程折叠头 */
    Array.prototype.forEach.call(listEl.querySelectorAll('.ix-course-hd'), function (hd) {
      hd.onclick = function () {
        var wrap = hd.parentNode;
        var cid = wrap.getAttribute('data-cid');
        var isOpen = wrap.classList.contains('open');
        wrap.classList.toggle('open', !isOpen);
        hd.querySelector('.ix-course-arrow').textContent = isOpen ? '▸' : '▾';
        IX_OPEN[cid] = !isOpen;
      };
    });

    Array.prototype.forEach.call(listEl.querySelectorAll('.ix-row'), function (el) {
      el.onclick = function () { open(el.getAttribute('data-uid')); };
    });
  }

  function wireIndex() {
    var q = document.getElementById('ixQ');
    if (q) q.oninput = function () { renderIndexList(q.value); };

    function setAll(v) {
      courses().forEach(function (co) { IX_OPEN[co.id] = v; });
      var inp = document.getElementById('ixQ');
      if (inp) inp.value = '';
      Array.prototype.forEach.call(document.querySelectorAll('#ixChips .ix-chip'), function (x) {
        x.classList.remove('on');
      });
      renderIndexList('');
    }
    var aAll = document.querySelector('.ix-all');
    if (aAll) aAll.onclick = function () { setAll(true); };
    var aNone = document.querySelector('.ix-none');
    if (aNone) aNone.onclick = function () { setAll(false); };

    var more = document.querySelector('.ix-more');
    if (more) more.onclick = function () {
      Array.prototype.forEach.call(document.querySelectorAll('#ixChips .ix-chip.more'), function (x) {
        x.style.display = '';
      });
      more.style.display = 'none';
    };
    Array.prototype.forEach.call(document.querySelectorAll('#ixChips .ix-chip'), function (b) {
      b.onclick = function () {
        var c = b.getAttribute('data-c');
        var wasOn = b.classList.contains('on');
        Array.prototype.forEach.call(document.querySelectorAll('#ixChips .ix-chip'), function (x) {
          x.classList.remove('on');
        });
        var qq = '';
        if (!wasOn) { b.classList.add('on'); qq = c; }
        var inp = document.getElementById('ixQ');
        if (inp) inp.value = qq;
        renderIndexList(qq);
      };
    });
  }

  function renderOutline(meta) {
    var box = document.getElementById('acMain');
    if (!box || !meta) return;
    var c = meta.course, u = meta.unit;
    var h = '';
    h += '<div class="ac-crumb">' + esc(c.name) + '</div>';
    h += '<div class="bk-title">' + esc(u.title) + '</div>';
    h += '<div class="ac-meta"><span>' + esc(c.name) + '</span><span>' + esc(u.depth) + '</span>' +
         '<span style="color:var(--am)">内容未写</span></div>';
    h += '<div class="ac-goalbox"><b>这一单元的目标</b><div>' + esc(u.goal) + '</div></div>';
    h += '<div class="ac-callout"><b>这一单元还没写内容。</b><br>' +
         '大纲已经定了（上面那句就是它的目标），但 7 步内容还没做。' +
         '目前已有 <b>' + allUnits().filter(function (x) { return x.unit.status === 'ready'; }).length + ' 个单元</b>' +
         '写全了 7 步内容，其余仍是「大纲已定」。<br><br>' +
         '<b>本门课其余单元</b>：' + esc(c.units.map(function (x) { return x.title; }).join(' ／ ')) + '</div>';
    h += '<div class="ac-callout" style="background:var(--bg2);border-left-color:var(--text3)"><b>这门课为什么在你的路线里</b><br>' + esc(c.why || '') + '</div>';
    box.innerHTML = h;
  }

  /* ---------------- 单页渲染 ---------------- */
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
           '<textarea class="ac-ta" rows="6" placeholder="' + esc(s.placeholder) + '"></textarea>' +
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

  /* ---------------- 书本式单元视图 ---------------- */
  function renderUnit() {
    var box = document.getElementById('acMain');
    if (!box || !cur || cur.outlineOnly) return;
    var meta = findMeta(cur.id);
    var pages = buildPages(cur);
    var total = pages.length;
    if (curPage < 0) curPage = 0;
    if (curPage > total - 1) curPage = total - 1;
    setPage(cur.id, curPage);

    var h = '';
    h += '<div id="bkTop"></div>';

    /* 标题区：课程名 + 单元名 + 元信息 + 页签 —— 翻页时始终在一起 */
    h += '<div class="bk-head">';
    if (meta) {
      var idx = meta.course.units.map(function (u) { return u.id; }).indexOf(cur.id) + 1;
      h += '<div class="ac-crumb">' + esc(meta.course.name) + ' · 第 ' + idx + ' / ' + meta.course.units.length + ' 单元</div>';
    }
    h += '<div class="bk-title">' + esc(cur.title) + '</div>';
    h += '<div class="bk-sub">' + esc(cur.subtitle) + '</div>';
    h += '<div class="ac-meta">' +
         '<span>' + esc(cur.domain) + '</span><span>' + cur.minutes + ' 分钟</span>' +
         '<span>' + esc(cur.level) + '</span><span>先修：' + esc(cur.prereq) + '</span></div>';
    h += '<details class="bk-info"><summary>学完你能做到 · 涉及概念</summary>' +
         '<div class="ac-goalbox" style="margin-top:8px"><b>学完你能做到</b><div>' + esc(cur.goal) + '</div></div>' +
         '<div class="ac-concepts"><b>涉及概念</b>' +
         cur.concepts.map(function (c) { return '<span class="ac-chip">' + esc(c) + '</span>'; }).join('') +
         '</div></details>';

    /* 页签（一页可能含 2-3 个 step） */
    h += '<div class="bk-tabs">';
    pages.forEach(function (pg, i) {
      var on = i === curPage;
      var done = i < curPage;
      h += '<button class="bk-tab' + (on ? ' on' : '') + (done ? ' done' : '') + '" data-p="' + i + '"' +
           (on ? ' aria-current="page"' : '') + '>' +
           '<span class="bk-tab-n">' + (STEP_NUMS[i] || (i + 1)) + '</span>' +
           '<span class="bk-tab-l">' + esc(pg.label) + '</span>' +
           '</button>';
    });
    h += '</div>';
    h += '<div class="bk-bar"><i style="width:' + Math.round(((curPage + 1) / total) * 100) + '%"></i></div>';
    h += '</div>';

    /* 当前页内容（只渲染这一页所包含的 step） */
    h += '<div class="bk-page">' + pages[curPage].idx.map(function (si) {
      return renderStep(cur.steps[si], si);
    }).join('') + '</div>';

    /* 底部翻页 */
    h += '<div class="bk-foot">';
    h += '<button class="btn ghost bk-prev" style="padding:7px 15px;font-size:12.5px"' + (curPage === 0 ? ' disabled' : '') + '>← 上一页</button>';
    h += '<div class="bk-pg">第 <b>' + (curPage + 1) + '</b> / ' + total + ' 页 · ' +
         esc(pages[curPage].label) + '</div>';
    if (curPage < total - 1) {
      h += '<button class="btn primary bk-next" style="padding:7px 15px;font-size:12.5px">下一页 →</button>';
    } else {
      h += isLearned(cur.id)
        ? '<button class="btn ghost ac-mark" data-v="0" style="padding:7px 15px;font-size:12.5px">取消「已学习」</button>'
        : '<button class="btn primary ac-mark" data-v="1" style="padding:7px 15px;font-size:12.5px">标记为已学习</button>';
    }
    h += '</div>';
    h += '<div class="bk-note">学完只标「已学习」，<b>不代表已掌握</b> —— 掌握要看 3 天后不看原文能不能答出来。翻页可用键盘 ← →</div>';

    box.innerHTML = h;
    wire();
  }

  function goPage(p) {
    var total = buildPages(cur).length;
    var np = Math.max(0, Math.min(total - 1, p));
    if (np === curPage) return;
    curPage = np;
    renderUnit();
    var top = document.getElementById('bkTop');
    if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  /* ---------------- 交互 ---------------- */
  function wire() {
    var box = document.getElementById('acMain');
    if (!box) return;

    /* 页签与翻页 */
    Array.prototype.forEach.call(box.querySelectorAll('.bk-tab'), function (b) {
      b.onclick = function () { goPage(parseInt(b.getAttribute('data-p'), 10)); };
    });
    var prev = box.querySelector('.bk-prev');
    if (prev) prev.onclick = function () { goPage(curPage - 1); };
    var next = box.querySelector('.bk-next');
    if (next) next.onclick = function () { goPage(curPage + 1); };

    /* 键盘左右键（只绑定一次） */
    if (!wire._kb) {
      wire._kb = function (e) {
        if (!cur || cur.outlineOnly) return;
        var tg = (e.target && e.target.tagName) || '';
        if (tg === 'TEXTAREA' || tg === 'INPUT') return;
        var hash = (location.hash || '');
        if (hash.indexOf('#/academy') < 0) return;
        if (e.key === 'ArrowLeft') { goPage(curPage - 1); }
        else if (e.key === 'ArrowRight') { goPage(curPage + 1); }
      };
      document.addEventListener('keydown', wire._kb);
    }

    /* 页内每个 step 分别绑定（v4：一页可能含 2-3 个 step，不能只取第一个） */
    Array.prototype.forEach.call(box.querySelectorAll('.ac-step'), function (stEl) {
      var si = parseInt(stEl.getAttribute('data-step'), 10);
      var s = cur.steps[si];
      if (!s) return;
      if (s.type === 'guided') wireGuided(stEl, s);
      else if (s.type === 'variant') wireVariant(stEl, s);
      else if (s.type === 'retest') wireRetest(stEl, s);
    });

    /* 标记已学习 */
    var mk = box.querySelector('.ac-mark');
    if (mk) mk.onclick = function () {
      var v2 = mk.getAttribute('data-v') === '1';
      markLearned(cur.id, v2);
      try { if (typeof Ledger !== 'undefined') Ledger.add('active', 'academy', 0, {}); } catch (e) {}
      renderList(); renderUnit();
      toast(v2 ? '已标记为已学习（不代表已掌握）' : '已取消');
    };
  }

  /* 引导练习：三级提示 + 选项判定 */
  function wireGuided(g, s) {
    var cnt = g.querySelector('.ac-hint-cnt');
    var hb = g.querySelector('.ac-hint-btn');
    var hintsBox = g.querySelector('.ac-hints');
    var lvl = 0;
    if (!hb) return;
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

  /* 独立变式：草稿自动保存 + 看参考 */
  function wireVariant(v, vs) {
    var ta = v.querySelector('.ac-ta');
    if (ta) {
      try { var draft = TP.getNote(NS, cur.id + '_draft'); if (draft) ta.value = draft; } catch (e) {}
      ta.oninput = function () { try { TP.setNote(NS, cur.id + '_draft', ta.value); } catch (e) {} };
    }
    var rb = v.querySelector('.ac-ref');
    if (rb) rb.onclick = function () {
      v.querySelector('.ac-refbox').innerHTML =
        '<div class="ac-explain">' + vs.reference.replace(/\n/g, '<br>') + '</div>';
    };
  }

  /* 复测：安排 3 天后 */
  function wireRetest(r, rs) {
    var sch = r.querySelector('.ac-sch');
    if (sch) sch.onclick = function () {
      var at = scheduleRetest(cur.id, rs.days);
      renderUnit();
      toast('已安排 ' + at + ' 复测');
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
    if (firstReady) { cur = unitContent(firstReady.id); cur.outlineOnly = false; curPage = getPage(cur.id); }

    var h = '';
    h += '<div class="h1"><span class="grad">学习学院</span> · 系统分层教学</div>';
    h += '<div class="sub">' + courses().length + ' 门课 / ' + allUnits().length + ' 个单元，由浅入深。' +
         '每单元固定 7 步（场景 → 核心图 → 例题 → 引导练习 → 独立变式 → 迁移产物 → 3 天后复测），' +
         '<b>按内容量自动合成 2-4 页</b>，一页读完一块，不用来回滚。</div>';
    h += '<div class="stats" id="acStats" style="margin-bottom:14px"></div>';
    h += '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.9">' +
         '📖 <b>怎么用</b>　左侧选课程与单元；右侧一页读完一整块（约「概念 / 例题+练习 / 动手+复测」），' +
         '用<b>页签或 ← → 键</b>翻页，翻到哪页会被记住。练习页卡住时点「我需要提示」，有三级提示逐层给。<br>' +
         '<span style="color:var(--text3)">学完只标「已学习」，<b>不代表已掌握</b> —— 掌握要看最后一页排的 3 天后复测。</span>'
         + '</div></div>';
    h += '<div class="ix-togglebar">' +
         '<button class="btn primary" id="ixBtnUnit">单元</button>' +
         '<button class="btn ghost" id="ixBtnIndex">全局索引</button>' +
         '<span>索引视图：按概念反查它出现在哪几个单元，适合回头查</span></div>';
    h += '<div class="lab">';
    h += '<div><div class="sec-t" style="margin-top:0">课程目录</div><div class="ac-list" id="acList"></div></div>';
    h += '<div><div class="pane" id="acMain"></div></div>';
    h += '</div>';
    h += '<div id="acToast" class="toast"></div>';
    host.innerHTML = h;
    renderList();
    if (cur && !cur.outlineOnly) renderMain();
    refreshStats();

    var bu = document.getElementById('ixBtnUnit');
    var bi = document.getElementById('ixBtnIndex');
    if (bu) bu.onclick = function () { VIEW = 'unit'; renderMain(); };
    if (bi) bi.onclick = function () { VIEW = 'index'; renderMain(); };
  }

  function onShow() { refreshStats(); }

  return {
    mount: mount, onShow: onShow, open: open,
    _courses: courses, _allUnits: allUnits, _findMeta: findMeta
  };
})();
