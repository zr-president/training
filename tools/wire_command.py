# -*- coding: utf-8 -*-
"""把「远征指挥台」接到首页顶部
   改动：
   1) index.html 加载 js/ledger.js 与 js/command.js
   2) app.js：renderHome 开头插入 #cmdRoot 容器，收尾调用 CommandPanel.mount
   3) 把原有说明性区块包进 <details>（默认折叠），首屏只留指挥台
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
ok = []

# ============ 1) index.html 加载脚本 ============
HP = os.path.join(T, 'index.html')
h = open(HP, encoding='utf-8').read()
if 'js/ledger.js' not in h:
    anchor = '<script src="js/progress.js?v=v8"></script>'
    if anchor in h:
        h = h.replace(anchor, anchor + '\n  <script src="js/ledger.js?v=v9"></script>', 1)
        ok.append('ledger.js')
    else:
        m = re.search(r'<script src="js/progress\.js[^"]*"></script>', h)
        if m:
            h = h[:m.end()] + '\n  <script src="js/ledger.js?v=v9"></script>' + h[m.end():]
            ok.append('ledger.js(兜底)')
        else:
            print('⚠️ progress.js 脚本锚点未找到')

if 'js/command.js' not in h:
    anchor2 = '<script src="js/ledger.js?v=v9"></script>'
    if anchor2 in h:
        h = h.replace(anchor2, anchor2 + '\n  <script src="js/command.js?v=v9"></script>', 1)
        ok.append('command.js')
    else:
        print('⚠️ ledger.js 锚点未找到')

open(HP, 'w', encoding='utf-8').write(h)

# ============ 2) app.js ============
AP = os.path.join(T, 'js', 'app.js')
a = open(AP, encoding='utf-8').read()

# 2.1 renderHome 开头插容器
OLD_HEAD = """    var h = '';

    /* ===== Hero ===== */"""
NEW_HEAD = """    var h = '';

    /* ===== 远征指挥台（首页第一眼只回答「今天做什么」）===== */
    h += '<div id="cmdRoot"></div>';

    /* ===== 以下是说明性内容，默认折叠 ===== */
    h += '<details class="acc" style="margin-top:18px"><summary>📖 关于这个平台（训练方向、能力要求、怎么用）</summary><div class="accbody">';

    /* ===== Hero ===== */"""
if 'id="cmdRoot"' in a:
    print('ℹ️  cmdRoot 已存在')
elif OLD_HEAD in a:
    a = a.replace(OLD_HEAD, NEW_HEAD, 1)
    ok.append('renderHome 插入 cmdRoot + details 开头')
else:
    print('⚠️ renderHome 开头锚点未匹配')

# 2.2 renderHome 收尾：关闭 details 并挂载指挥台
OLD_TAIL = """    host.innerHTML = h;
  }"""
NEW_TAIL = """    h += '</div></details>';

    host.innerHTML = h;

    /* 挂载指挥台 */
    try {
      var cr = document.getElementById('cmdRoot');
      if (cr && typeof CommandPanel !== 'undefined') CommandPanel.mount(cr);
    } catch (e) {
      if (window.console) console.error('CommandPanel mount failed:', e);
    }
  }"""
if 'CommandPanel.mount' in a:
    print('ℹ️  已挂载 CommandPanel')
elif OLD_TAIL in a:
    a = a.replace(OLD_TAIL, NEW_TAIL, 1)
    ok.append('renderHome 收尾挂载')
else:
    print('⚠️ renderHome 收尾锚点未匹配')

# 2.3 首页说明区的第 2 个 <details> 嵌套问题：内部已有 details 的话会打架
#     检查 Hero 之后是否还有 details，若有则无害（details 可嵌套）
open(AP, 'w', encoding='utf-8').write(a)

print('✅ 已改：' + ('、'.join(ok) if ok else '无'))
print()

for f in ['js/app.js', 'js/ledger.js', 'js/command.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-18s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])

# 确认关键标记
a2 = open(AP, encoding='utf-8').read()
h2 = open(HP, encoding='utf-8').read()
print()
print('  app.js 含 cmdRoot:', 'id="cmdRoot"' in a2)
print('  app.js 含 CommandPanel.mount:', 'CommandPanel.mount' in a2)
print('  index.html 含 ledger.js:', 'js/ledger.js' in h2)
print('  index.html 含 command.js:', 'js/command.js' in h2)
