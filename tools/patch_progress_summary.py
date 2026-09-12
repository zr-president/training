# -*- coding: utf-8 -*-
"""progress.js 的 exportSummary 补充 Python 案例 与 AI 产品经理 两个模块的进度"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\progress.js'
c = open(FP, 'r', encoding='utf-8').read()

anchor = '        /* 能力雷达 */'
if anchor not in c:
    print('MISS anchor'); sys.exit(1)

new = """        /* Python 数据分析案例（案例已学 + 练习已完成） */
        try {
          var PC = (typeof PY_CASES !== 'undefined') ? PY_CASES : null;
          var PT = (typeof PY_TASKS !== 'undefined') ? PY_TASKS : null;
          if (PC) {
            var pdone = 0, ptot = PC.length, pi, pj;
            for (pi = 0; pi < PC.length; pi++) if (this.isOpenDone('pycase', PC[pi].id)) pdone++;
            if (PT) { for (pj = 0; pj < PT.length; pj++) { ptot++; if (this.isOpenDone('pycase', 'task_' + PT[pj].id)) pdone++; } }
            add('python', 'Python 数据分析案例', pdone, ptot);
          }
        } catch (e) {}
        /* AI 产品经理（判读题 + PRD 工坊） */
        try {
          if (typeof AIPM_QUIZZES !== 'undefined') {
            var pq = this.quizStats('aipm', AIPM_QUIZZES.length);
            var prdDone = 0, prdTot = 0;
            if (typeof AIPM_PRD_TASKS !== 'undefined') {
              prdTot = AIPM_PRD_TASKS.length;
              for (var pk = 0; pk < AIPM_PRD_TASKS.length; pk++) if (this.isOpenDone('prd', AIPM_PRD_TASKS[pk].id)) prdDone++;
            }
            add('aipm', 'AI 产品经理', pq.done + prdDone, pq.total + prdTot);
          }
        } catch (e) {}
"""
c = c.replace(anchor, new + anchor, 1)
open(FP, 'w', encoding='utf-8').write(c)
print('OK 已补充 python / aipm 进度段')
