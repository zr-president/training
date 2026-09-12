# -*- coding: utf-8 -*-
"""让答案更好找：①答题模块加"直接看答案" ②答案折叠区统一视觉 ③首页加答案说明"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ================= 1) progress.js：支持"看过答案不计入一次做对率" =================
FP = BASE + r'\js\progress.js'
c = open(FP, 'r', encoding='utf-8').read()
old = """    markQuiz: function (ns, id, ok, score) {
      if (!state.quiz[ns]) state.quiz[ns] = {};
      var rec = state.quiz[ns][id] || { tries: 0, ok: false, best: 0, firstTry: null, ts: null };
      rec.tries += 1;
      if (ok && rec.firstTry === null) rec.firstTry = (rec.tries === 1);"""
new = """    markQuiz: function (ns, id, ok, score, disqualifyFirstTry) {
      if (!state.quiz[ns]) state.quiz[ns] = {};
      var rec = state.quiz[ns][id] || { tries: 0, ok: false, best: 0, firstTry: null, ts: null };
      rec.tries += 1;
      if (ok && rec.firstTry === null) rec.firstTry = (rec.tries === 1 && !disqualifyFirstTry);
      if (ok && disqualifyFirstTry && rec.firstTry === null) rec.firstTry = false;"""
if old in c:
    c = c.replace(old, new, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK progress.js 已支持 disqualifyFirstTry')
else:
    print('MISS markQuiz')

# ================= 2) quiz-module.js：加"直接看答案"按钮 =================
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\quiz-module.js'
q = open(FP, 'r', encoding='utf-8').read()

# 2a) 按钮 + 提示
old_btn = """    h += '<div class="row"><button class="btn primary" id="qkSubmit">提交判分</button>' +
         '<button class="btn" id="qkReset">重选</button>' +
         '<span class="muted" id="qkInfo"></span></div>';"""
new_btn = """    h += '<div class="row" style="gap:7px"><button class="btn primary" id="qkSubmit">提交判分</button>' +
         '<button class="btn" id="qkReveal">👀 直接看答案（不判分）</button>' +
         '<button class="btn" id="qkReset">重选</button>' +
         '<span class="muted" id="qkInfo">提交后会逐项显示"为什么对 / 为什么错"</span></div>';"""
if old_btn in q:
    q = q.replace(old_btn, new_btn, 1)
    print('OK 已加"直接看答案"按钮')
else:
    print('MISS 按钮锚点')

# 2b) reveal 逻辑：把逐项反馈抽成函数，提交与"看答案"共用
old_fb = """      /* 逐项反馈 */
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
      });"""
new_fb = """      revealOptions(box, true);"""
if old_fb in q:
    q = q.replace(old_fb, new_fb, 1)
    print('OK 逐项反馈已抽成 revealOptions')
else:
    print('MISS 逐项反馈锚点')

# 2c) 插入 revealOptions 函数（放在 renderQuestion 之前）
anchor_fn = '  /* ---------- 题目 ---------- */'
helper = """  /* 展示每项的对错与解析；selected=是否显示"你选了/没选" */
  function revealOptions(box, showSel) {
    Array.prototype.forEach.call(box.querySelectorAll('.optcard'), function (el) {
      if (el.getAttribute('data-revealed') === '1') return;
      el.setAttribute('data-revealed', '1');
      var i = parseInt(el.getAttribute('data-i'), 10);
      var o = cur.options[i];
      var picked = [];
      try { picked = JSON.parse(localStorage.getItem('tp_quiz_' + cfg.ns + '_' + cur.id) || '[]'); } catch (e) {}
      var sel = picked.indexOf(i) >= 0;
      el.parentNode.setAttribute('data-locked', '1');
      el.style.cursor = 'default';
      var col = o.ok ? 'var(--green)' : 'var(--red)';
      el.style.borderColor = col;
      el.style.background = o.ok ? 'rgba(5,150,105,.07)' : 'rgba(220,38,38,.06)';
      var mk = el.querySelector('.mk');
      mk.textContent = o.ok ? '✓' : '✗';
      mk.style.borderColor = col; mk.style.color = col;
      var note = document.createElement('div');
      note.style.cssText = 'font-size:11.5px;line-height:1.75;color:' + col + ';margin-top:6px';
      note.innerHTML = (showSel ? (sel ? '【你选了】' : '【你没选】') + ' ' : '') + esc(o.note);
      el.querySelector('span:last-of-type').appendChild(note);
    });
  }

  /* ---------- 题目 ---------- */"""
if anchor_fn in q and 'function revealOptions' not in q:
    q = q.replace(anchor_fn, helper, 1)
    print('OK 已插入 revealOptions')

# 2d) 绑定"直接看答案"
old_bind = """    document.getElementById('qkReset').onclick = function () {"""
new_bind = """    document.getElementById('qkReveal').onclick = function () {
      revealOptions(box, false);
      var rb = document.getElementById('refBox');
      if (rb) rb.setAttribute('data-shown', '0');
      showRef();
      var v = document.getElementById('qkVerdict');
      if (v) v.innerHTML = '<div class="verdict err">👀 已显示参考答案与逐项解析。' +
        '<br><span class="muted">本题结果将<b>不计入"一次做对率"</b>（因为已经看过答案）。想检验真实水平的话，下次换个时间重做一遍。</span></div>';
      cur.__revealed = true;
    };
    document.getElementById('qkReset').onclick = function () {"""
if old_bind in q:
    q = q.replace(old_bind, new_bind, 1)
    print('OK 已绑定"直接看答案"')

# 2e) 提交时若已看答案则不计入一次做对率
old_mark = "      var rec2 = TP.markQuiz(cfg.ns, cur.id, ok, score);"
new_mark = "      var rec2 = TP.markQuiz(cfg.ns, cur.id, ok, score, !!cur.__revealed);"
if old_mark in q:
    q = q.replace(old_mark, new_mark, 1)
    print('OK 提交时传递 disqualify 标记')
else:
    print('MISS markQuiz 调用')

open(FP, 'w', encoding='utf-8').write(q)
print('done quiz-module')
