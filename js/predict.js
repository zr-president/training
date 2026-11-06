/* 预测日志 + Brier 分数
   目的：把「我判断得准不准」变成可计算的数字，而不是感觉。

   规则：
   - 每条预测写清：判断内容、我的概率（0-100%）、验证日期
   - 到期后标记「对 / 错」，才算 resolved
   - Brier 分数 = 已判定条目的 (概率 − 结果)² 的平均值，结果取 1 或 0
       0.00 = 完美；0.25 = 永远押 50%；越低越好
   - 另给「校准表」：把所有预测按概率分桶，看每桶的实际命中率是否接近预测概率
       （比如「说 70% 的那些，实际对了多少次」）

   为什么要做这件事（写在代码里，避免以后忘）：
   每天读 17 个板块的判断，但从不检验自己当时对不对 —— 这是信息茧房最硬的一面。
   输入饱和、输出贫乏，只有把「预测 → 验证」闭环建起来，才知道自己错在哪。 */
var Predict = (function () {
  var KEY = 'tp_predict_v1';

  function store(s) { return s || (typeof localStorage !== 'undefined' ? localStorage : null); }

  function load(s) {
    try {
      var raw = store(s).getItem(KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function save(arr, s) {
    try { store(s).setItem(KEY, JSON.stringify(arr)); return true; }
    catch (e) { return false; }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shift(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------------- 纯函数：Brier 与校准 ---------------- */
  /* p 用 0-1 的小数；o 用 1(对) / 0(错) */
  function brier(list) {
    var rs = (list || []).filter(function (e) {
      return e && e.resolved && typeof e.p === 'number' && (e.outcome === 0 || e.outcome === 1);
    });
    if (!rs.length) return { n: 0, score: null };
    var sum = 0;
    for (var i = 0; i < rs.length; i++) {
      var d = rs[i].p - rs[i].outcome;
      sum += d * d;
    }
    return { n: rs.length, score: sum / rs.length };
  }

  /* 校准表：按预测概率分 5 桶（0-20/20-40/40-60/60-80/80-100） */
  function calibration(list) {
    var buckets = [
      { lo: 0.0, hi: 0.2, label: '0–20%', n: 0, hits: 0, sumP: 0 },
      { lo: 0.2, hi: 0.4, label: '20–40%', n: 0, hits: 0, sumP: 0 },
      { lo: 0.4, hi: 0.6, label: '40–60%', n: 0, hits: 0, sumP: 0 },
      { lo: 0.6, hi: 0.8, label: '60–80%', n: 0, hits: 0, sumP: 0 },
      { lo: 0.8, hi: 1.01, label: '80–100%', n: 0, hits: 0, sumP: 0 }
    ];
    (list || []).forEach(function (e) {
      if (!e || !e.resolved || typeof e.p !== 'number') return;
      if (e.outcome !== 0 && e.outcome !== 1) return;
      for (var i = 0; i < buckets.length; i++) {
        if (e.p >= buckets[i].lo && e.p < buckets[i].hi) {
          buckets[i].n++;
          buckets[i].sumP += e.p;
          if (e.outcome === 1) buckets[i].hits++;
          break;
        }
      }
    });
    return buckets.map(function (b) {
      return {
        label: b.label, n: b.n, hits: b.hits,
        avgP: b.n ? b.sumP / b.n : null,
        actual: b.n ? b.hits / b.n : null
      };
    });
  }

  /* 未判定 / 已到期 / 未到期 */
  function stats(list) {
    list = list || [];
    var t = today();
    var pending = list.filter(function (e) { return !e.resolved; });
    var due = pending.filter(function (e) { return e.resolveAt && e.resolveAt <= t; });
    var b = brier(list);
    return {
      total: list.length,
      resolved: list.filter(function (e) { return e.resolved; }).length,
      pending: pending.length,
      due: due.length,
      brier: b.score,
      brierN: b.n
    };
  }

  /* 校验一条新预测 */
  function validate(text, probPct, resolveAt) {
    text = String(text || '').trim();
    if (text.length < 4) return { ok: false, error: '判断内容太短（至少 4 个字）' };
    var p = Number(probPct);
    if (isNaN(p) || p < 0 || p > 100) return { ok: false, error: '概率要在 0–100 之间' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(resolveAt || ''))) return { ok: false, error: '验证日期格式应为 YYYY-MM-DD' };
    if (String(resolveAt) < today()) return { ok: false, error: '验证日期不能早于今天' };
    return { ok: true, p: p / 100 };
  }

  function add(text, probPct, resolveAt, s) {
    var v = validate(text, probPct, resolveAt);
    if (!v.ok) return v;
    var arr = load(s);
    var e = {
      id: 'pd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: String(text).trim(),
      p: v.p,
      createdAt: today(),
      resolveAt: String(resolveAt),
      resolved: false,
      outcome: null,
      resolvedAt: null
    };
    arr.push(e);
    if (!save(arr, s)) return { ok: false, error: '写入失败' };
    return { ok: true, item: e };
  }

  function resolve(id, outcome, s) {
    var arr = load(s);
    var hit = null;
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) { hit = arr[i]; break; }
    if (!hit) return { ok: false, error: '找不到这条' };
    hit.resolved = true;
    hit.outcome = outcome ? 1 : 0;
    hit.resolvedAt = today();
    if (!save(arr, s)) return { ok: false, error: '写入失败' };
    return { ok: true, item: hit };
  }

  function remove(id, s) {
    var arr = load(s);
    var n = arr.filter(function (e) { return e.id !== id; });
    if (n.length === arr.length) return false;
    return save(n, s);
  }

  /* ---------------- UI ---------------- */
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function say(msg, ok) {
    var t = document.getElementById('pdToast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = ok ? 'var(--em)' : 'var(--rd)';
    t.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  function render() {
    var host = document.getElementById('pdBody');
    if (!host) return;
    var list = load();
    var st = stats(list);
    var cal = calibration(list);
    var h = '';

    /* 概览 */
    h += '<div class="stats" style="margin-bottom:14px">';
    h += '<div class="stat cy"><b>' + st.total + '</b><span>总预测</span></div>';
    h += '<div class="stat em"><b>' + st.resolved + '</b><span>已判定</span></div>';
    h += '<div class="stat ' + (st.due ? 'rd' : 'am') + '"><b>' + st.due + '</b><span>到期待判定</span></div>';
    h += '<div class="stat vi"><b>' + (st.brier === null ? '—' : st.brier.toFixed(3)) + '</b><span>Brier 分数（越低越好）</span></div>';
    h += '</div>';

    /* 解释 */
    h += '<div class="card" style="padding:12px 15px;margin-bottom:14px"><div style="font-size:12px;color:var(--text2);line-height:1.9">' +
         '📐 <b>Brier 分数怎么读</b>　= 已判定预测的 (你的概率 − 实际结果)² 平均值，结果取 1 或 0。<br>' +
         '<b>0.000</b> 完美预测 · <b>0.250</b> 等于永远押 50%（没信息量）· <b>高于 0.250</b> 说明比瞎猜还差（系统性反着压）。<br>' +
         '<span style="color:var(--text3)">它衡量的不是「你对了几次」，而是「<b>你说 70% 的那些，是不是真的对了约七成</b>」——后者才是可迁移的判断力。</span>' +
         '</div></div>';

    /* 新增 */
    h += '<div class="sec-t">记一条预测</div>';
    h += '<div class="card" style="padding:13px 15px;margin-bottom:14px">';
    h += '<div class="pd-row"><input id="pdText" class="pd-input" placeholder="你的判断（要能被验证，例如：本周沪指收在 3900 以上）"></div>';
    h += '<div class="pd-row" style="margin-top:8px;gap:8px;flex-wrap:wrap">' +
         '<label class="pd-lab">我的概率 <input id="pdProb" type="range" min="0" max="100" step="5" value="60" style="width:150px;vertical-align:middle"> <b id="pdProbV">60%</b></label>' +
         '<label class="pd-lab">验证日期 <input id="pdDate" type="date" value="' + shift(7) + '"></label>' +
         '<button class="btn primary" id="pdAdd" style="padding:6px 15px;font-size:12px">记下来</button>' +
         '</div>';
    h += '<div style="font-size:12px;color:var(--text3);margin-top:7px">写「能被证伪」的判断。反例：<i>市场可能会波动</i>（无法判定）；正例：<i>本周沪指收盘在 3900 以上</i>。</div>';
    h += '</div>';

    /* 到期 */
    var dueList = list.filter(function (e) { return !e.resolved && e.resolveAt && e.resolveAt <= today(); });
    if (dueList.length) {
      h += '<div class="sec-t" style="color:var(--rd)">已到期，现在判定（' + dueList.length + ' 条）</div>';
      dueList.forEach(function (e) { h += itemHtml(e, true); });
    }

    /* 未到期 */
    var pend = list.filter(function (e) { return !e.resolved && !(e.resolveAt && e.resolveAt <= today()); });
    if (pend.length) {
      h += '<div class="sec-t">未到期（' + pend.length + ' 条）</div>';
      pend.forEach(function (e) { h += itemHtml(e, false); });
    }

    /* 已判定 */
    var done = list.filter(function (e) { return e.resolved; });
    if (done.length) {
      h += '<div class="sec-t">已判定（' + done.length + ' 条）</div>';
      done.forEach(function (e) { h += itemHtml(e, false); });
    }

    if (!list.length) {
      h += '<div class="card" style="padding:20px;text-align:center;color:var(--text3);font-size:13px">' +
           '还没有任何预测。先记一条这周你会看到结果的判断 —— <b>没有预测，就没有可验证的判断力。</b></div>';
    }

    /* 校准表 */
    if (st.resolved) {
      h += '<div class="sec-t">校准表（说 X% 的时候，实际对了多少）</div>';
      h += '<div class="card" style="padding:12px 15px"><table class="ac-table"><tr><th>预测概率</th><th>条数</th><th>平均预测</th><th>实际命中</th><th>偏差</th></tr>';
      cal.forEach(function (b) {
        if (!b.n) return;
        var diff = b.actual - b.avgP;
        var color = Math.abs(diff) <= 0.12 ? 'var(--em)' : (Math.abs(diff) <= 0.25 ? 'var(--am)' : 'var(--rd)');
        h += '<tr><td>' + b.label + '</td><td>' + b.n + '</td><td>' + (b.avgP * 100).toFixed(0) + '%</td><td>' +
             (b.actual * 100).toFixed(0) + '%</td><td style="color:' + color + ';font-weight:800">' +
             (diff >= 0 ? '+' : '') + (diff * 100).toFixed(0) + 'pt</td></tr>';
      });
      h += '</table><div style="font-size:12px;color:var(--text3);margin-top:8px">偏差在 ±12pt 内算校准良好。' +
           '如果「80–100%」那桶实际只有 50%，说明你<b>过度自信</b>；反过来是<b>过度保守</b>。</div></div>';
    }

    host.innerHTML = h;

    /* 绑定 */
    var rng = document.getElementById('pdProb');
    if (rng) rng.oninput = function () { document.getElementById('pdProbV').textContent = rng.value + '%'; };
    var btn = document.getElementById('pdAdd');
    if (btn) btn.onclick = function () {
      var t = document.getElementById('pdText').value;
      var p = document.getElementById('pdProb').value;
      var d = document.getElementById('pdDate').value;
      var r = add(t, p, d);
      if (!r.ok) { say(r.error, false); return; }
      say('已记下。到期日 ' + d + ' 回来看结果', true);
      render();
    };
    Array.prototype.forEach.call(host.querySelectorAll('[data-res]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-id');
        var ok = b.getAttribute('data-res') === '1';
        var r = resolve(id, ok);
        if (!r.ok) { say(r.error, false); return; }
        say(ok ? '记为「对了」' : '记为「错了」——错的那些更有价值', true);
        render();
      };
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-del]'), function (b) {
      b.onclick = function () {
        if (!confirm('删除这条预测？')) return;
        remove(b.getAttribute('data-del'));
        render();
      };
    });
  }

  function itemHtml(e, due) {
    var h = '';
    var pct = Math.round(e.p * 100);
    var st = e.resolved ? (e.outcome === 1 ? '对' : '错') : (due ? '待判定' : '未到期');
    var color = e.resolved ? (e.outcome === 1 ? 'var(--em)' : 'var(--rd)') : (due ? 'var(--rd)' : 'var(--text3)');
    h += '<div class="card pd-item" style="padding:11px 14px;margin-bottom:8px;border-left:3px solid ' + color + '">';
    h += '<div class="pd-item-t">' + esc(e.text) + '</div>';
    h += '<div class="pd-item-m">概率 <b>' + pct + '%</b> · 验证日 ' + esc(e.resolveAt) +
         (e.resolved ? ' · 结果 <b style="color:' + color + '">' + st + '</b>' : ' · <span style="color:' + color + '">' + st + '</span>') +
         '</div>';
    h += '<div class="pd-item-a">';
    if (!e.resolved) {
      h += '<button class="btn primary" data-res="1" data-id="' + e.id + '" style="padding:4px 12px;font-size:12px">对了</button>';
      h += '<button class="btn ghost" data-res="0" data-id="' + e.id + '" style="padding:4px 12px;font-size:12px">错了</button>';
    }
    h += '<button class="btn ghost" data-del="' + e.id + '" style="padding:4px 10px;font-size:12px;opacity:.6">删除</button>';
    h += '</div></div>';
    return h;
  }

  function mount(host) {
    if (!host) return;
    host.innerHTML =
      '<div class="h1"><span class="grad">预测日志</span> · Brier 校准</div>' +
      '<div class="sub">把「我判断得准不准」变成可计算的数字。写了预测才会验证，验证了才知道自己错在哪。</div>' +
      '<div id="pdBody"></div>' +
      '<div id="pdToast" class="toast"></div>';
    render();
  }

  return {
    KEY: KEY,
    load: load, add: add, resolve: resolve, remove: remove,
    validate: validate, brier: brier, calibration: calibration, stats: stats,
    mount: mount, render: render,
    /* 供单测 */
    _today: today, _shift: shift
  };
})();
