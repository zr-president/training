/* Case 拆解训练 · 交互模块（开放题：现象 → 假设 → 验证 → 方案） */
var CaseModule = (function () {
  var cur = null;
  var NS = 'case';

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

  var FIELDS = [
    { k:'hypo', label:'① 我的原因假设（至少 3 个，按可能性排序）', ph:'1) …（为什么可能是这个原因）\n2) …\n3) …\n\n提示：好的假设是"可验证"的——能说清用什么数据能证伪它。' },
    { k:'verify', label:'② 每个假设我打算用什么数据验证', ph:'假设1 → 查 xx 表，按 xx 维度拆分，看 xx 指标是否变化\n假设2 → …\n\n提示：写清"看什么指标、按什么维度拆、什么结果算成立"。' },
    { k:'plan', label:'③ 我的结论与行动方案（含如何验证方案有效）', ph:'最可能的根因是…，因为…\n因此我建议做：1) … 2) … 3) …\n怎么验证方案有效：上线后看 xx 指标，预期变化是…' }
  ];

  function renderList() {
    var box = document.getElementById('caseList');
    if (!box) return;
    var h = '';
    CASE_QUESTIONS.forEach(function (q, i) {
      var done = TP.isOpenDone(NS, q.id);
      h += '<div class="qitem' + (cur && cur.id === q.id ? ' on' : '') + '" data-cid="' + q.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(q.title) + '">' + esc(q.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-cid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < CASE_QUESTIONS.length; i++) if (CASE_QUESTIONS[i].id === id) { cur = CASE_QUESTIONS[i]; break; }
    renderList(); renderQuestion();
  }

  function renderQuestion() {
    var box = document.getElementById('caseMain');
    if (!box || !cur) return;
    var done = TP.isOpenDone(NS, cur.id);

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span><span>' + esc(cur.icon) + ' ' + esc(cur.title) + '</span>';
    if (done) h += '<span class="badge on">已完成</span>';
    h += '</div>';

    h += '<div class="qctx" style="border-left-color:var(--rd);background:rgba(220,38,38,.06);white-space:normal">' + nl(cur.symptom) + '</div>';
    h += '<div class="card" style="margin:10px 0;padding:12px 14px"><div style="font-size:12px;color:var(--txt2);line-height:1.85"><b style="color:var(--em)">交付物</b>　' + esc(cur.deliverable) + '</div></div>';

    /* 拆解框架 */
    h += '<details class="acc" open><summary>🧭 拆解框架（照这个顺序做，别跳步）</summary><div class="accbody"><div style="line-height:2.1">' +
      '<b style="color:var(--cy)">1. 定义问题</b>　把模糊现象转成可量化的具体问题（哪个指标、变化多少、从什么时候开始）<br>' +
      '<b style="color:var(--cy)">2. 列假设</b>　列出所有可能原因，并按可能性排序（这一步最容易被跳过）<br>' +
      '<b style="color:var(--cy)">3. 设计验证</b>　每个假设对应"看什么数据、什么结果算成立/证伪"<br>' +
      '<b style="color:var(--cy)">4. 定位根因</b>　用数据逐条排除，锁定最可能的原因<br>' +
      '<b style="color:var(--cy)">5. 给方案</b>　针对根因（而不是现象）给 2-3 条可执行动作<br>' +
      '<b style="color:var(--cy)">6. 验证方案</b>　说清上线后看什么指标、预期变化、多久复盘' +
      '</div></div></details>';

    /* 我的拆解 */
    h += '<div class="sec-t">我的拆解（写下来才算练过）</div>';
    FIELDS.forEach(function (f) {
      h += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:5px">' + esc(f.label) + '</div>' +
           '<div class="editor" style="margin:0"><textarea id="case_' + f.k + '" style="min-height:96px;color:var(--txt)" placeholder="' + esc(f.ph) + '">' +
           esc(TP.getNote(NS, cur.id + '_' + f.k)) + '</textarea></div></div>';
    });
    h += '<div class="row"><button class="btn primary" id="caseSave">💾 保存我的拆解</button>' +
         '<button class="btn' + (done ? '' : ' primary') + '" id="caseDone" style="' + (done ? '' : 'background:linear-gradient(135deg,var(--em),var(--green))') + '">' +
         (done ? '✅ 已完成（点击取消）' : '✅ 标记为已完成') + '</button></div>';

    /* 参考拆解 */
    h += '<details class="acc answer" style="margin-top:14px"><summary>📖 参考答案 · 参考拆解（' + cur.hypotheses.length + ' 个假设 + 结论 + 方案）</summary><div class="accbody">';
    h += '<div style="font-size:11.5px;color:var(--txt3);margin-bottom:8px">先自己写完再看——直接看参考，等于没练。</div>';
    cur.hypotheses.forEach(function (hp, i) {
      h += '<div style="margin:9px 0;padding:10px 12px;background:var(--bg2);border-radius:9px;border-left:3px solid var(--vi)">';
      h += '<div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:5px">假设 ' + (i + 1) + '：' + esc(hp.h) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--cy);line-height:1.75">🔍 <b>怎么验证</b>　' + esc(hp.how) + '</div>';
      h += '<div style="font-size:11.5px;color:var(--em);line-height:1.75;margin-top:5px">📌 ' + esc(hp.verdict) + '</div>';
      h += '</div>';
    });
    h += '<div style="margin-top:12px;padding:11px 13px;background:var(--accent-light);border-left:3px solid var(--cy);border-radius:9px;font-size:12.5px;line-height:1.85;color:var(--txt)">🎯 <b>参考结论</b><br>' + esc(cur.conclusion) + '</div>';
    if (cur.actions) {
      h += '<div style="margin-top:12px"><b style="color:var(--em);font-size:12px">✅ 参考动作</b><div style="font-size:12px;line-height:1.9;color:var(--txt2);margin-top:5px">';
      cur.actions.forEach(function (a) { h += '· ' + esc(a) + '<br>'; });
      h += '</div></div>';
    }
    if (cur.pitfalls) {
      h += '<div style="margin-top:12px"><b style="color:var(--rd);font-size:12px">⚠️ 常见错误</b><div style="font-size:12px;line-height:1.9;color:var(--txt2);margin-top:5px">';
      cur.pitfalls.forEach(function (p) { h += '· ' + esc(p) + '<br>'; });
      h += '</div></div>';
    }
    h += '</div></details>';

    if (cur.takeaway) {
      h += '<div style="margin-top:10px;background:rgba(217,119,6,.07);border-left:3px solid var(--am);border-radius:9px;padding:11px 13px;font-size:12.5px;line-height:1.8;color:var(--txt)">💡 <b>方法论</b>　' + esc(cur.takeaway) + '</div>';
    }

    box.innerHTML = h;

    /* 自动保存草稿 */
    FIELDS.forEach(function (f) {
      var ta = document.getElementById('case_' + f.k);
      if (ta) ta.addEventListener('input', function () { TP.setNote(NS, cur.id + '_' + f.k, ta.value); });
    });

    document.getElementById('caseSave').onclick = function () {
      FIELDS.forEach(function (f) {
        var ta = document.getElementById('case_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      toast('已保存（缓存在你的浏览器）');
    };
    document.getElementById('caseDone').onclick = function () {
      FIELDS.forEach(function (f) {
        var ta = document.getElementById('case_' + f.k);
        if (ta) TP.setNote(NS, cur.id + '_' + f.k, ta.value);
      });
      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      toast(now ? '已标记完成 ✅' : '已取消完成标记');
      renderList(); renderQuestion(); refreshStats();
    };
  }

  function refreshStats() {
    var total = CASE_QUESTIONS.length, done = 0;
    CASE_QUESTIONS.forEach(function (q) { if (TP.isOpenDone(NS, q.id)) done++; });
    var el = document.getElementById('caseStats');
    if (!el) return;
    el.innerHTML =
      '<div class="stat cy"><b>' + done + '<span style="font-size:12px;color:var(--txt3)">/' + total + '</span></b><span>已完成拆解</span></div>' +
      '<div class="stat em"><b>' + Math.round(done / total * 100) + '%</b><span>完成度</span></div>' +
      '<div class="stat vi"><b>' + total + '</b><span>案例总数</span></div>' +
      '<div class="stat am"><b>6</b><span>拆解步骤（别跳步）</span></div>';
  }

  function mount(host) {
    var firstUndone = null;
    for (var i = 0; i < CASE_QUESTIONS.length; i++) { if (!TP.isOpenDone(NS, CASE_QUESTIONS[i].id)) { firstUndone = CASE_QUESTIONS[i]; break; } }
    cur = firstUndone || CASE_QUESTIONS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">Case 拆解训练</span> · 用户增长</div>' +
      '<div class="sub">给一个运营现象 → 自己拆解原因并给方案 · 没有唯一答案，重点在"列假设 + 设计验证"</div>' +
      '<div class="ans-tip">✅ <b>答案怎么看</b>　每道题下方都有<b>绿色「参考答案 ·」折叠区</b>，点开即可查看参考解 / 参考结论 / 逐点讲解；先自己想一遍再看效果最好。</div>' +
      '<div class="stats" id="caseStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--txt2);line-height:1.85">💡 ' + esc(CASE_META.intro) + '</div></div>' +
      '<div class="lab">' +
        '<div><div class="sec-t" style="margin-top:0">案例列表</div><div class="qlist" id="caseList"></div></div>' +
        '<div><div class="pane" id="caseMain"></div></div>' +
      '</div>';

    renderList(); renderQuestion(); refreshStats();
  }

  function onShow() { refreshStats(); }

  return { mount: mount, onShow: onShow };
})();
