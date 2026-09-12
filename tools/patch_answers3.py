# -*- coding: utf-8 -*-
"""在模块顶部加"答案在哪看"提示条，并在首页加答案说明"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

TIP_QUIZ = ("'<div class=\"ans-tip\">✅ <b>答案怎么看</b>　两种方式：① 点「提交判分」→ 逐项显示为什么对 / 为什么错；" 
            "② 不想判分就点「👀 直接看答案（不判分）」。选项下方还会给出本题的<b>判读要点</b>与一句话方法论。</div>' +\n      ")
TIP_ACC  = ("'<div class=\"ans-tip\">✅ <b>答案怎么看</b>　每道题下方都有<b>绿色「参考答案 ·」折叠区</b>，点开即可查看" 
            "参考解 / 参考结论 / 逐点讲解；先自己想一遍再看效果最好。</div>' +\n      ")

# (文件, 提示类型)
targets = [
    ('js/quiz-module.js', 'quiz'),
    ('js/sql-module.js', 'acc'),
    ('js/lab-module.js', 'acc'),
    ('js/case-module.js', 'acc'),
    ('js/pycase-module.js', 'acc'),
    ('js/aipm-module.js', 'acc'),
    ('js/agent-module.js', 'acc'),
]

for rel, kind in targets:
    p = BASE + '\\' + rel.replace('/', '\\')
    s = open(p, 'r', encoding='utf-8').read()
    if 'ans-tip' in s:
        print(f'{rel}: 已有提示条，跳过'); continue
    anchor = "'<div class=\"stats\" id=\""
    if anchor not in s:
        print(f'{rel}: MISS 锚点'); continue
    tip = TIP_QUIZ if kind == 'quiz' else TIP_ACC
    s = s.replace(anchor, tip + anchor, 1)
    open(p, 'w', encoding='utf-8').write(s)
    print(f'{rel}: ✅ 已加提示条（{kind}）')

# ---------- 首页加"答案在哪看"说明 ----------
FP = BASE + r'\js\app.js'
a = open(FP, 'r', encoding='utf-8').read()
if '答案在哪看' not in a:
    anchor = "    h += '</div>';\n\n    /* ===== 当前进度 ===== */"
    tip = """    h += '</div>';

    /* ===== 答案在哪看 ===== */
    h += '<div class="ans-tip" style="margin-top:13px;align-items:flex-start">' +
         '<span style="font-size:14px">❓</span><span><b>答案在哪看？</b>　每道题都有参考答案，位置如下：<br>' +
         '· <b>SQL 训练场 / 数据集实验室 / Case 拆解 / PRD 工坊 / Python 案例</b>：题目下方的<b>绿色「参考答案 ·」折叠区</b>，点开就是参考解与讲解<br>' +
         '· <b>判读题（指标设计 / 实验分析 / AI Agent / AI PM）</b>：点「提交判分」逐项显示对错原因，或点「👀 直接看答案」不判分直接看<br>' +
         '· <b>Python 案例</b>：直接展示代码 + <b>真实运行结果</b>（真跑出来的，不是示意）<br>' +
         '· <b>面试题库</b>：每题直接给出「考察意图 / 回答框架 / 参考要点 / 加分与减分说法」</span></div>';

    /* ===== 当前进度 ===== */"""
    if anchor in a:
        a = a.replace(anchor, tip, 1)
        open(FP, 'w', encoding='utf-8').write(a)
        print('首页: ✅ 已加答案说明')
    else:
        print('首页: MISS 锚点')
else:
    print('首页: 已有答案说明')
