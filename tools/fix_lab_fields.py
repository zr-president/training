# -*- coding: utf-8 -*-
"""规范化 lab 新增题：确保每项都有 question 与 context 字段"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\lab.js'
c = open(FP, 'r', encoding='utf-8').read()

# lab09 缺 question：把 ctx 的内容同时作为 question（并把 ctx 保留）
fixes = [
    # lab09: 补 question（在 ctx 之前插入）
    ("""  ctx:'新用户从注册到第一次付费要经过好几步。老板问：我们到底卡在哪一步？',
  deliverable:'画出新用户激活漏斗（注册→登录→发帖/互动→付费），指出最大的流失环节，并给出 2 条改进动作。',""",
     """  question:'新用户从注册到第一次付费要经过好几步。老板问：我们到底卡在哪一步？',
  context:'激活漏斗是增长分析的基础工具：要区分清楚每一环的流失原因，才能对症下药。',
  ctx:'新用户从注册到第一次付费要经过好几步。老板问：我们到底卡在哪一步？',
  deliverable:'画出新用户激活漏斗（注册→登录→发帖/互动→付费），指出最大的流失环节，并给出 2 条改进动作。',"""),
    # lab10: 已有 question/context/ctx —— 无需改
    # lab11: 补 context
    ("""  ctx:'运营想在用户流失前就介入，而不是等流失后再召回。但"即将流失"必须能被定义和度量。',
  question:'你如何定义"即将流失"？按你的定义圈出这批人，并给出规模与渠道分布。',""",
     """  question:'你如何定义"即将流失"？按你的定义圈出这批人，并给出规模与渠道分布。',
  context:'预警的价值在于"提前介入"——用户流失后再召回，成本高得多、成功率低得多。难点在于把"即将流失"变成可度量、可自动执行的规则。',
  ctx:'运营想在用户流失前就介入，而不是等流失后再召回。但"即将流失"必须能被定义和度量。',"""),
    # lab12: 补 context
    ("""  ctx:'内容平台最怕"看的人多、发的人少"。要先弄清楚：产出内容的是怎样一群人？',
  question:'描述发帖用户的画像（渠道/城市/年龄/活跃度），并估算他们占全站的比例。',""",
     """  question:'描述发帖用户的画像（渠道/城市/年龄/活跃度），并估算他们占全站的比例。',
  context:'内容平台的供给端通常极度集中：少数人产出、多数人消费。弄清"谁在产出"是扩大供给的前提。',
  ctx:'内容平台最怕"看的人多、发的人少"。要先弄清楚：产出内容的是怎样一群人？',"""),
]

n = 0
for old, new in fixes:
    if old in c:
        c = c.replace(old, new, 1); n += 1
    else:
        print('MISS:', old[:70].replace('\n', ' | '))

open(FP, 'w', encoding='utf-8').write(c)
print(f'OK 修正 {n} 处')
