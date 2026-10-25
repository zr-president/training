/* 语音复述训练 · 模块
   核心能力：
   1) 浏览器原生语音识别（无需 API Key）
   2) 字符错误率（CER）=（替换 + 漏字 + 多字）÷ 原文字数
   3) 高亮标出漏掉/说错的字
   4) 无麦克风时可用「粘贴转写文本」走完全一致的评分算法

   CER 算法是纯函数（不依赖 DOM 与浏览器 API），因此可被 tools/test_speech.js 单测。 */
var SpeechModule = (function () {
  var NS = 'speech';
  var cur = null;
  var recognition = null;
  var listening = false;
  var transcript = '';

  /* ---------------- 纯函数：文本归一化（带位置映射） ---------------- */
  /* 去掉空白与标点、转小写；同时记录每个归一化字符在原串中的下标，
     以便评分后能在原文上高亮出错的字。 */
  var PUNCT_RE = /[\s，。！？、；：""''（）《》【】…—·,.!?;:'"()\[\]{}<>~`\-_+=|\\\/@#$%^&*]/;

  function normalizeWithMap(s) {
    s = String(s == null ? '' : s);
    var norm = '', map = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (/\s/.test(ch)) continue;
      if (PUNCT_RE.test(ch)) continue;
      norm += ch.toLowerCase();
      map.push(i);
    }
    return { norm: norm, map: map };
  }
  function normalizeText(s) { return normalizeWithMap(s).norm; }

  /* ---------------- 纯函数：CER（Levenshtein + 回溯计数） ---------------- */
  function cer(ref, hyp) {
    var R = normalizeText(ref), H = normalizeText(hyp);
    var m = R.length, n = H.length;

    var dp = [], i, j;
    for (i = 0; i <= m; i++) { dp.push([]); for (j = 0; j <= n; j++) dp[i].push(0); }
    for (i = 0; i <= m; i++) dp[i][0] = i;
    for (j = 0; j <= n; j++) dp[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = (R.charAt(i - 1) === H.charAt(j - 1)) ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }

    var sub = 0, del = 0, ins = 0;
    i = m; j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && R.charAt(i - 1) === H.charAt(j - 1) && dp[i][j] === dp[i - 1][j - 1]) {
        i--; j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        sub++; i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        del++; i--;
      } else {
        ins++; j--;
      }
    }

    var total = sub + del + ins;
    return {
      refLen: m, hypLen: n,
      sub: sub, del: del, ins: ins, total: total,
      cer: m ? total / m : 0,
      accuracy: m ? Math.max(0, 1 - total / m) : 0
    };
  }

  /* ---------------- 纯函数：逐字匹配标记（用于高亮） ---------------- */
  function markMatch(ref, hyp) {
    var rm = normalizeWithMap(ref), hm = normalizeText(hyp);
    var R = rm.norm, H = hm;
    var m = R.length, n = H.length;

    var dp = [], i, j;
    for (i = 0; i <= m; i++) { dp.push([]); for (j = 0; j <= n; j++) dp[i].push(0); }
    for (i = 0; i <= m; i++) dp[i][0] = i;
    for (j = 0; j <= n; j++) dp[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = (R.charAt(i - 1) === H.charAt(j - 1)) ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }

    var ok = [];
    for (i = 0; i < m; i++) ok.push(false);
    i = m; j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && R.charAt(i - 1) === H.charAt(j - 1) && dp[i][j] === dp[i - 1][j - 1]) {
        ok[i - 1] = true; i--; j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        ok[i - 1] = false; i--; j--;                 /* 替换：算错 */
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        ok[i - 1] = false; i--;                      /* 删除：漏字 */
      } else {
        j--;                                         /* 插入：多字 */
      }
    }
    /* 归一到原文下标 */
    var orig = {};
    for (i = 0; i < m; i++) orig[rm.map[i]] = ok[i];
    return { okMap: orig, normLen: m };
  }

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(m) {
    var t = document.getElementById('spToast');
    if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(toast._tm); toast._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  /* ---------------- 渲染：材料列表 ---------------- */
  function renderList() {
    var box = document.getElementById('spList');
    if (!box) return;
    var h = '';
    SPEECH_MATERIALS.forEach(function (m, i) {
      var done = TP.isOpenDone(NS, m.id);
      h += '<div class="qitem' + (cur && cur.id === m.id ? ' on' : '') + '" data-sid="' + m.id + '">' +
           '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
           '<span class="t" title="' + esc(m.title) + '">' + esc(m.title) + '</span>' +
           '<span class="d' + (done ? ' ok' : '') + '"></span></div>';
    });
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('.qitem'), function (el) {
      el.onclick = function () { select(el.getAttribute('data-sid')); };
    });
  }

  function select(id) {
    for (var i = 0; i < SPEECH_MATERIALS.length; i++) {
      if (SPEECH_MATERIALS[i].id === id) { cur = SPEECH_MATERIALS[i]; break; }
    }
    stopListen(true);
    transcript = '';
    renderList(); renderQuestion();
  }

  /* ---------------- 渲染：材料详情 ---------------- */
  function renderQuestion() {
    var box = document.getElementById('spMain');
    if (!box || !cur) return;
    var done = TP.isOpenDone(NS, cur.id);
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    var h = '';
    h += '<div class="qtitle"><span class="badge hot">' + esc(cur.tag) + '</span><span>' + esc(cur.title) + '</span>';
    if (done) h += '<span class="badge on">已达标</span>';
    h += '</div>';

    /* 目标 */
    h += '<div class="card" style="margin:10px 0;padding:11px 14px">' +
         '<div style="font-size:12px;color:var(--text2);line-height:1.85">' +
         '<b style="color:var(--em)">合格线</b>　字符错误率 CER ≤ <b>' + pct(cur.target) + '</b>' +
         '<span style="color:var(--text3)">（CER = 替换 + 漏字 + 多字 ÷ 原文字数；标点与空格不计）</span>' +
         '</div></div>';

    /* 朗读要点 */
    h += '<details class="acc" open><summary>🎯 朗读要点（先看这个，比读十遍有用）</summary><div class="accbody">' +
         '<div style="font-size:12px;line-height:1.95;color:var(--text2)">' +
         cur.tips.map(function (t) { return '· ' + esc(t); }).join('<br>') + '</div></div></details>';

    /* 原文 */
    h += '<div class="sec-t">朗读材料（' + cur.text.replace(/\s/g, '').length + ' 字）</div>';
    h += '<div class="card" style="padding:14px 16px;line-height:2.1;font-size:15px;color:var(--text)" id="spRefText">' + esc(cur.text) + '</div>';
    h += '<div style="font-size:12px;color:var(--text3);margin:7px 0 0;line-height:1.7">' + esc(cur.note) + '</div>';

    /* 输入方式 */
    h += '<div class="sec-t">开始练习</div>';

    if (SR) {
      h += '<div class="row" style="gap:8px;margin-bottom:10px">' +
           '<button class="btn primary" id="spStart">🎙️ 开始朗读（允许麦克风）</button>' +
           '<button class="btn" id="spStop" style="display:none">⏹ 停止并评分</button>' +
           '<button class="btn ghost" id="spReset">↺ 重来</button>' +
           '</div>';
    } else {
      h += '<div class="card" style="margin-bottom:10px;padding:11px 14px;border-left:3px solid var(--am)">' +
           '<div style="font-size:12px;color:var(--text2);line-height:1.8">' +
           '<b style="color:var(--am)">当前浏览器不支持语音识别</b><br>' +
           '可以直接粘贴一段转写文本进行评分 —— 算法与实时识别完全一致，只是少了自动转写。' +
           '</div></div>';
    }

    /* 实时转写显示 */
    if (SR) {
      h += '<div class="card" style="margin-bottom:10px;padding:11px 14px">' +
           '<div style="font-size:12px;color:var(--text3);margin-bottom:5px" id="spLiveLabel">识别结果（实时）</div>' +
           '<div id="spLive" style="font-size:13px;line-height:1.9;color:var(--text2);min-height:22px">—</div>' +
           '</div>';
    }

    /* 手动粘贴 */
    h += '<details class="acc"' + (SR ? '' : ' open') + '><summary>✍️ 或：粘贴转写文本进行评分</summary><div class="accbody">' +
         '<textarea id="spPaste" style="width:100%;min-height:88px;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--sans);color:var(--text);background:var(--bg2);resize:vertical" placeholder="把你朗读后转写出来的文字粘贴到这里…"></textarea>' +
         '<div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="spScore">评分</button></div>' +
         '</div></details>';

    /* 结果区 */
    h += '<div id="spResult"></div>';

    box.innerHTML = h;

    /* ---- 绑定 ---- */
    if (SR) {
      var startBtn = document.getElementById('spStart');
      var stopBtn = document.getElementById('spStop');
      if (startBtn) startBtn.onclick = startListen;
      if (stopBtn) stopBtn.onclick = function () { stopListen(false); };
      var resetBtn = document.getElementById('spReset');
      if (resetBtn) resetBtn.onclick = function () { transcript = ''; stopListen(true); renderQuestion(); };
    }
    var scoreBtn = document.getElementById('spScore');
    if (scoreBtn) scoreBtn.onclick = function () {
      var ta = document.getElementById('spPaste');
      var txt = ta ? ta.value : '';
      if (!String(txt).replace(/\s/g, '')) { toast('先粘贴一段转写文本'); return; }
      showResult(txt);
    };
  }

  /* ---------------- 语音识别 ---------------- */
  function startListen() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('当前浏览器不支持语音识别'); return; }
    try {
      recognition = new SR();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = function () {
        listening = true;
        var b = document.getElementById('spStart');
        var s = document.getElementById('spStop');
        if (b) b.style.display = 'none';
        if (s) s.style.display = '';
        var lb = document.getElementById('spLiveLabel');
        if (lb) lb.textContent = '🔴 正在识别…（说完点「停止并评分」）';
      };
      recognition.onresult = function (e) {
        var finalTxt = '', interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var r = e.results[i];
          if (r.isFinal) finalTxt += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (finalTxt) transcript += finalTxt;
        var live = document.getElementById('spLive');
        if (live) live.textContent = (transcript + interim) || '—';
      };
      recognition.onerror = function (e) {
        var msg = e && e.error ? e.error : 'unknown';
        if (msg === 'not-allowed' || msg === 'service-not-allowed') {
          toast('麦克风被拒绝：请在浏览器地址栏允许麦克风，或改用下方粘贴评分');
        } else if (msg === 'no-speech') {
          toast('没听到声音，再试一次');
        } else {
          toast('识别出错：' + msg + '（可改用粘贴评分）');
        }
        stopListen(true);
      };
      recognition.onend = function () {
        if (listening) { var s = document.getElementById('spStop'); if (s) s.style.display = ''; }
      };
      recognition.start();
    } catch (e) {
      toast('启动失败：' + (e.message || e));
    }
  }

  function stopListen(silent) {
    try { if (recognition) recognition.stop(); } catch (e) {}
    var was = listening;
    listening = false;
    recognition = null;
    var b = document.getElementById('spStart');
    var s = document.getElementById('spStop');
    if (b) b.style.display = '';
    if (s) s.style.display = 'none';
    var lb = document.getElementById('spLiveLabel');
    if (lb) lb.textContent = '识别结果';
    if (!silent && was) {
      if (String(transcript).replace(/\s/g, '')) showResult(transcript);
      else toast('没有识别到内容，再试一次或改用粘贴评分');
    }
  }

  /* ---------------- 评分与结果 ---------------- */
  function showResult(hyp) {
    var box = document.getElementById('spResult');
    if (!box || !cur) return;
    var r = cer(cur.text, hyp);
    var mk = markMatch(cur.text, hyp);
    var pass = r.cer <= cur.target;

    var h = '';
    h += '<div class="sec-t">评分结果</div>';

    /* 主指标 */
    h += '<div class="stats" style="margin-bottom:12px">' +
         '<div class="stat ' + (pass ? 'em' : 'am') + '"><b>' + pct(r.cer) + '</b><span>字符错误率 CER（合格 ≤ ' + pct(cur.target) + '）</span></div>' +
         '<div class="stat cy"><b>' + pct(r.accuracy) + '</b><span>准确率</span></div>' +
         '<div class="stat vi"><b>' + r.del + '</b><span>漏字</span></div>' +
         '<div class="stat am"><b>' + r.sub + '</b><span>替换（说错）</span></div>' +
         '<div class="stat vi"><b>' + r.ins + '</b><span>多字</span></div>' +
         '</div>';

    h += '<div class="card" style="margin-bottom:12px;padding:11px 14px;border-left:3px solid ' +
         (pass ? 'var(--em)' : 'var(--am)') + '">' +
         '<div style="font-size:13px;color:var(--text2);line-height:1.8">' +
         (pass
           ? '✅ <b style="color:var(--em)">达到合格线</b>　原文 ' + r.refLen + ' 字，识别 ' + r.hypLen + ' 字，共 ' + r.total + ' 处错误。'
           : '⚠️ <b style="color:var(--am)">未达合格线</b>　原文 ' + r.refLen + ' 字，识别 ' + r.hypLen + ' 字，共 ' + r.total + ' 处错误。' +
             (r.del > r.sub ? '<br>漏字（' + r.del + '）多于替换（' + r.sub + '）→ 多半是语速太快或吞字，试着放慢并在一句后停顿。'
                            : r.sub > 0 ? '<br>替换（' + r.sub + '）较多 → 多半是术语或数字没说清，把这几处单独念三遍。' : '')) +
         '</div></div>';

    /* 高亮对照 */
    h += '<div class="sec-t">对照（红色 = 漏掉或说错的字）</div>';
    var orig = cur.text, marked = '';
    for (var i = 0; i < orig.length; i++) {
      var ch = orig.charAt(i);
      if (mk.okMap[i] === false) {
        marked += '<span style="background:rgba(220,38,38,.16);color:var(--rd);border-radius:3px;padding:0 1px">' + esc(ch) + '</span>';
      } else {
        marked += esc(ch);
      }
    }
    h += '<div class="card" style="padding:14px 16px;line-height:2.1;font-size:15px">' + marked + '</div>';

    /* 识别原文 */
    h += '<details class="acc" style="margin-top:10px"><summary>看识别出来的文字</summary><div class="accbody">' +
         '<div style="font-size:13px;line-height:1.9;color:var(--text2)">' + esc(hyp) + '</div></div></details>';

    /* 达标标记 */
    if (pass) {
      h += '<div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" id="spPass">' +
           (TP.isOpenDone(NS, cur.id) ? '✅ 已达标（点击取消）' : '✅ 标记为已达标') + '</button></div>';
    } else {
      h += '<div class="row" style="gap:8px;margin-top:12px"><button class="btn" id="spRetry">↺ 再练一次</button></div>';
    }

    box.innerHTML = h;

    var passBtn = document.getElementById('spPass');
    if (passBtn) passBtn.onclick = function () {
      var now = !TP.isOpenDone(NS, cur.id);
      TP.markOpen(NS, cur.id, now);
      toast(now ? '已标记达标 ✅' : '已取消达标标记');
      renderList(); renderQuestion(); refreshStats();
      showResult(hyp);
    };
    var retryBtn = document.getElementById('spRetry');
    if (retryBtn) retryBtn.onclick = function () {
      transcript = '';
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  /* ---------------- 统计 ---------------- */
  function refreshStats() {
    var total = SPEECH_MATERIALS.length, done = 0;
    SPEECH_MATERIALS.forEach(function (m) { if (TP.isOpenDone(NS, m.id)) done++; });
    var el = document.getElementById('spStats');
    if (!el) return;
    el.innerHTML =
      '<div class="stat cy"><b>' + done + '<span style="font-size:12px;color:var(--txt3)">/' + total + '</span></b><span>已达标材料</span></div>' +
      '<div class="stat em"><b>' + Math.round(done / total * 100) + '%</b><span>完成度</span></div>' +
      '<div class="stat vi"><b>CER</b><span>评分指标（越小越好）</span></div>' +
      '<div class="stat am"><b>' + (window.SpeechRecognition || window.webkitSpeechRecognition ? '支持' : '不支持') + '</b><span>本浏览器语音识别</span></div>';
  }

  function mount(host) {
    var firstUndone = null;
    for (var i = 0; i < SPEECH_MATERIALS.length; i++) {
      if (!TP.isOpenDone(NS, SPEECH_MATERIALS[i].id)) { firstUndone = SPEECH_MATERIALS[i]; break; }
    }
    cur = firstUndone || SPEECH_MATERIALS[0];

    host.innerHTML =
      '<div class="h1"><span class="grad">语音复述训练</span> · 表达</div>' +
      '<div class="sub">朗读给定材料 → 浏览器转写 → 计算字符错误率并标出漏字/说错的字 · 面试里「讲清楚」是硬门槛，而它唯一可量化的指标就是「转写回来跟原文差多少」</div>' +
      '<div class="stats" id="spStats" style="margin-bottom:14px"></div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px"><div style="font-size:12px;color:var(--text2);line-height:1.9">' +
      '💡 <b>为什么用 CER 而不是「感觉讲得好」</b>　转写是客观的：漏了字、说了错字、语速太快导致吞字，它都会反映成错误率。' +
      '而且它顺便测出了你的「数字与术语准确度」—— 面试官最容易追问的正是这两类。' +
      '<br><span style="color:var(--text3)">' + esc(SPEECH_SUPPORT_NOTE) + '</span>' +
      '</div></div>' +
      '<div class="lab">' +
      '<div><div class="sec-t" style="margin-top:0">材料列表</div><div class="qlist" id="spList"></div></div>' +
      '<div><div class="pane" id="spMain"></div></div>' +
      '</div>' +
      '<div id="spToast" class="toast"></div>';

    renderList(); renderQuestion(); refreshStats();
  }

  function onShow() { refreshStats(); }

  return {
    mount: mount, onShow: onShow,
    /* 供单测使用（纯函数，不依赖 DOM） */
    _normalize: normalizeText,
    _cer: cer,
    _markMatch: markMatch
  };
})();
