// 30 天训练计划 · 从 0 开始，每天 40-60 分钟，完成可打勾
// 设计原则：①先打地基再上业务 ②每天必有"动手"任务 ③每完成一个阶段就有可展示的产出

var PLAN_META = {
  updated: '2026-09-12',
  totalDays: 30,
  dailyTime: '每天 40-60 分钟',
  intro: '这是从 0 开始的 30 天训练路径：不用纠结"先学什么"，按天打勾就行。每天的任务都直接跳到对应模块，做完打勾，进度自动保存。建议每天固定一个时间段（如晚上 20:00-21:00）来做，比"有空就做"完成率高得多。',
  phases: [
    { name: '打地基', days: 'Day 1-7',   goal: '能读懂数据集、写出基础 SQL、跑通 Python 环境' },
    { name: '核心数据能力', days: 'Day 8-14',  goal: '掌握多表关联、窗口函数、留存与漏斗的标准写法' },
    { name: '业务分析能力', days: 'Day 15-21', goal: '能从业务问题出发独立产出分析结论' },
    { name: '产品与实战', days: 'Day 22-30', goal: '补齐产品能力、准备面试、做出可展示的项目' }
  ]
};

var PLAN_DAYS = [
/* ============ 阶段 1 · 打地基（Day 1-7） ============ */
{ day:1, phase:'打地基', title:'认识数据与工具', time:'45 分钟', tasks:[
  { t:'打开「数据集」页，把 4 张表的字段和说明读一遍，弄清每张表一行代表什么', link:'#/data' },
  { t:'做「能力雷达」自评（9 维），先知道自己起点在哪', link:'#/radar' },
  { t:'SQL 训练场 L1：做完第 1-2 题（基础筛选与计数）', link:'#/sql' }
]},
{ day:2, phase:'打地基', title:'SQL 基础查询', time:'50 分钟', tasks:[
  { t:'SQL 训练场 L1 剩下 3 题全部做完（排序、分组入门）', link:'#/sql' },
  { t:'看 Python 案例 c01（读取与体检三件套）并复制代码到本地跑一遍', link:'#/python' },
  { t:'记一条笔记：`WHERE` 和 `HAVING` 的区别是什么', link:'#/sql' }
]},
{ day:3, phase:'打地基', title:'聚合与分组', time:'55 分钟', tasks:[
  { t:'SQL 训练场 L2 第 1-3 题（分组计数、每日新增、DAU 去重）', link:'#/sql' },
  { t:'看 Python 案例 c06（groupby 一次算多指标）', link:'#/python' },
  { t:'重点理解：为什么人数要用 `COUNT(DISTINCT)` 而不是 `COUNT`', link:'#/sql' }
]},
{ day:4, phase:'打地基', title:'占比与分布', time:'50 分钟', tasks:[
  { t:'SQL 训练场 L2 剩余题目做完（占比、消费排行、平均年龄）', link:'#/sql' },
  { t:'看 Python 案例 c05（cut 与 qcut 分层）', link:'#/python' },
  { t:'思考题：如果各层人数极不均衡，该用 cut 还是 qcut？', link:'#/python' }
]},
{ day:5, phase:'打地基', title:'多表关联（重点）', time:'60 分钟', tasks:[
  { t:'SQL 训练场 L3 第 1-2 题（JOIN 基础、渠道付费用户）', link:'#/sql' },
  { t:'看 Python 案例 c07（多表 merge 行数校验）', link:'#/python' },
  { t:'必记：left join 后行数应等于左表行数，变多说明右表键重复', link:'#/python' }
]},
{ day:6, phase:'打地基', title:'JOIN 进阶与数据清洗', time:'55 分钟', tasks:[
  { t:'SQL 训练场 L3 剩余题目做完（ROI、未付费用户、首单转化率）', link:'#/sql' },
  { t:'看 Python 案例 c02（缺失值与重复值）和 c03（日期解析）', link:'#/python' },
  { t:'动手：统计数据集中有多少用户从未登录', link:'#/data' }
]},
{ day:7, phase:'打地基', title:'第一周复盘', time:'40 分钟', tasks:[
  { t:'把错题本里 L1-L3 做错的题全部重做一遍，直到全对', link:'#/sql' },
  { t:'用一句话写下：SQL 里最容易犯的三个错误是什么', link:'#/sql' },
  { t:'完成「常用案例」c01-c07 的"标记已学"', link:'#/python' }
]},

/* ============ 阶段 2 · 核心数据能力（Day 8-14） ============ */
{ day:8, phase:'核心数据能力', title:'窗口函数入门', time:'60 分钟', tasks:[
  { t:'SQL 训练场 L4 第 1-2 题（分组 TopN、帕累托累计占比）', link:'#/sql' },
  { t:'看 Python 案例 c09（transform 组内占比）', link:'#/python' },
  { t:'理解 `ROW_NUMBER` / `RANK` / `DENSE_RANK` 的区别', link:'#/sql' }
]},
{ day:9, phase:'核心数据能力', title:'窗口函数进阶', time:'55 分钟', tasks:[
  { t:'SQL 训练场 L4 剩余题目（复购间隔、城市 Top 用户、累计占比）', link:'#/sql' },
  { t:'看 Python 案例 c13（分组 TopN 与 rank）', link:'#/python' },
  { t:'动手：算出复购用户平均间隔天数', link:'#/sql' }
]},
{ day:10, phase:'核心数据能力', title:'留存分析（运营核心）', time:'60 分钟', tasks:[
  { t:'SQL 训练场 L5 第 1 题（各渠道次日留存率）', link:'#/sql' },
  { t:'看 Python 案例 c11（留存 cohort 标准写法）并复制到本地跑', link:'#/python' },
  { t:'必记：分母要排除"观察期不足"的用户，否则留存率被低估', link:'#/python' }
]},
{ day:11, phase:'核心数据能力', title:'漏斗与转化', time:'50 分钟', tasks:[
  { t:'SQL 训练场 L5 第 2 题（四级漏斗）', link:'#/sql' },
  { t:'看 Python 案例 c12（漏斗转化率）', link:'#/python' },
  { t:'动手：写出"注册→登录→互动→付费"各环节流失最大的是哪一步', link:'#/sql' }
]},
{ day:12, phase:'核心数据能力', title:'单位经济与变现', time:'55 分钟', tasks:[
  { t:'SQL 训练场 L5 剩余题目（ARPPU、7 日留存）', link:'#/sql' },
  { t:'看 Python 案例 c15（卡方检验判断 A/B 显著性）', link:'#/python' },
  { t:'必记：ARPU 分母是全体用户，ARPPU 分母是付费用户，不能混用', link:'#/sql' }
]},
{ day:13, phase:'核心数据能力', title:'SQL 训练场通关', time:'60 分钟', tasks:[
  { t:'错题本清零：把 L4-L5 所有错题重做一遍', link:'#/sql' },
  { t:'确认「一次做对率」不低于 60%，低于就重点复习错题', link:'#/sql' },
  { t:'看 Python 案例 c14（相关性分析）', link:'#/python' }
]},
{ day:14, phase:'核心数据能力', title:'第二周复盘 + 时间序列', time:'50 分钟', tasks:[
  { t:'看 Python 案例 c10（按月聚合与环比）和 c17（重采样与移动平均）', link:'#/python' },
  { t:'动手：用 SQL 算出各渠道的 7 日留存率并与次日留存对比', link:'#/sql' },
  { t:'写一段 200 字总结：留存分析里最容易犯的错是什么', link:'#/python' }
]},

/* ============ 阶段 3 · 业务分析能力（Day 15-21） ============ */
{ day:15, phase:'业务分析能力', title:'从写 SQL 到做分析', time:'60 分钟', tasks:[
  { t:'数据集实验室 lab01（抖音渠道的用户质量到底差在哪）', link:'#/lab' },
  { t:'先自己写 SQL 找答案，再看参考分析路径对照', link:'#/lab' },
  { t:'在「我的结论」里写 3-5 句，保存', link:'#/lab' }
]},
{ day:16, phase:'业务分析能力', title:'渠道决策', time:'55 分钟', tasks:[
  { t:'数据集实验室 lab02（预算砍半该砍哪个渠道）', link:'#/lab' },
  { t:'了解 LTV / CAC 的健康区间（<1 亏钱、1-3 打平、>3 可放量）', link:'#/lab' },
  { t:'动手：算出 LTV/CAC 最高和最低的渠道各是哪个', link:'#/lab' }
]},
{ day:17, phase:'业务分析能力', title:'留存诊断与用户分层', time:'60 分钟', tasks:[
  { t:'数据集实验室 lab03（留存诊断）与 lab07（用户四象限分层）', link:'#/lab' },
  { t:'动手：算出各象限人数，并给每层写一个运营动作', link:'#/lab' },
  { t:'注意：样本量太小的分组不要下结论（用 HAVING 过滤）', link:'#/lab' }
]},
{ day:18, phase:'业务分析能力', title:'指标体系设计', time:'60 分钟', tasks:[
  { t:'指标设计工坊 m01（作者生态健康度）与 m02（新用户激活）', link:'#/metrics' },
  { t:'重点理解：什么是虚荣指标、存量指标、不可归因指标', link:'#/metrics' },
  { t:'动手：为一个你熟悉的业务写出「北极星 + 一级 + 二级」指标树', link:'#/metrics' }
]},
{ day:19, phase:'业务分析能力', title:'指标体系进阶', time:'55 分钟', tasks:[
  { t:'指标设计工坊 m03（渠道投放）与 m04（会员订阅）', link:'#/metrics' },
  { t:'做剩下的 m05-m08，把 8 道题全部通过', link:'#/metrics' },
  { t:'必记：好指标的标准是"可行动 + 可比 + 能预警"', link:'#/metrics' }
]},
{ day:20, phase:'业务分析能力', title:'实验分析（A/B）', time:'60 分钟', tasks:[
  { t:'实验分析训练 a01-a03（显著性决策、不显著怎么办、分层异质性）', link:'#/abtest' },
  { t:'必记：主指标显著 ≠ 可以上线，必须先看护栏指标', link:'#/abtest' },
  { t:'认识 peeking：为凑显著而延长实验会推高假阳性', link:'#/abtest' }
]},
{ day:21, phase:'业务分析能力', title:'实验分析进阶 + 第三周复盘', time:'60 分钟', tasks:[
  { t:'实验分析训练 a04-a09 全部做完（统计≠业务显著、新奇效应、AA 校验、分流质量、指标冲突）', link:'#/abtest' },
  { t:'再用 Python 案例 c15 亲手算一次卡方检验', link:'#/python' },
  { t:'写一段 200 字总结：实验判读最容易踩的三个坑', link:'#/abtest' }
]},

/* ============ 阶段 4 · 产品与实战（Day 22-30） ============ */
{ day:22, phase:'产品与实战', title:'Case 拆解（面试高频）', time:'60 分钟', tasks:[
  { t:'Case 拆解训练 c01（头部作者流失率上升）', link:'#/case' },
  { t:'严格按 6 步框架写：定义问题→列假设→设计验证→定位根因→给方案→验证方案', link:'#/case' },
  { t:'必记：跳过"列假设"直接给方案，是面试最大的减分项', link:'#/case' }
]},
{ day:23, phase:'产品与实战', title:'Case 拆解进阶', time:'60 分钟', tasks:[
  { t:'再做 c02（渠道次留跳变）与 c03（付费率连降）', link:'#/case' },
  { t:'重点体会：怎么区分"真信号"和"假信号"（口径/埋点问题）', link:'#/case' },
  { t:'做完剩余 c04-c07', link:'#/case' }
]},
{ day:24, phase:'产品与实战', title:'AI 产品能力（转型关键）', time:'60 分钟', tasks:[
  { t:'看「AI 产品经理」→ 能力对照，明确自己 4 项可迁移优势 + 4 项待补能力', link:'#/aipm' },
  { t:'AI PM 判读题 p01-p03（AI 适用性、RICE 优先级、验收标准）', link:'#/aipm' },
  { t:'必记：能用确定性代码解决的事，绝不要用模型', link:'#/aipm' }
]},
{ day:25, phase:'产品与实战', title:'AI 产品能力进阶', time:'60 分钟', tasks:[
  { t:'AI PM 判读题 p04-p07（技术选型、幻觉治理、成本测算、PRD 结构）', link:'#/aipm' },
  { t:'动手：算一次 token 成本（输入单价 + 输出单价 × 调用次数）', link:'#/aipm' },
  { t:'做 p08-p10（AI 指标、转型路径、向上沟通）', link:'#/aipm' }
]},
{ day:26, phase:'产品与实战', title:'PRD 实战', time:'70 分钟', tasks:[
  { t:'AI PM → PRD 工坊 prd1（AI 周报 PRD 骨架）', link:'#/aipm' },
  { t:'重点写「不做什么」和「异常与边界」——这两块最能体现功力', link:'#/aipm' },
  { t:'对照参考 PRD 检查自己漏了哪些模块', link:'#/aipm' }
]},
{ day:27, phase:'产品与实战', title:'PRD 进阶 + Agent 提效', time:'70 分钟', tasks:[
  { t:'完成 prd2（AI 客服 PRD，含幻觉兜底）与 prd3（模型选型与成本）', link:'#/aipm' },
  { t:'AI Agent 实操 → 提效计算器：算清你的自动化收益（含审核与维护成本）', link:'#/agent' },
  { t:'看 Agent 的 4 个实操任务，评估自己能做到第几步', link:'#/agent' }
]},
{ day:28, phase:'产品与实战', title:'面试准备（一）', time:'60 分钟', tasks:[
  { t:'AI PM → 面试题库：开场与转型 3 题，每题先自己说一遍再看参考', link:'#/aipm' },
  { t:'重点准备"你没产品经验凭什么做 PM"——这题决定面试走向', link:'#/aipm' },
  { t:'完成 PRD 工坊 prd4（灰度与评测方案）', link:'#/aipm' }
]},
{ day:29, phase:'产品与实战', title:'面试准备（二）', time:'60 分钟', tasks:[
  { t:'面试题库：产品与需求 4 题 + AI 技术理解 4 题', link:'#/aipm' },
  { t:'面试题库：数据与实验 3 题 + 项目与协作 3 题 + 反问环节', link:'#/aipm' },
  { t:'把自己最没把握的 3 题标记出来，面试前重点看', link:'#/aipm' }
]},
{ day:30, phase:'产品与实战', title:'复盘与出师', time:'60 分钟', tasks:[
  { t:'重新做一次「能力雷达」自评，与 Day 1 对比看进步', link:'#/radar' },
  { t:'检查各模块进度：SQL 31 题、实验室 12、指标 8、实验 9、Case 7、AI PM 10+4+18', link:'#/home' },
  { t:'整理 3 个可讲的项目/分析案例，写成 300 字面试话术', link:'#/case' },
  { t:'导出数据集 CSV，尝试在自己的 Jupyter 里复现一次留存分析', link:'#/data' }
]}
];
