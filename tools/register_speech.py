# -*- coding: utf-8 -*-
"""注册「语音复述训练」模块（P1B-M03）
   改动：css（m12 配色）· app.js（模块/路由/配色/onShow）· index.html（脚本+导航）
        progress.js（接入 exportSummary 与 XP 权重）
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
ok = []

# ==================== 1) CSS：m12 ====================
cp = os.path.join(T, 'css', 'style.css')
c = open(cp, encoding='utf-8').read()
if '--m12' not in c:
    # 浅色：--m11 之后
    a11 = '  --m11:#0284c7;--m11b:#38bdf8;--m11l:#f0f9ff;\n'
    if a11 in c:
        c = c.replace(a11, a11 + '  --m12:#be123c;--m12b:#f43f5e;--m12l:#fff1f2;\n', 1)
        ok.append('浅色 --m12')
    # 深色：找第二个 --m11 定义
    idx = c.find('--m11:', c.find('--m11:') + 5)
    if idx > 0:
        eol = c.find('\n', idx)
        c = c[:eol] + '\n  --m12:#fb7185;--m12b:#fda4af;--m12l:#2a1420;' + c[eol:]
        ok.append('深色 --m12')
    cls11 = '.m11{--mc:var(--m11);--mcb:var(--m11b);--mcl:var(--m11l)}'
    if cls11 in c:
        c = c.replace(cls11, cls11 + '\n.m12{--mc:var(--m12);--mcb:var(--m12b);--mcl:var(--m12l)}', 1)
        ok.append('.m12 类')
    open(cp, 'w', encoding='utf-8').write(c)
else:
    print('ℹ️  m12 已存在')

# ==================== 2) app.js ====================
ap = os.path.join(T, 'js', 'app.js')
a = open(ap, encoding='utf-8').read()

# 2.1 MODULES
OLD_M = "    { m: 11, icon: '🔄', t: 'AI 工作流实验室',"
if 'm: 12' not in a:
    # 找到 m11 那一行结尾，在其后插入
    m11 = re.search(r"(    \{ m: 11,[^\n]*\n)", a)
    if m11:
        line = ("    { m: 12, icon: '🎙️', t: '语音复述训练', d: '朗读给定材料 → 浏览器转写 → 计算字符错误率并标出漏字/说错的字 · 不需要 API Key · 测的是数字与术语的准确度', r: '#/speech', ready: true },\n")
        a = a[:m11.end(1)] + line + a[m11.end(1):]
        ok.append('MODULES m12')
    else:
        print('⚠️ MODULES m11 行未找到')
else:
    print('ℹ️  MODULES 已有 m12')

# 2.2 ROUTES
if "'#/speech'" not in a:
    OLD_R = "  '#/workflow': function (host) { WorkflowModule.mount(host); },"
    NEW_R = OLD_R + "\n  '#/speech': function (host) { SpeechModule.mount(host); },"
    if OLD_R in a:
        a = a.replace(OLD_R, NEW_R, 1); ok.append('ROUTES #/speech')
    else:
        print('⚠️ ROUTES 锚点未找到')
else:
    print('ℹ️  ROUTES 已有 #/speech')

# 2.3 MOD_CLASS
if "'m12'" not in a:
    OLD_C = "    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10', '#/workflow': 'm11'\n  }"
    NEW_C = "    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10', '#/workflow': 'm11', '#/speech': 'm12'\n  }"
    if OLD_C in a:
        a = a.replace(OLD_C, NEW_C, 1); ok.append('MOD_CLASS m12')
    else:
        print('⚠️ MOD_CLASS 锚点未找到')
else:
    print('ℹ️  MOD_CLASS 已有 m12')

# 2.4 onShow
if 'SpeechModule.onShow' not in a:
    OLD_S = "  if (hash === '#/workflow') { try { WorkflowModule.onShow(); } catch (e) {} }"
    NEW_S = OLD_S + "\n  if (hash === '#/speech') { try { SpeechModule.onShow(); } catch (e) {} }"
    if OLD_S in a:
        a = a.replace(OLD_S, NEW_S, 1); ok.append('onShow')
    else:
        print('⚠️ onShow 锚点未找到')
else:
    print('ℹ️  onShow 已有')

open(ap, 'w', encoding='utf-8').write(a)

# ==================== 3) index.html ====================
hp = os.path.join(T, 'index.html')
h = open(hp, encoding='utf-8').read()

if 'data/speech.js' not in h:
    OLD_D = '<script src="data/workflow.js?v=v6"></script>'
    if OLD_D in h:
        h = h.replace(OLD_D, OLD_D + '\n  <script src="data/speech.js?v=v7"></script>', 1)
        ok.append('data/speech.js')
    else:
        print('⚠️ 数据脚本锚点未找到')

if 'speech-module.js' not in h:
    OLD_J = '<script src="js/workflow-module.js?v=v6"></script>'
    if OLD_J in h:
        h = h.replace(OLD_J, OLD_J + '\n  <script src="js/speech-module.js?v=v7"></script>', 1)
        ok.append('speech-module.js')
    else:
        print('⚠️ 模块脚本锚点未找到')

# 导航：在 workflow 之后加一项
if '#/speech' not in h:
    m = re.search(r'<a href="#/workflow">[^<]*</a>', h)
    if m:
        seg = m.group(0)
        newseg = seg.replace('href="#/workflow"', 'href="#/speech"').replace('🔄 AI 工作流', '🎙️ 语音复述')
        h = h[:m.end()] + '\n' + newseg + h[m.end():]
        ok.append('导航项')
    else:
        print('⚠️ 导航锚点未找到')

open(hp, 'w', encoding='utf-8').write(h)

# ==================== 4) progress.js：接入统计与 XP ====================
pp = os.path.join(T, 'js', 'progress.js')
p = open(pp, encoding='utf-8').read()

if "'speech', '语音复述训练'" not in p:
    BLOCK = '''        /* 语音复述训练 */
        try {
          var SM = (typeof SPEECH_MATERIALS !== 'undefined') ? SPEECH_MATERIALS : null;
          if (SM) {
            var sd = 0;
            for (var si = 0; si < SM.length; si++) if (this.isOpenDone('speech', SM[si].id)) sd++;
            add('speech', '语音复述训练', sd, SM.length);
          }
        } catch (e) {}
'''
    ANCHOR = "        /* 能力雷达 */"
    if ANCHOR in p:
        p = p.replace(ANCHOR, BLOCK + ANCHOR, 1)
        ok.append('exportSummary 接入 speech')

# XP 权重
if 'speech: 25' not in p:
    OLD_W = "                plan: 4, python: 20, aipm: 20, prd: 30, interview: 15, workflow: 40 };"
    NEW_W = "                plan: 4, python: 20, aipm: 20, prd: 30, interview: 15, workflow: 40, speech: 25 };"
    if OLD_W in p:
        p = p.replace(OLD_W, NEW_W, 1)
        ok.append('XP 权重 speech:25')
    else:
        print('⚠️ XP 权重锚点未找到（不影响功能）')

open(pp, 'w', encoding='utf-8').write(p)

print('✅ 已注册：' + ('、'.join(ok) if ok else '无'))
print()
for f in ['js/app.js', 'js/speech-module.js', 'data/speech.js', 'js/progress.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-24s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
