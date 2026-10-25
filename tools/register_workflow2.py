# -*- coding: utf-8 -*-
"""补 app.js 剩下两处注册（MODULES / MOD_CLASS），缩进为 4 空格"""
import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
p = r'C:\Users\ZR\Desktop\钟锐的训练场\js\app.js'
a = open(p, encoding='utf-8').read()

# 1) MODULES
OLD_M = ("    { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true }\n  ];")
NEW_M = ("    { m: 10, icon: '🧭', t: 'AI 产品经理', d: '运营转型专项：AI 适用性判断 / 需求优先级 / 验收标准 / 技术选型 / 成本测算 + PRD 工坊 + 能力迁移对照', r: '#/aipm', ready: true },\n"
         "    { m: 11, icon: '🔄', t: 'AI 工作流实验室', d: '12 道设计题：给真实场景+约束，自己设计工作流（拆解 / 工具 / 人工点 / 验收）→ 对照参考答案与评分维度 · 前 4 题来自真实项目', r: '#/workflow', ready: true, hot: true }\n  ];")
if 'm: 11' in a:
    print('ℹ️  MODULES 已有 m11')
elif OLD_M in a:
    a = a.replace(OLD_M, NEW_M, 1); print('✅ MODULES 已加 m11')
else:
    print('❌ MODULES 锚点仍不符')

# 2) MOD_CLASS
OLD_C = "    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10'\n  }"
NEW_C = "    '#/python': 'm8', '#/data': 'm9', '#/aipm': 'm10', '#/workflow': 'm11'\n  }"
if "'m11'" in a:
    print('ℹ️  MOD_CLASS 已有 m11')
elif OLD_C in a:
    a = a.replace(OLD_C, NEW_C, 1); print('✅ MOD_CLASS 已加 m11')
else:
    print('❌ MOD_CLASS 锚点仍不符')

open(p, 'w', encoding='utf-8').write(a)

# 校验
b = open(p, encoding='utf-8').read()
for k in ['m: 11', "'#/workflow'", "'m11'", 'WorkflowModule', 'AI 工作流实验室']:
    print('  含 %-16s %s' % (k, k in b))
