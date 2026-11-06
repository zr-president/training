# -*- coding: utf-8 -*-
"""重写首页为极简版 + 侧边栏高亮与折叠

用户反馈：
· 游戏风格去掉 —— 「还是看我自己想不想学习，而不是靠游戏风格去刺激我学习」
  → 首页不再出现：等级条、成长币、账本、复查队列、连击天数
· 顶栏太长 → 已改侧边栏（上一步完成）

新首页只保留四块：
  1) 一个定位（我在做什么）+ 一行真实状态数字
  2) 三个入口卡：学习学院 / 专项训练 / 预测日志
  3) 「接着上次」：最近学的单元、最近做的题
  4) 一行诚实的求职进展（保留，因为它不是游戏，是事实）

改动：
1) app.js：renderHome 整体替换
2) app.js：导航高亮 .nav a → .side-group a；并加侧栏折叠逻辑
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
AP = os.path.join(T, 'js', 'app.js')
lines = open(AP, encoding='utf-8').read().split('\n')

# ---------- 1) 定位 renderHome 区间（L90 - L275，1-based） ----------
start = None
end = None
for i, ln in enumerate(lines):
    if 'function renderHome(host) {' in ln:
        start = i
    if start is not None and i > start and ln.strip() == '}' and lines[i - 1].strip() == '}':
        # renderHome 的收尾是两层 }（内层 try 的 } 和外层函数 }）
        end = i
        break
if start is None or end is None:
    print('❌ 定位 renderHome 失败 start=%s end=%s' % (start, end))
    raise SystemExit(1)
print('renderHome: L%d - L%d（共 %d 行）' % (start + 1, end + 1, end - start + 1))

NEW_HOME = r'''  function renderHome(host) {
    /* ===== 极简首页 =====
       刻意不再放：等级条、成长币、账本、复查队列、连击天数。
       用户原话：「还是看我自己想不想学习，而不是靠游戏风格去刺激我学习」。
       所以这里只回答三件事：我在做什么 / 从哪开始 / 上次到哪了。 */
    var st = null;
    try { st = TP.stats(SQL_QUESTIONS.length); } catch (e) {}
    var learnedN = 0, readyN = 0;
    try {
      if (typeof ACADEMY_COURSES !== 'undefined') {
        ACADEMY_COURSES.forEach(function (c) {
          c.units.forEach(function (u) {
            if (u.status === 'ready') {
              readyN++;
              if (TP.getNote('academy', u.id + '_learned') === '1') learnedN++;
            }
          });
        });
      }
    } catch (e) {}
    var predN = 0, predDue = 0;
    try {
      if (typeof Predict !== 'undefined') {
        var ps2 = Predict.stats(Predict.load());
        predN = ps2.total; predDue = ps2.due;
      }
    } catch (e) {}
    var jobWeek = 0;
    try { jobWeek = parseInt(localStorage.getItem('zh_apply_count') || '0', 10) || 0; } catch (e) {}

    var h = '';

    /* ---- 1 定位 + 状态 ---- */
    h += '<div class="home-hero2">';
    h += '<div class="home-kicker">策略分析 · 能力训练</div>';
    h += '<div class="home-title">把<em>重复劳动</em>变成可以被检查的流程</div>';
    h += '<div class="home-sub">经营分析 / 商业化运营 / 渠道质量 / 增量评估这四个方向，靠的是同一件事：' +
         '看见数字背后发生了什么，并说清凭什么。这个平台只做一件事——把「会了」变成可验证的。</div>';
    h += '<div class="home-stat">';
    h += '<div><b>' + learnedN + '/' + readyN + '</b><span>学院已学 / 可学</span></div>';
    h += '<div><b>' + (st ? st.done : 0) + '</b><span>SQL 已通过</span></div>';
    h += '<div><b>' + predN + '</b><span>记录中的预测</span></div>';
    h += '<div><b>' + jobWeek + '</b><span>本周投递</span></div>';
    h += '</div></div>';

    /* ---- 2 三个入口 ---- */
    h += '<div class="home-entries">';
    h += '<a class="home-entry" href="#/academy">' +
         '<div class="he-k">01 · 系统学</div>' +
         '<div class="he-t">学习学院</div>' +
         '<div class="he-d">11 门课 / 62 个单元，由浅入深。每单元 7 步：场景 → 核心图 → 例题 → 带提示的练习 → 变式 → 产物 → 3 天后复测。</div>' +
         '<div class="he-a">从金融 · 指数与估值开始 →</div></a>';
    h += '<a class="home-entry" href="#/sql">' +
         '<div class="he-k">02 · 动手练</div>' +
         '<div class="he-t">专项训练</div>' +
         '<div class="he-d">SQL 31 题 · 数据集实验室 · 指标设计 · 实验分析 · Case 拆解 · AI 工作流 110 题 · 语音复述。</div>' +
         '<div class="he-a">去 SQL 训练场 →</div></a>';
    h += '<a class="home-entry" href="#/predict">' +
         '<div class="he-k">03 · 检验判断</div>' +
         '<div class="he-t">预测日志</div>' +
         '<div class="he-d">写下判断和概率，到期判定对错，算出 Brier 分数与校准表。' +
         (predDue ? '<b style="color:var(--rd)">　有 ' + predDue + ' 条到期待判定</b>' : '') + '</div>' +
         '<div class="he-a">' + (predN ? '看我的校准' : '记第一条预测') + ' →</div></a>';
    h += '</div>';

    /* ---- 3 接着上次 ---- */
    var lastUnit = null, lastUnitAt = null;
    try {
      if (typeof ACADEMY_COURSES !== 'undefined') {
        ACADEMY_COURSES.forEach(function (c) {
          c.units.forEach(function (u) {
            if (u.status !== 'ready') return;
            var t = TP.getNote('academy', u.id + '_retest');
            if (t && (!lastUnitAt || t > lastUnitAt)) { lastUnitAt = t; lastUnit = { c: c, u: u }; }
          });
        });
      }
    } catch (e) {}

    h += '<div class="home-sec">';
    h += '<div class="home-sec-h"><h3>接着上次</h3><span>' + (lastUnit ? '复测排在 ' + lastUnitAt : '还没有安排复测的单元') + '</span></div>';
    if (lastUnit) {
      h += '<a class="home-row" href="#/academy">' +
           '<span class="home-row-t">' + esc(lastUnit.c.name) + ' · ' + esc(lastUnit.u.title) + '</span>' +
           '<span class="home-row-m">' + esc(lastUnit.u.depth) + ' · 复测 ' + lastUnitAt + '</span></a>';
    } else {
      h += '<a class="home-row" href="#/academy">' +
           '<span class="home-row-t">金融 · 指数与估值：为什么「上证涨了」不等于你赚钱了</span>' +
           '<span class="home-row-m">22 分钟 · 零基础</span></a>';
    }
    if (st && st.done > 0) {
      h += '<a class="home-row" href="#/sql">' +
           '<span class="home-row-t">SQL 训练场</span>' +
           '<span class="home-row-m">已完成 ' + st.done + ' / ' + st.total + ' · 一次做对率 ' + (st.firstTryRate || 0) + '%</span></a>';
    }
    h += '</div>';

    /* ---- 4 一行诚实的求职进展 ---- */
    h += '<div class="home-sec">';
    h += '<div class="home-sec-h"><h3>求职进展</h3><span>不是游戏，是事实</span></div>';
    h += '<div class="home-honest">' +
         '本周投递 <b>' + jobWeek + '</b> 家。' +
         (jobWeek ? '保持节奏，重点看反馈率而不是投递量。' : '<b>训练分数涨得再高，简历没投出去也不算进展。</b>') +
         '<br>目标岗位：经营分析 / 商业化运营 / 渠道运营 / 数据运营。投递记录在个人站 →' +
         ' <a href="https://zr-president.github.io/my-website/#applications" target="_blank" rel="noopener" style="color:var(--accent)">去记投递 ↗</a>' +
         '</div>';
    h += '</div>';

    /* ---- 5 折叠的技术说明（保留原内容，默认收起） ---- */
    h += '<details class="acc" style="margin-top:8px"><summary>关于这个平台（设计取舍与技术说明）</summary><div class="accbody">';
    h += '<div style="font-size:12.5px;color:var(--text2);line-height:1.95">' +
         '<b>为什么没有等级、金币、签到</b>　试过，但对我没用。真正决定我学不学的是「这件事我到底会不会」，' +
         '不是游戏化的即时反馈。所以首页只保留真实状态数字，不做激励包装。<br><br>' +
         '<b>为什么学院只有 2 个单元写全了</b>　一门课 8 个单元如果只写第 1 个，看到的只是皮毛。' +
         '先把 11 门课的全部 62 个单元大纲定下来，确认序列值得写，再按顺序批量做内容。<br><br>' +
         '<b>为什么强调「学完只标已学习」</b>　读完不等于掌握。掌握要看 3 天后不看原文能不能答出来 —— ' +
         '所以每个单元都排了复测。' +
         '</div>';
    h += '</div></details>';

    host.innerHTML = h;
  }'''

lines[start:end + 1] = NEW_HOME.split('\n')
out = '\n'.join(lines)

# ---------- 2) 导航高亮：.nav a → .side-group a ----------
out = out.replace(
    "document.querySelectorAll('.nav a[href^=\"#/\"]'), function (a) {",
    "document.querySelectorAll('.side-group a[href^=\"#/\"]'), function (a) {")

# ---------- 3) 侧栏折叠 ----------
FOLD = '''
/* 侧边栏折叠（状态存 localStorage，刷新后保持） */
(function () {
  function applyFold(v) {
    var side = document.getElementById('side');
    var btn = document.getElementById('sideFold');
    if (!side) return;
    side.classList.toggle('folded', !!v);
    if (btn) btn.textContent = v ? '›' : '‹';
    try { localStorage.setItem('tp_side_folded', v ? '1' : '0'); } catch (e) {}
  }
  function init() {
    var btn = document.getElementById('sideFold');
    if (!btn) return;
    var saved = null;
    try { saved = localStorage.getItem('tp_side_folded'); } catch (e) {}
    if (saved === '1') applyFold(true);
    btn.onclick = function () {
      var side = document.getElementById('side');
      applyFold(!(side && side.classList.contains('folded')));
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
'''
if 'tp_side_folded' not in out:
    out = out.rstrip() + '\n' + FOLD

open(AP, 'w', encoding='utf-8').write(out)

r = subprocess.run(['node', '--check', AP], capture_output=True, text=True, encoding='utf-8', errors='replace')
print('语法:', 'OK' if r.returncode == 0 else 'FAIL\n' + (r.stderr or '')[:600])
