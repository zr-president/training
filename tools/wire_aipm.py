# -*- coding: utf-8 -*-
"""接线 AI 产品经理模块：路由 + 模块色 + onShow"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\app.js'
c = open(FP, 'r', encoding='utf-8').read()

fixes = [
    # 路由
    ("""    '#/python': function (host) { PythonModule.mount(host); },
    '#/lab': function (host) { LabModule.mount(host); },""",
     """    '#/python': function (host) { PythonModule.mount(host); },
    '#/aipm': function (host) { AipmModule.mount(host); },
    '#/lab': function (host) { LabModule.mount(host); },"""),
    # 模块色
    ("""    '#/python': 'm8', '#/data': 'm9'
  };""",
     """    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10'
  };"""),
    # onShow
    ("""    if (hash === '#/data') { try { DataModule.onShow(); } catch (e) {} }""",
     """    if (hash === '#/data') { try { DataModule.onShow(); } catch (e) {} }
    if (hash === '#/aipm') { try { AipmModule.onShow(); } catch (e) {} }"""),
]
n = 0
for a, b in fixes:
    if a in c:
        c = c.replace(a, b, 1); n += 1
    else:
        print('MISS:', a.strip()[:70])
open(FP, 'w', encoding='utf-8').write(c)
print(f'OK 接线 {n}/3')

# index.html 脚本
FP2 = r'C:\Users\ZR\Desktop\钟锐的训练场\index.html'
h = open(FP2, 'r', encoding='utf-8').read()
if 'aipm.js' not in h:
    h = h.replace('<script src="data/python.js?v=v5"></script>',
                  '<script src="data/python.js?v=v5"></script>\n<script src="data/aipm.js?v=v5"></script>', 1)
    h = h.replace('<script src="js/python-module.js?v=v5"></script>',
                  '<script src="js/python-module.js?v=v5"></script>\n<script src="js/aipm-module.js?v=v5"></script>', 1)
    # 导航加入口
    h = h.replace('<a href="#/radar">🎯 能力雷达</a>',
                  '<a href="#/aipm">🧭 AI 产品经理</a>\n    <a href="#/radar">🎯 能力雷达</a>', 1)
    open(FP2, 'w', encoding='utf-8').write(h)
    print('OK index.html 已加脚本与导航')
else:
    print('index.html 已包含 aipm')
