# -*- coding: utf-8 -*-
"""① progress.js 汇总加入 30 天计划 ② check_content.js 校验 plan.js"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------- 1) progress.js ----------
FP = BASE + r'\js\progress.js'
c = open(FP, 'r', encoding='utf-8').read()
if 'PLAN_DAYS' not in c:
    anchor = "        /* Python 数据分析案例"
    block = """        /* 30 天训练计划 */
        try {
          if (typeof PLAN_DAYS !== 'undefined') {
            var pdDone = 0, pdTot = 0, di, ti;
            for (di = 0; di < PLAN_DAYS.length; di++) {
              var pd = PLAN_DAYS[di];
              for (ti = 0; ti < pd.tasks.length; ti++) {
                pdTot++;
                if (this.isOpenDone('plan', 'd' + pd.day + '::' + ti)) pdDone++;
              }
            }
            add('plan', '30 天训练计划', pdDone, pdTot);
          }
        } catch (e) {}
"""
    if anchor in c:
        c = c.replace(anchor, block + anchor, 1)
        open(FP, 'w', encoding='utf-8').write(c)
        print('OK progress.js 已加 plan')
    else:
        print('MISS progress 锚点')
else:
    print('progress 已含 PLAN_DAYS')

# ---------- 2) check_content.js ----------
FP2 = BASE + r'\tools\check_content.js'
k = open(FP2, 'r', encoding='utf-8').read()

if 'PLAN_DAYS' not in k:
    k = k.replace("'PY_CASES:typeof PY_CASES!==\"undefined\"?PY_CASES:null,' +",
                  "'PLAN_DAYS:typeof PLAN_DAYS!==\"undefined\"?PLAN_DAYS:null,' +\n"
                  "    'PLAN_META:typeof PLAN_META!==\"undefined\"?PLAN_META:null,' +\n"
                  "    'PY_CASES:typeof PY_CASES!==\"undefined\"?PY_CASES:null,' +", 1)

    block = """/* ---------- data/plan.js ---------- */
const pl = load('data/plan.js');
const PDAYS = pl.PLAN_DAYS, PMETA = pl.PLAN_META;
if (!PDAYS) err('PLAN_DAYS 未加载');
else {
  if (!PMETA || !PMETA.phases) err('PLAN_META.phases 缺失');
  const phaseNames = new Set((PMETA && PMETA.phases || []).map(p => p.name));
  let totalTasks = 0;
  PDAYS.forEach((d, i) => {
    if (d.day !== i + 1) err(`计划第 ${i + 1} 项的 day 应为 ${i + 1}（现 ${d.day}）`);
    ['phase','title','time'].forEach(k2 => { if (!d[k2]) err(`Day ${d.day} 缺字段 ${k2}`); });
    if (phaseNames.size && !phaseNames.has(d.phase)) err(`Day ${d.day} 的阶段「${d.phase}」不在 PLAN_META.phases 中`);
    if (!d.tasks || d.tasks.length < 2) err(`Day ${d.day} 任务应 >=2 条`);
    (d.tasks || []).forEach((t, j) => {
      if (!t.t) err(`Day ${d.day} 任务#${j + 1} 缺描述`);
      if (!t.link) err(`Day ${d.day} 任务#${j + 1} 缺跳转链接`);
    });
    totalTasks += (d.tasks || []).length;
  });
  if (PDAYS.length !== 30) warn(`计划天数 ${PDAYS.length}（原设计 30 天）`);
  console.log(`30 天训练计划: ${PDAYS.length} 天 / ${totalTasks} 个任务 / ${phaseNames.size} 个阶段`);
}

"""
    anchor2 = '/* ---------- data/pycase.js / pytask_ref.js ---------- */'
    if anchor2 in k:
        k = k.replace(anchor2, block + anchor2, 1)
        open(FP2, 'w', encoding='utf-8').write(k)
        print('OK check_content.js 已加 plan 校验')
    else:
        print('MISS checker 锚点')
else:
    print('checker 已含 PLAN_DAYS')
