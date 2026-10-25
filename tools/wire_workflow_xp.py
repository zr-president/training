# -*- coding: utf-8 -*-
"""把 AI 工作流模块接入 exportSummary（否则它的完成量不计入 XP / 总进度）"""
import io, sys, os, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
PP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\progress.js'
p = open(PP, encoding='utf-8').read()

BLOCK = '''        /* AI 工作流 */
        try {
          var WQ = (typeof WORKFLOW_QUESTIONS !== 'undefined') ? WORKFLOW_QUESTIONS : null;
          if (WQ) {
            var wd = 0;
            for (var wi = 0; wi < WQ.length; wi++) if (this.isOpenDone('workflow', WQ[wi].id)) wd++;
            add('workflow', 'AI 工作流实验室', wd, WQ.length);
          }
        } catch (e) {}
'''

ANCHOR = "        /* 能力雷达 */"
if "'workflow', 'AI 工作流实验室'" in p:
    print('ℹ️  已接入')
elif ANCHOR in p:
    p = p.replace(ANCHOR, BLOCK + ANCHOR, 1)
    open(PP, 'w', encoding='utf-8').write(p)
    print('✅ exportSummary 已接入 workflow')
else:
    print('❌ 锚点未匹配')

r = subprocess.run(['node', '--check', PP], capture_output=True, text=True,
                   encoding='utf-8', errors='replace')
print('语法：', 'OK' if r.returncode == 0 else 'FAIL ' + (r.stderr or '')[:250])

c = open(PP, encoding='utf-8').read()
print('  含 workflow 统计：', "'workflow', 'AI 工作流实验室'" in c)
