/* 通用答题模块（指标设计工坊 · 实验分析训练）
   两种模式：multi=多选（必须完全选对）single=单选（选中正确项） */
var QuizModule = (function () {
  var cur = null, cfg = null;

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 列表 ---------- */
  function renderList() {
    var box = document.getElementById('qkList');
    if (!box) return;
    var h = '';
    cfg.data.forEach(function (q, i) {
      var rec = TP.quizGet(cfg.ns, q.id);
      var dot = 'd';
      if (rec && rec.ok) dot += ' ok';
      else if (rec && rec.tries > 0) dot += ' bad';
      h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-qid="' + q.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t">' + esc(q.tag) + '</span>' +
           '<span class="' + dot + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-qid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < cfg.data.length; i++) if (cfg.data[i].id === id) { cur = cfg.data[i]; break; }
    renderList(); renderQuestion();
  }

  /* ---------- 题目 ---------- */
  function renderQuestion() {
    var box = document.getElementById('qkMain');
    if (!box || !cur) return;
    /* 支持逐题覆盖类型：题上有 type 就用题的，否则用模块默认 */
    var multi = (cur.type || cfg.type) === 'multi';
    var rec = TP.quizGet(cfg.ns, cur.id);
    var draftKey = 'tp_quiz_' + cfg.ns + '_' + cur.id;
    var picked = [];
    try { picked = JSON.parse(localStorage.getItem(draftKey) || '[]'); } catch (e) { picked = []; }

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span><span>' + esc(cur.icon || '') + ' 第 ' + (cfg.data.indexOf(cur) + 1) + ' 题</span>';
    if (rec && rec.tries) h += '<span class="badge ' + (rec.ok ? 'on' : 'soon') + '">' + (rec.ok ? '已通过' : '尝试 ' + rec.tries + ' 次') + '</span>';
    h += '</div>';
    h += '<div class="qctx" style="border-left-color:var(--am);background:rgba(217,119,6,.07)">' + nl(cur.scenario) + '</div>';
    h += '<div style="font-size:12.5px;color:var(--txt);font-weight:600;margin:10px 0 2px">' + esc(cur.ask) + '</div>';
    h += '<div class="muted" style="margin-bottom:10px">' + (multi ? '多选：必须选全正确项、且不误选，才算通过' : '单选：只有一个正确项') + '</div>';

    h += '<div id="optWrap">';
    cur.options.forEach(function (o, i) {
      h += '<div class="optcard" data-i="' + i + '" style="display:flex;gap:9px;align-items:flex-start;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:.16s">' +
           '<span class="mk" style="flex:0 0 auto;width:16px;height:16px;border:1.5px solid var(--line2);' + (multi ? 'border-radius:4px' : 'border-radius:50%') + ';margin-top:2px;display:grid;place-items:center;font-size:10px"></span>' +
           '<span style="font-size:12.5px;line-height:1.7;color:var(--txt2)">' + esc(o.t) + '</span></div>';
    });
    h += '</div>';

    h += '<div class="row"><button class="btn primary" id="qkSubmit">提交判分</button>' +
         '<button class="btn" id="qkReset">重选</button>' +
         '<span class="muted" id="qkInfo"></span></div>';
    h += '<div id="qkVerdict"></div>';

    /* 开放题：写你自己的设计/判断 */
    var noteLabel = multi ? '✍️ 我的指标体系（先自己写完整，再对照参考）' : '✍️ 我的判断依据（用一句话说清为什么）';
    h += '<div class="sec-t">' + noteLabel + '</div>';
    h += '<div class="editor"><textarea id="qkNote" style="min-height:100px;color:var(--txt)" placeholder="' +
         (multi ? '北极星指标：…&#10;一级指标：…&#10;二级指标：…' : '我选择该选项，因为…（训练自己把判断理由说清楚）') + '">' + esc(TP.getNote(cfg.ns, cur.id)) + '</textarea></div>';
    h += '<div class="row"><button class="btn" id="qkSaveNote">💾 保存</button></div>';

    /* 参考（提交后才展开提示，但可以手动展开） */
    h += '<div id="refBox"></div>';

    box.innerHTML = h;

    /* 选项点击 */
    function refreshMarks() {
      Array.prototype.forEach.call(box.querySelectorAll('.optcard'), function (el) {
        var i = parseInt(el.getAttribute('data-i'), 10);
        var on = picked.indexOf(i) >= 0;
        el.style.borderColor = on ? 'var(--accent)' : 'var(--border)';
        el.style.background = on ? 'var(--accent-light)' : 'var(--bg2)';
        var mk = el.querySelector('.mk');
        mk.textContent = on ? '✓' : '';
        mk.style.borderColor = on ? 'var(--accent)' : 'var(--border2)';
        mk.style.color = 'var(--accent)';
      });
    }
    Array.prototype.forEach.call(box.querySelectorAll('.optcard'), function (el) {
      el.onclick = function () {
        if (el.parentNode.getAttribute('data-locked') === '1') return;
        var i = parseInt(el.getAttribute('data-i'), 10);
        if (multi) {
          var at = picked.indexOf(i);
          if (at >= 0) picked.splice(at, 1); else picked.push(i);
        } else {
          picked = [i];
        }
        try { localStorage.setItem(draftKey, JSON.stringify(picked)); } catch (e) {}
        refreshMarks();
      };
    });
    refreshMarks();

    document.getElementById('qkSubmit').onclick = function () {
      if (!picked.length) { toast('先选至少一项'); return; }
      var correctCount = 0, wrongCount = 0, missed = 0;
      cur.options.forEach(function (o, i) {
        var sel = picked.indexOf(i) >= 0;
        if (o.ok && sel) correctCount++;
        if (!o.ok && sel) wrongCount++;
        if (o.ok && !sel) missed++;
      });
      var ok = multi ? (wrongCount === 0 && missed === 0) : (wrongCount === 0);
      var score = Math.round(correctCount / cur.options.filter(function (o) { return o.ok; }).length * 100);
      var rec2 = TP.markQuiz(cfg.ns, cur.id, ok, score);
      renderList(); refreshStats();

      /* 逐项反馈 */
      Array.prototype.forEach.call(box.querySelectorAll('.optcard'), function (el) {
        var i = parseInt(el.getAttribute('data-i'), 10);
        var o = cur.options[i];
        var sel = picked.indexOf(i) >= 0;
        el.parentNode.setAttribute('data-locked', '1');
        el.style.cursor = 'default';
        var col = o.ok ? 'var(--em)' : 'var(--rd)';
        el.style.borderColor = col;
        el.style.background = o.ok ? 'rgba(5,150,105,.07)' : 'rgba(220,38,38,.06)';
        var mk = el.querySelector('.mk');
        mk.textContent = o.ok ? '✓' : '✗';
        mk.style.borderColor = col; mk.style.color = col;
        var note = document.createElement('div');
        note.style.cssText = 'font-size:11.5px;line-height:1.75;color:' + col + ';margin-top:6px';
        note.innerHTML = (sel ? '【你选了】' : '【你没选】') + ' ' + esc(o.note);
        el.querySelector('span:last-of-type').appendChild(note);
      });

      var v = document.getElementById('qkVerdict');
      v.innerHTML = '<div class="verdict ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✅ 通过！' : '✗ 还没通过') + '</b>　' +
        '正确项命中 ' + correctCount + '/' + cur.options.filter(function (o) { return o.ok; }).length +
        (wrongCount ? '　误选 ' + wrongCount + ' 项' : '') +
        (missed ? '　漏选 ' + missed + ' 项' : '') +
        '（第 ' + rec2.tries + ' 次尝试' + (rec2.firstTry ? ' · 一次做对 👏' : '') + '）' +
        (ok ? '' : '<br><span class="muted">看下方每项的解析，想清楚"为什么这个指标不该进指标体系"，再重选。</span>') + '</div>';
      showRef();
      document.getElementById('qkVerdict').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    document.getElementById('qkReset').onclick = function () {
      picked = [];
      try { localStorage.setItem(draftKey, '[]'); } catch (e) {}
      renderQuestion();
    };
    document.getElementById('qkSaveNote').onclick = function () {
      TP.setNote(cfg.ns, cur.id, document.getElementById('qkNote').value);
      toast('已保存');
    };

    function showRef() {
      var rb = document.getElementById('refBox');
      if (!rb || rb.getAttribute('data-shown') === '1') return;
      rb.setAttribute('data-shown', '1');
      var rh = '';
      if (cur.north) {
        rh += '<div class="sec-t">🎯 参考指标体系</div><div class="card">';
        rh += '<div style="font-size:12.5px;line-height:1.85;color:var(--em);margin-bottom:8px">' + nl(cur.north) + '</div>';
        if (cur.tree) {
          rh += '<div style="font-size:11.5px;color:var(--txt2);line-height:2"><b style="color:var(--cy)">指标树</b><br>';
          cur.tree.forEach(function (t) { rh += '· ' + esc(t) + '<br>'; });
          rh += '</div>';
        }
        if (cur.pitfalls) {
          rh += '<div style="font-size:11.5px;color:var(--txt2);line-height:2;margin-top:8px"><b style="color:var(--rd)">常见陷阱</b><br>';
          cur.pitfalls.forEach(function (t) { rh += '⚠️ ' + esc(t) + '<br>'; });
          rh += '</div>';
        }
        rh += '</div>';
      }
      if (cur.keyPoints) {
        rh += '<div class="sec-t">🔑 判读要点</div><div class="card"><div style="font-size:12px;line-height:2;color:var(--txt2)">';
        cur.keyPoints.forEach(function (k) { rh += '· ' + esc(k) + '<br>'; });
        rh += '</div></div>';
      }
      if (cur.takeaway) {
        rh += '<div class="callout" style="margin-top:10px;background:var(--accent-light);border-left:3px solid var(--cy);border-radius:9px;padding:11px 13px;font-size:12.5px;line-height:1.8;color:var(--txt)">💡 <b>一句话记住</b>　' + esc(cur.takeaway) + '</div>';
      }
      rb.innerHTML = rh;
    }
    if (rec && rec.tries) showRef();
  }

  function refreshStats() {
    var s = TP.quizStats(cfg.ns, cfg.data.length);
    var el = document.getElementById('qkStats');
    if (!el) return;
    el.innerHTML =
      '<div class="stat cy"><b>' + s.done + '<span style="font-size:12px;color:var(--txt3)">/' + s.total + '</span></b><span>已通过</span></div>' +
      '<div class="stat em"><b>' + s.mastery + '%</b><span>一次做对率</span></div>' +
      '<div class="stat am"><b>' + s.tries + '</b><span>累计尝试</span></div>' +
      '<div class="stat vi"><b>' + s.pct + '%</b><span>完成度</span></div>';
  }

  function mount(host, config) {
    cfg = config;
    var firstUndone = null;
    for (var i = 0; i < cfg.data.length; i++) { if (!TP.isQuizDone(cfg.ns, cfg.data[i].id)) { firstUndone = cfg.data[i]; break; } }
    cur = firstUndone || cfg.data[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">' + esc(cfg.title) + '</span>' + (cfg.suffix ? ' · ' + esc(cfg.suffix) : '') + '</div>' +
      '<div class="sub">' + esc(cfg.sub) + '</div>' +
      '<div class="stats" id="qkStats" style="margin-bottom:14px"></div>' +
      (cfg.meta && cfg.meta.intro ? '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.85">💡 ' + esc(cfg.meta.intro) + '</div></div>' : '') +
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">题目导航</div><div class="qlist" id="qkList"></div></div>' +
        '<div><div class="pane" id="qkMain"></div></div>' +
      '</div>';

    renderList(); renderQuestion(); refreshStats();
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
