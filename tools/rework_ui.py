# -*- coding: utf-8 -*-
"""界面重构：顶栏 16 项 → 左侧边栏；去掉首页游戏化

依据（联网查到的 2025-2026 仪表盘设计研究）：
· 横向 tab 撑不住 9+ 个板块 → 应该用侧边栏（可折叠到 48px 图标态）
· 高端感来自「克制的色彩 + 层次化的暗色 + 无边框抬升」，而不是发光/装饰
· 侧边栏 240px 展开 / 48px 折叠；头部 48-56px；卡片 padding 16-20px；圆角 8-12px
· Active 项：accent 12% 背景 + 左侧 2px 边框

改动：
1) index.html：<header class="topbar"> ... </header> 换成 <aside class="side">
   <main class="wrap"> 外包一层 <div class="content">
2) css/style.css：新增 .app / .side / .content 布局与响应式；首页新样式
3) js/app.js：renderHome 重写为极简版（去掉指挥台/等级/成长币/账本）
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
ok = []

# ============================================================
# 1) index.html：header → aside
# ============================================================
HP = os.path.join(T, 'index.html')
h = open(HP, encoding='utf-8').read()

m = re.search(r'<header class="topbar">[\s\S]*?</header>', h)
if not m:
    print('❌ 找不到 <header class="topbar">')
    raise SystemExit(1)

SIDE = '''<aside class="side" id="side">
  <div class="side-brand">
    <span class="side-logo">🎓</span>
    <span class="side-brand-t">能力训练平台<small>STRATEGY OPS</small></span>
    <button class="side-fold" id="sideFold" title="收起/展开侧栏">‹</button>
  </div>

  <div class="side-scroll">
    <div class="side-group">
      <div class="side-lb">开始</div>
      <a href="#/home">首页</a>
      <a href="#/academy">学习学院</a>
      <a href="#/predict">预测日志</a>
    </div>

    <div class="side-group">
      <div class="side-lb">专项训练</div>
      <a href="#/sql">SQL 训练场</a>
      <a href="#/lab">数据集实验室</a>
      <a href="#/metrics">指标设计</a>
      <a href="#/abtest">实验分析</a>
      <a href="#/case">Case 拆解</a>
      <a href="#/workflow">AI 工作流</a>
      <a href="#/speech">语音复述</a>
    </div>

    <div class="side-group">
      <div class="side-lb">AI 专题</div>
      <a href="#/agent">AI Agent 实操</a>
      <a href="#/aipm">AI 产品经理</a>
    </div>

    <div class="side-group">
      <div class="side-lb">参考</div>
      <a href="#/data">数据集</a>
      <a href="#/python">Python 案例</a>
      <a href="#/plan">30 天计划</a>
      <a href="#/radar">能力雷达</a>
    </div>
  </div>

  <div class="side-foot">
    <div class="theme-dots" id="themeDots"></div>
    <button class="icon-btn" id="themeToggle" onclick="toggleTheme()" title="切换夜间模式">🌙</button>
  </div>
</aside>'''

h = h[:m.start()] + SIDE + h[m.end():]

# main 外包 content
if '<div class="content">' not in h:
    h = h.replace('<main class="wrap">', '<div class="content">\n<main class="wrap">', 1)
    # 找到 </main> 后补 </div>
    idx = h.find('</main>')
    if idx > 0:
        h = h[:idx + len('</main>')] + '\n</div>' + h[idx + len('</main>'):]
        ok.append('main 外包 content')
    else:
        print('⚠️ 找不到 </main>')

open(HP, 'w', encoding='utf-8').write(h)
ok.append('header → aside 侧边栏')

# 用 .app-shell 包住 aside + content
h = open(HP, encoding='utf-8').read()
if 'class="app-shell"' not in h:
    a = h.find('<aside class="side"')
    if a > 0:
        h = h[:a] + '<div class="app-shell">\n' + h[a:]
        # content 的收尾 </div> 之后补 app-shell 的 </div>
        marker = '</main>'
        i = h.find(marker)
        if i > 0:
            j = h.find('</div>', i)          # 这是 .content 的闭合
            if j > 0:
                h = h[:j + len('</div>')] + '\n</div>' + h[j + len('</div>'):]
                ok.append('app-shell 包装')
            else:
                print('⚠️ 找不到 content 的闭合')
        else:
            print('⚠️ 找不到 </main>')
    else:
        print('⚠️ 找不到 aside')
    open(HP, 'w', encoding='utf-8').write(h)
else:
    print('ℹ️  app-shell 已存在')

# ============================================================
# 2) CSS
# ============================================================
CP = os.path.join(T, 'css', 'style.css')
css = open(CP, encoding='utf-8').read()

SIDE_CSS = '''
/* ============================================================
   侧边栏布局（替代顶栏 16 项横排）
   依据：横向 tab 撑不住 9+ 板块；侧边栏可折叠、可分组、可扩展
   ============================================================ */
:root{ --side-w:236px; --side-w-min:56px; }
.app-shell{display:flex;min-height:100vh}
.side{
  width:var(--side-w);flex:0 0 var(--side-w);position:sticky;top:0;height:100vh;
  display:flex;flex-direction:column;background:var(--card);
  border-right:1px solid var(--border);transition:flex-basis .22s cubic-bezier(.4,0,.2,1),width .22s cubic-bezier(.4,0,.2,1);
  z-index:50;
}
.side-brand{display:flex;align-items:center;gap:9px;padding:14px 14px 12px;border-bottom:1px solid var(--border)}
.side-logo{font-size:19px;line-height:1;flex-shrink:0}
.side-brand-t{font-size:13px;font-weight:800;color:var(--text);letter-spacing:.2px;line-height:1.3;min-width:0}
.side-brand-t small{display:block;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1.2px;margin-top:1px}
.side-fold{margin-left:auto;width:20px;height:20px;border-radius:5px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);cursor:pointer;font-size:12px;line-height:1;flex-shrink:0;transition:.15s}
.side-fold:hover{background:var(--mcl,var(--accent-light));color:var(--accent);border-color:var(--accent)}
.side-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 8px 4px}
.side-scroll::-webkit-scrollbar{width:5px}
.side-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.side-group{margin-bottom:14px}
.side-lb{font-size:10px;font-weight:800;letter-spacing:1.1px;color:var(--text3);text-transform:uppercase;padding:0 8px 5px}
.side-group a{
  display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;
  font-size:12.5px;font-weight:600;color:var(--text2);text-decoration:none;
  border-left:2px solid transparent;margin-bottom:1px;transition:.13s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.side-group a:hover{background:var(--bg2);color:var(--text)}
.side-group a.on{background:var(--mcl,var(--accent-light));color:var(--mc,var(--accent));border-left-color:var(--mc,var(--accent));font-weight:800}
.side-foot{display:flex;align-items:center;gap:6px;padding:10px 12px;border-top:1px solid var(--border);flex-wrap:wrap}
.side-foot .theme-dots{display:flex;gap:4px;margin-right:auto}

/* 折叠态：只留图标位置（这里用隐藏文字实现，无需额外图标资源） */
.side.folded{flex-basis:var(--side-w-min);width:var(--side-w-min)}
.side.folded .side-brand-t,
.side.folded .side-lb,
.side.folded .side-group a{display:none}
.side.folded .side-scroll{padding:8px 6px}
.side.folded .side-brand{justify-content:center;padding:14px 6px 12px}
.side.folded .side-fold{margin-left:0;position:absolute;right:-10px;top:18px;background:var(--card)}
.side.folded .side-group::after{content:'';display:block;height:1px;background:var(--border);margin:6px 4px}
.side.folded .side-foot{justify-content:center;padding:8px 4px}
.side.folded .side-foot .theme-dots{display:none}

.content{flex:1;min-width:0;display:flex;flex-direction:column}
.content .wrap{max-width:1080px;margin:0 auto;padding:30px 32px 80px;width:100%}

@media(max-width:900px){
  .app-shell{flex-direction:column}
  .side{position:static;width:auto;flex-basis:auto;height:auto;border-right:none;border-bottom:1px solid var(--border)}
  .side-scroll{display:flex;gap:14px;overflow-x:auto;padding:8px 10px}
  .side-group{margin-bottom:0;flex-shrink:0}
  .side-group a{font-size:12px;padding:6px 10px}
  .side-lb{padding-bottom:3px}
  .side-fold{display:none}
  .content .wrap{padding:18px 14px 60px}
  .side.folded{flex-basis:auto;width:auto}
  .side.folded .side-brand-t,.side.folded .side-lb,.side.folded .side-group a{display:revert}
}

/* ============================================================
   首页（极简版）：一个定位、三个入口、一行状态、一段最近
   ============================================================ */
.home-hero2{padding:8px 0 26px;border-bottom:1px solid var(--border);margin-bottom:26px}
.home-kicker{font-size:11px;font-weight:800;letter-spacing:1.6px;color:var(--text3);text-transform:uppercase;margin-bottom:10px}
.home-title{font-size:30px;font-weight:800;color:var(--text);letter-spacing:-.6px;line-height:1.25;margin-bottom:10px}
.home-title em{font-style:normal;color:var(--accent)}
.home-sub{font-size:14px;color:var(--text2);line-height:1.85;max-width:620px}
.home-stat{display:flex;gap:26px;flex-wrap:wrap;margin-top:20px}
.home-stat>div{min-width:78px}
.home-stat b{display:block;font-size:22px;font-weight:800;color:var(--text);font-variant-numeric:tabular-nums;line-height:1.2}
.home-stat span{font-size:11.5px;color:var(--text3);letter-spacing:.2px}

.home-entries{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:28px}
.home-entry{
  display:block;text-decoration:none;background:var(--card);border:1px solid var(--border);
  border-radius:12px;padding:20px 20px 18px;transition:.16s;position:relative;overflow:hidden;
}
.home-entry:hover{border-color:var(--accent);transform:translateY(-1px)}
.home-entry .he-k{font-size:11px;font-weight:800;letter-spacing:1.2px;color:var(--text3);text-transform:uppercase;margin-bottom:9px}
.home-entry .he-t{font-size:16px;font-weight:800;color:var(--text);margin-bottom:7px;letter-spacing:-.2px}
.home-entry .he-d{font-size:12.5px;color:var(--text2);line-height:1.8}
.home-entry .he-a{margin-top:13px;font-size:12px;font-weight:800;color:var(--accent)}

.home-sec{margin-bottom:26px}
.home-sec-h{display:flex;align-items:baseline;gap:10px;margin-bottom:11px}
.home-sec-h h3{font-size:13px;font-weight:800;color:var(--text);letter-spacing:.2px}
.home-sec-h span{font-size:11.5px;color:var(--text3)}
.home-row{display:flex;align-items:center;gap:10px;padding:10px 13px;background:var(--card);border:1px solid var(--border);border-radius:9px;margin-bottom:7px;text-decoration:none;transition:.14s}
.home-row:hover{border-color:var(--accent)}
.home-row-t{font-size:12.5px;font-weight:700;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.home-row-m{font-size:11.5px;color:var(--text3);flex-shrink:0}
.home-honest{font-size:12px;color:var(--text3);line-height:1.85;padding:12px 14px;background:var(--bg2);border-radius:9px;border-left:2px solid var(--border)}
.home-honest b{color:var(--text2)}
'''

if '.app-shell' not in css:
    css = css.rstrip() + '\n' + SIDE_CSS
    ok.append('CSS 侧边栏 + 极简首页')

# 顶栏旧规则失效（保留不删，避免其他地方引用），但 .topbar 不再存在，无需清理
open(CP, 'w', encoding='utf-8').write(css)

print('✅ 已改：' + '、'.join(ok))
print()
for f in ['css/style.css']:
    print('  %-18s （CSS）' % f)

# 检查 body 是否已有 app-shell 包装（需要 span 包住 side+content）
h2 = open(HP, encoding='utf-8').read()
print()
print('  含 <aside class="side">:', '<aside class="side"' in h2)
print('  含 <div class="content">:', '<div class="content">' in h2)
print('  </main> 后是否接 </div>:', '</main>\n</div>' in h2 or '</main>\r\n</div>' in h2)
