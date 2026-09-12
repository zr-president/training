# -*- coding: utf-8 -*-
"""把 Python 模块从「在线运行」切换为「教学案例」：
   - 删除 Pyodide 运行器与被替换的旧模块文件
   - index.html 换脚本引用、导航文案
   - app.js 换路由指向、移除 pytest 钩子
   - progress.js 进度口径从 quiz('python') 改为 open('pycase')
"""
import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------- 1) 删除不再使用的文件 ----------
for f in ['js/python-runner.js', 'js/python-module.js']:
    p = os.path.join(BASE, f)
    if os.path.exists(p):
        os.remove(p); print('已删除', f)

# ---------- 2) index.html ----------
FP = os.path.join(BASE, 'index.html')
h = open(FP, 'r', encoding='utf-8').read()
h = h.replace('<script src="js/python-runner.js?v=v5"></script>\n', '')
h = h.replace('<script src="js/python-module.js?v=v5"></script>',
              '<script src="js/pycase-module.js?v=v5"></script>')
h = h.replace('<script src="data/python.js?v=v5"></script>',
              '<script src="data/python.js?v=v5"></script>\n<script src="data/pycase.js?v=v5"></script>\n<script src="data/pytask_ref.js?v=v5"></script>')
h = h.replace('<a href="#/python">🐍 Python 实算</a>', '<a href="#/python">🐍 Python 案例</a>')
open(FP, 'w', encoding='utf-8').write(h)
print('OK index.html 已更新')

# ---------- 3) app.js ----------
FP2 = os.path.join(BASE, 'js', 'app.js')
c = open(FP2, 'r', encoding='utf-8').read()
c = c.replace("'#/python': function (host) { PythonModule.mount(host); },",
              "'#/python': function (host) { PyCaseModule.mount(host); },")
c = c.replace("if (hash === '#/python') { try { PythonModule.onShow(); } catch (e) {} }",
              "if (hash === '#/python') { try { PyCaseModule.onShow(); } catch (e) {} }")
c = c.replace("{ m: 8, icon: '🐍', t: 'Python 实算', d: '浏览器内跑真实 Python（pandas + scipy）：留存计算、卡方检验、相关性分析', r: '#/python', ready: true },",
              "{ m: 8, icon: '🐍', t: 'Python 数据分析案例', d: '16 个可复制案例（读取/清洗/聚合/留存/统计）+ 6 道代码实例题，均附真实运行结果', r: '#/python', ready: true },")
# 移除 Pyodide 自检钩子
import re
c = re.sub(r"  /\* ---------- Python 自检（\?pytest=1：[\s\S]*?\n  /\* ---------- 启动 ---------- \*/",
           "  /* ---------- 启动 ---------- */", c)
c = c.replace("    if (/[?&]pytest=1/.test(location.search)) pyTest();\n", "")
open(FP2, 'w', encoding='utf-8').write(c)
print('OK app.js 已更新')

# ---------- 4) progress.js ----------
FP3 = os.path.join(BASE, 'js', 'progress.js')
p = open(FP3, 'r', encoding='utf-8').read()
old = """        /* Python 实算 */
        try {
          var PY = (typeof PY_TASKS !== 'undefined') ? PY_TASKS : null;
          if (PY) { var ps = this.quizStats('python', PY.length); add('python', 'Python 实算', ps.done, ps.total); }
        } catch (e) {}"""
# 实际变量名可能是 PY_TASKS 或别的，用正则兜底
m = re.search(r"        /\* Python 实算 \*/[\s\S]*?catch \(e\) \{\}", p)
new = """        /* Python 数据分析案例（案例已学 + 练习已完成） */
        try {
          var PC = (typeof PY_CASES !== 'undefined') ? PY_CASES : null;
          var PT = (typeof PY_TASKS !== 'undefined') ? PY_TASKS : null;
          if (PC) {
            var pdone = 0, ptot = PC.length;
            for (var pi = 0; pi < PC.length; pi++) if (this.isOpenDone('pycase', PC[pi].id)) pdone++;
            if (PT) { for (var pj = 0; pj < PT.length; pj++) { ptot++; if (this.isOpenDone('pycase', 'task_' + PT[pj].id)) pdone++; } }
            add('python', 'Python 数据分析案例', pdone, ptot);
          }
        } catch (e) {}"""
if m:
    p = p[:m.start()] + new + p[m.end():]
    open(FP3, 'w', encoding='utf-8').write(p)
    print('OK progress.js 已更新')
else:
    print('MISS progress.js 中的 Python 段（稍后手动检查）')
