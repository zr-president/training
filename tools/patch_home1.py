# -*- coding: utf-8 -*-
"""重构首页 renderHome：讲清求职方向 / 能力目标 / 使用方法；并接入 30 天计划模块"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\js\app.js'
c = open(FP, 'r', encoding='utf-8').read()

# ---------- 1) 模块清单：加 30 天计划 ----------
c = c.replace(
"""  var MODULES = [
    { m: 1, icon: '🗄️', t: 'SQL 训练场',""",
"""  var MODULES = [
    { m: 0, icon: '🗓️', t: '30 天训练计划', d: '从 0 开始的每日任务清单，完成打勾、自动算今天是第几天 —— 不知道先学什么就从这里开始', r: '#/plan', ready: true, hot: true },
    { m: 1, icon: '🗄️', t: 'SQL 训练场',""", 1)

# ---------- 2) 路由 / 模块色 / onShow ----------
c = c.replace("""    '#/sql': function (host) { SQLModule.mount(host); },""",
              """    '#/plan': function (host) { PlanModule.mount(host); },
    '#/sql': function (host) { SQLModule.mount(host); },""", 1)
c = c.replace("    '#/sql': 'm1', '#/lab': 'm2'", "    '#/plan': 'm0', '#/sql': 'm1', '#/lab': 'm2'", 1)
c = c.replace("    if (hash === '#/sql') { try { SQLModule.onShow(); } catch (e) {} }",
              "    if (hash === '#/plan') { try { PlanModule.onShow(); } catch (e) {} }\n    if (hash === '#/sql') { try { SQLModule.onShow(); } catch (e) {} }", 1)

# ---------- 3) 能力模型：加"为什么需要 / 目标等级 / 雷达键" ----------
old_ability = re.search(r"  /\* 能力模型：基于字节跳动策略运营岗真实 JD 反推（9 维） \*/\n  var ABILITY = \[[\s\S]*?\n  \];", c)
new_ability = """  /* 能力模型：策略运营 + AI 产品 两个方向的能力要求（目标等级 1-5） */
  var ABILITY = [
    { n:'SQL 数据提取',      why:'两个方向的硬门槛，面试第一关；不会 SQL 基本过不了简历筛', target:5, hard:true,  radarId:'sql',      mod:'SQL 训练场',    r:'#/sql' },
    { n:'数据分析与问题拆解', why:'从"取数"到"给出结论"的核心能力，决定你是执行还是分析',   target:5, hard:true,  radarId:'analysis', mod:'数据集实验室 + Python 案例', r:'#/lab' },
    { n:'AI / LLM / Agent 理解', why:'AI 产品岗硬性要求；运营岗也越来越多要求"懂 AI 提效"', target:5, hard:true,  radarId:'ai',       mod:'AI 产品经理 · AI Agent', r:'#/aipm' },
    { n:'AI 提升运营效率',    why:'能落地自动化才算真懂；面试要讲出"我做过、省了多少时间"', target:4, hard:true,  radarId:'aieff',    mod:'AI Agent 实操',  r:'#/agent' },
    { n:'量化拆解 · 系统思考', why:'把模糊现象拆成可验证假设——Case 面试的核心考察点',      target:4, hard:true,  radarId:'think',    mod:'Case 拆解训练',  r:'#/case' },
    { n:'实验分析 (A/B)',    why:'增长岗必备；AI 功能上线也要靠实验验证，不会就无法做决策', target:4, hard:false, radarId:'ab',       mod:'实验分析训练',   r:'#/abtest' },
    { n:'指标体系设计',       why:'产品与运营都要"定义成功"；指标体系是数据驱动的前提',     target:4, hard:false, radarId:'metric',   mod:'指标设计工坊',   r:'#/metrics' },
    { n:'PRD 与需求表达',     why:'运营转产品的最大短板；不会写 PRD 就无法独立负责需求',     target:4, hard:true,  radarId:null,       mod:'AI 产品经理 · PRD 工坊', r:'#/aipm' },
    { n:'运营 SOP / 工作流设计', why:'把一次性方案变成可复用流程，是"资深"与"执行"的分界',   target:3, hard:false, radarId:'sop',      mod:'Case 拆解训练',  r:'#/case' },
    { n:'方法论沉淀',         why:'面试时最能体现成长性；也能让团队复制你的打法',           target:3, hard:false, radarId:'method',   mod:'能力雷达',       r:'#/radar' }
  ];

  /* 两个目标求职方向 */
  var DIRECTIONS = [
    { icon:'📈', name:'策略运营 / 用户增长', tag:'互联网行业',
      roles:'字节·抖音增长 / 美团·策略运营 / 小红书·增长运营 / 滴滴·策略运营',
      need:'SQL + 数据分析与拆解 + 指标体系 + 实验分析 + 量化拆解',
      core:'核心门槛：SQL 必须熟练（面试会现场出题），且要能把数据讲成业务结论。',
      path:'主线：SQL 训练场 → 数据集实验室 → 指标设计 → 实验分析 → Case 拆解',
      color:'var(--m1)' },
    { icon:'🧭', name:'AI 产品经理 (AI PM)', tag:'互联网行业',
      roles:'各大厂 AI 产品 / AI 应用产品 / AI 平台产品',
      need:'AI 适用性判断 + 方案选型 + 验收标准 + PRD 表达 + 成本测算',
      core:'核心门槛：能判断"什么该用 AI、什么不该"，并能写清"出问题怎么办"。',
      path:'主线：AI 产品经理（判读→PRD→面试题）→ AI Agent 实操 → Python 案例',
      color:'var(--m10)' }
  ];"""
if old_ability:
    c = c[:old_ability.start()] + new_ability + c[old_ability.end():]
    print('OK 能力模型与求职方向已替换')
else:
    print('MISS ABILITY')

open(FP, 'w', encoding='utf-8').write(c)
print('done step1')
