# -*- coding: utf-8 -*-
"""接入「学习学院」与「预测日志」

改动：
1) css/style.css —— 新增 m13（学院，靛紫）与 m14（预测，青柠）配色 + .ac-* / .pd-* 样式
2) js/app.js —— MODULES 加 2 个模块、ROUTES 加 2 条、MOD_CLASS 加映射、onShow 加钩子
3) index.html —— 加载 3 个新脚本（academy.js / academy-module.js / predict.js）
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
ok = []

# ============ 1) CSS ============
CP = os.path.join(T, 'css', 'style.css')
css = open(CP, encoding='utf-8').read()

if '--m13' not in css:
    css = css.replace(
        '--m12:#be123c;--m12b:#f43f5e;--m12l:#fff1f2;',
        '--m12:#be123c;--m12b:#f43f5e;--m12l:#fff1f2;\n'
        '  --m13:#6d28d9;--m13b:#8b5cf6;--m13l:#f5f3ff;\n'
        '  --m14:#0d9488;--m14b:#2dd4bf;--m14l:#f0fdfa;', 1)
    ok.append('浅色 m13/m14')

if css.count('--m13:#') < 2:
    idx = css.find('--m12:#fb7185;')
    if idx > 0:
        eol = css.find('\n', idx)
        css = css[:eol] + '\n  --m13:#a78bfa;--m13b:#c4b5fd;--m13l:#211a38;\n  --m14:#2dd4bf;--m14b:#5eead4;--m14l:#0b2a28;' + css[eol:]
        ok.append('深色 m13/m14')

# 模块类
if '.m13{' not in css:
    anchor = '.m12{--mc:var(--m12);--mcb:var(--m12b);--mcl:var(--m12l)}'
    if anchor in css:
        css = css.replace(anchor, anchor +
            '\n.m13{--mc:var(--m13);--mcb:var(--m13b);--mcl:var(--m13l)}'
            '\n.m14{--mc:var(--m14);--mcb:var(--m14b);--mcl:var(--m14l)}', 1)
        ok.append('.m13/.m14 类')

# 学院与预测的组件样式
STYLES = '''
/* ===== 学习学院 ===== */
.ac-list{display:flex;flex-direction:column;gap:10px}
.ac-layer{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:11px 13px}
.ac-layer-hd{display:flex;align-items:baseline;gap:7px;margin-bottom:4px}
.ac-layer-id{font-family:var(--mono);font-size:12px;font-weight:800;color:var(--mc,var(--accent));background:var(--mcl,var(--accent-light));padding:1px 6px;border-radius:5px}
.ac-layer-name{font-size:13px;font-weight:800;color:var(--text)}
.ac-layer-cnt{font-size:12px;color:var(--text3);margin-left:auto}
.ac-layer-note{font-size:12px;color:var(--text3);line-height:1.7;margin-bottom:8px}
.ac-unit{padding:8px 10px;border-radius:8px;background:var(--bg2);cursor:pointer;margin-bottom:6px;border-left:3px solid transparent;transition:.15s}
.ac-unit:hover{border-left-color:var(--mc,var(--accent))}
.ac-unit.on{border-left-color:var(--mc,var(--accent));background:var(--mcl,var(--accent-light))}
.ac-unit-t{font-size:13px;font-weight:700;color:var(--text);line-height:1.5}
.ac-unit-m{font-size:12px;color:var(--text3);margin-top:2px}
.ac-plan{margin-top:6px}
.ac-plan summary{font-size:12px;color:var(--text3);cursor:pointer;padding:4px 0}
.ac-plan-body{margin-top:6px;display:flex;flex-direction:column;gap:5px}
.ac-plan-item{font-size:12px;color:var(--text3);line-height:1.6;padding-left:8px;border-left:2px solid var(--border)}
.ac-plan-item em{display:block;font-style:normal;opacity:.75;font-size:11px}

.ac-unit-title{font-size:20px;font-weight:800;color:var(--text);line-height:1.35;letter-spacing:-.3px}
.ac-unit-sub{font-size:13px;color:var(--text3);margin-top:4px}
.ac-meta{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0}
.ac-meta span{font-size:12px;color:var(--text3);background:var(--bg2);padding:2px 8px;border-radius:5px}
.ac-goalbox{background:var(--mcl,var(--accent-light));border-radius:10px;padding:11px 14px;font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:10px}
.ac-goalbox b{color:var(--mc,var(--accent));display:block;margin-bottom:3px;font-size:12px}
.ac-concepts{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:14px;font-size:12px;color:var(--text3)}
.ac-chip{background:var(--bg2);border:1px solid var(--border);padding:2px 8px;border-radius:20px;font-size:12px;color:var(--text2)}

.ac-step{border-top:1px solid var(--border);padding:16px 0}
.ac-step-hd{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px}
.ac-step-n{font-size:12px;color:#fff;background:var(--mc,var(--accent));width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ac-body{font-size:14px;color:var(--text2);line-height:1.95}
.ac-body p{margin-bottom:9px}
.ac-body h4{color:var(--text);font-size:13px}
.ac-body ul,.ac-body ol{margin:8px 0 10px 20px}
.ac-body li{margin-bottom:5px}
.ac-quote{background:var(--bg2);border-left:3px solid var(--mc,var(--accent));padding:9px 13px;border-radius:0 8px 8px 0;font-size:13px;color:var(--text2);line-height:1.9;margin:9px 0}
.ac-goal{background:var(--bg2);border-radius:9px;padding:10px 13px;font-size:13px;line-height:1.9}
.ac-callout{background:var(--mcl,var(--accent-light));border-left:3px solid var(--mc,var(--accent));border-radius:0 9px 9px 0;padding:10px 14px;font-size:13px;line-height:1.9;margin:11px 0}
.ac-callout.okc{background:#f0fdfa;border-left-color:var(--em);color:#0f766e}
.ac-callout.badc{background:#fef2f2;border-left-color:var(--rd);color:#b91c1c}
.ac-note{font-size:12px;color:var(--text3);line-height:1.8}
.ac-table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}
.ac-table th,.ac-table td{border:1px solid var(--border);padding:7px 10px;text-align:left;vertical-align:top;line-height:1.75}
.ac-table th{background:var(--bg2);font-size:12px;font-weight:800;color:var(--text2)}
.ac-fig{background:var(--bg2);border-radius:10px;padding:16px 12px}
.ac-fig-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}
.ac-box{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--text2);text-align:center;flex:1;min-width:110px;line-height:1.6}
.ac-box-hi{border-color:var(--mc,var(--accent));color:var(--mc,var(--accent));font-weight:800;background:var(--mcl,var(--accent-light))}
.ac-arrow{color:var(--text3);font-size:14px}
.ac-tree{display:flex;flex-direction:column;gap:0}
.ac-node{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 13px;display:flex;align-items:baseline;gap:9px}
.ac-node b{font-size:13px;color:var(--text);flex-shrink:0;min-width:56px}
.ac-node span{font-size:12px;color:var(--text3);line-height:1.6}
.ac-node-1{border-left:4px solid var(--m1)}
.ac-node-2{border-left:4px solid var(--m2)}
.ac-node-3{border-left:4px solid var(--m6)}
.ac-node-4{border-left:4px solid var(--m7)}
.ac-down{font-size:11px;color:var(--text3);padding:3px 0 3px 22px}
.ac-q{background:var(--bg2);border-radius:9px;padding:10px 13px;font-size:13px;line-height:1.9;margin-bottom:10px}
.ac-opts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.ac-opt{text-align:left;padding:9px 13px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text2);font-size:13px;cursor:pointer;font-family:var(--sans);transition:.15s;line-height:1.7}
.ac-opt:hover:not(:disabled){border-color:var(--mc,var(--accent));background:var(--mcl,var(--accent-light))}
.ac-opt:disabled{cursor:default}
.ac-opt.right{border-color:var(--em);background:#f0fdfa;color:#0f766e;font-weight:700}
.ac-opt.wrong{border-color:var(--rd);background:#fef2f2;color:#b91c1c}
.ac-hintbar{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.ac-hint-cnt{font-size:12px;color:var(--text3)}
.ac-hints{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.ac-hint{background:#fffbeb;border-left:3px solid var(--am);border-radius:0 8px 8px 0;padding:8px 12px;font-size:12px;color:#92400e;line-height:1.85}
.ac-explain{background:var(--bg2);border-radius:9px;padding:11px 14px;font-size:13px;line-height:1.95;color:var(--text2);margin-top:9px}
.ac-ta{width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--sans);background:var(--bg2);color:var(--text);resize:vertical;line-height:1.8}
.ac-row{display:flex;gap:8px;align-items:center;margin-top:9px;flex-wrap:wrap}
.ac-refbox{margin-top:9px}
.ac-task{background:var(--bg2);border-radius:9px;padding:10px 13px;font-size:13px;line-height:1.9;margin-bottom:10px}
.ac-check{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:13px;margin-bottom:9px}
.ac-check b{display:block;margin-bottom:6px;font-size:12px;color:var(--text2)}
.ac-check-item{display:block;font-size:12px;color:var(--text2);line-height:1.9;cursor:pointer}
.ac-tip{font-size:12px;color:var(--text3);line-height:1.8;background:var(--bg2);border-radius:8px;padding:9px 12px}
.ac-retest{margin:8px 0 0 20px;font-size:13px;color:var(--text2);line-height:2}
.ac-foot{border-top:1px solid var(--border);padding-top:14px;margin-top:6px}
.ac-foot-note{font-size:12px;color:var(--text3);line-height:1.8;margin-bottom:9px}

/* ===== 预测日志 ===== */
.pd-row{display:flex;gap:8px;align-items:center}
.pd-input{flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg2);color:var(--text);font-family:var(--sans)}
.pd-lab{font-size:12px;color:var(--text2);display:flex;align-items:center;gap:6px}
.pd-lab input[type=date]{padding:6px 9px;border:1px solid var(--border);border-radius:7px;font-size:12px;background:var(--bg2);color:var(--text);font-family:var(--sans)}
.pd-item-t{font-size:13px;font-weight:700;color:var(--text);line-height:1.6}
.pd-item-m{font-size:12px;color:var(--text3);margin-top:3px}
.pd-item-a{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
@media(max-width:860px){.ac-fig-row{flex-direction:column}.ac-arrow{transform:rotate(90deg)}}
'''
if '/* ===== 学习学院 ===== */' not in css:
    css = css.rstrip() + '\n' + STYLES
    ok.append('.ac-*/.pd-* 样式')

open(CP, 'w', encoding='utf-8').write(css)

# ============ 2) app.js ============
AP = os.path.join(T, 'js', 'app.js')
a = open(AP, encoding='utf-8').read()

if 'm: 13' not in a:
    m11 = re.search(r"(    \{ m: 12,[^\n]*\n)", a)
    if m11:
        line = (
            "    { m: 13, icon: '🎓', t: '学习学院', d: '系统分层教学：每课 15-25 分钟，7 步走完（场景 → 核心图 → 例题 → 带提示阶梯的引导练习 → 独立变式 → 迁移产物 → 3 天后复测）· 先开 2 课样板', r: '#/academy', ready: true, hot: true },\n"
            "    { m: 14, icon: '🎯', t: '预测日志', d: '把「我判断得准不准」变成数字：记下判断与概率 → 到期判定对错 → 算 Brier 分数与校准表（说 70% 的那些是不是真的对了七成）', r: '#/predict', ready: true },\n"
        )
        a = a[:m11.end(1)] + line + a[m11.end(1):]
        ok.append('MODULES m13/m14')
    else:
        print('⚠️ MODULES 锚点未找到')

if "'#/academy'" not in a:
    anchor = "  '#/speech': function (host) { SpeechModule.mount(host); },"
    if anchor in a:
        a = a.replace(anchor, anchor +
            "\n  '#/academy': function (host) { AcademyModule.mount(host); },"
            "\n  '#/predict': function (host) { Predict.mount(host); },", 1)
        ok.append('ROUTES')
    else:
        print('⚠️ ROUTES 锚点未找到')

if "academy': 'm13'" not in a:
    old = "'#/workflow': 'm11', '#/speech': 'm12'\n  }"
    new = "'#/workflow': 'm11', '#/speech': 'm12', '#/academy': 'm13', '#/predict': 'm14'\n  }"
    if old in a:
        a = a.replace(old, new, 1); ok.append('MOD_CLASS')
    else:
        print('⚠️ MOD_CLASS 锚点未找到')

if 'AcademyModule.onShow' not in a:
    old2 = "  if (hash === '#/speech') { try { SpeechModule.onShow(); } catch (e) {} }"
    if old2 in a:
        a = a.replace(old2, old2 +
            "\n  if (hash === '#/academy') { try { AcademyModule.onShow(); } catch (e) {} }", 1)
        ok.append('onShow')

open(AP, 'w', encoding='utf-8').write(a)

# ============ 3) index.html ============
HP = os.path.join(T, 'index.html')
h = open(HP, encoding='utf-8').read()

if 'data/academy.js' not in h:
    anchor = '<script src="data/speech.js?v=v8"></script>'
    if anchor in h:
        h = h.replace(anchor, anchor + '\n  <script src="data/academy.js?v=v10"></script>', 1)
        ok.append('academy.js')
    else:
        m = re.search(r'<script src="data/speech\.js[^"]*"></script>', h)
        if m:
            h = h[:m.end()] + '\n  <script src="data/academy.js?v=v10"></script>' + h[m.end():]
            ok.append('academy.js(兜底)')

if 'js/academy-module.js' not in h:
    anchor2 = '<script src="js/speech-module.js?v=v8"></script>'
    if anchor2 in h:
        h = h.replace(anchor2, anchor2 +
            '\n  <script src="js/academy-module.js?v=v10"></script>' +
            '\n  <script src="js/predict.js?v=v10"></script>', 1)
        ok.append('academy-module.js + predict.js')
    else:
        print('⚠️ speech-module 脚本锚点未找到（请检查 index.html 版本号）')

open(HP, 'w', encoding='utf-8').write(h)

print('✅ 已改：' + ('、'.join(ok) if ok else '无'))
print()
for f in ['js/app.js', 'js/academy-module.js', 'js/predict.js', 'data/academy.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-26s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL ' + (r.stderr or '')[:200]))

h2 = open(HP, encoding='utf-8').read()
a2 = open(AP, encoding='utf-8').read()
print()
print('  index.html 含 academy.js:', 'data/academy.js' in h2)
print('  index.html 含 academy-module:', 'js/academy-module.js' in h2)
print('  app.js 含 #/academy:', "'#/academy'" in a2)
print('  app.js 含 #/predict:', "'#/predict'" in a2)
