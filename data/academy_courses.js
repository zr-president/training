/* 学习学院 · 课程大纲（11 门课 / 59 个单元）

   为什么单独一个文件：
   之前我犯的错是把「一个领域的入门知识」当成「一个单元」就结束了 ——
   结果是每个领域只有一层皮毛。正确结构应该是：
     领域 → 课程（course）→ 单元（unit）序列，由浅入深，后一个假定前一个已掌握。

   所以这里定义 11 门课与它们的单元清单；
   已经写全内容的单元放在 data/academy.js 的 units 里（目前 2 个），
   其余在 courses[].units 里标 status:'outline'（大纲已定、内容未写）。

   status 约定：
     'ready'   —— 内容已写全（7 步齐全），可以学
     'outline' —— 只有标题与目标，内容未写
     'planned' —— 连单元都还没拆，只在路线里占位

   depth 约定：入门 / 进阶 / 实战 —— 标的是「在整门课里的位置」，不是难度评级 */

var ACADEMY_COURSES = [

/* ===================== L2 求职主线 ===================== */
{
  id: 'biz',
  layer: 'L2',
  name: '经营分析',
  goal: '从「看数字」到「能给出可执行的经营结论」，能在面试里讲清一次完整的经营诊断',
  why: '你的主投方向 A。已有平安经营分析与网点分层经历，缺的是把经验讲成方法论。',
  units: [
    { id: 'biz01', title: '口径与经营树：为什么两个报表能差 30%', depth: '入门', status: 'ready',
      goal: '画得出 GMV → 净收入 → 毛利 → 贡献额 四层，能把两个口径的差额拆成可解释的几块' },
    { id: 'biz02', title: '异常拆解：从「跌了 5%」到「哪个维度跌了」', depth: '入门', status: 'outline',
      goal: '拿到一个「总量跌了」的问题，能在 20 分钟内拆出 3 个以上可验证假设并排出优先级' },
    { id: 'biz03', title: '归因与对照：怎么证明是你的功劳', depth: '进阶', status: 'outline',
      goal: '区分「同期上涨」与「你的动作带来的上涨」，写得出一个站得住的归因口径' },
    { id: 'biz04', title: '预算与资源分配：钱该往哪投', depth: '进阶', status: 'outline',
      goal: '用边际收益而不是历史占比分配预算，并能说明为什么不给「表现最好的那个」加钱' },
    { id: 'biz05', title: '复盘与汇报：三分钟讲清一个季度', depth: '实战', status: 'outline',
      goal: '把一季度的数据、判断、动作、结果压缩成「结论先行 + 三个证据 + 下一步」' },
    { id: 'biz06', title: '综合实战：一份完整经营分析报告', depth: '实战', status: 'outline',
      goal: '独立产出 3 页报告：现状 / 归因 / 建议，每页有图、有口径、有局限说明' }
  ]
},
{
  id: 'ch',
  layer: 'L2',
  name: '商业化与渠道',
  goal: '能判断「这个增长是不是我们创造的」，能算清一个渠道到底该不该继续投',
  why: '你的主投方向 B。渠道增长项目是真经历，但单位经济与增量评估是面试高频考点。',
  units: [
    { id: 'ch01', title: '单位经济：LTV 与 CAC 的真实算法', depth: '入门', status: 'outline',
      goal: '算得出一个渠道的 LTV/CAC，并说清这个比值在什么条件下会失效' },
    { id: 'ch02', title: '渠道质量分层：为什么「量大」不等于「好」', depth: '入门', status: 'outline',
      goal: '用留存、付费率、成本三个维度给渠道分层，而不是只看新增量' },
    { id: 'ch03', title: '预算分配：边际收益递减怎么算', depth: '进阶', status: 'outline',
      goal: '解释为什么「ROI 最高的渠道」不该拿走全部预算' },
    { id: 'ch04', title: '增量评估：AB 与断点回归的适用边界', depth: '进阶', status: 'outline',
      goal: '说清什么场景能用 AB、什么场景只能做准实验、什么场景只能承认无法归因' },
    { id: 'ch05', title: '归因与渠道冲突：一笔订单算谁的', depth: '进阶', status: 'outline',
      goal: '列出 4 种常见归因规则的差异，并说明对预算决策的影响' },
    { id: 'ch06', title: '综合实战：一份渠道预算方案', depth: '实战', status: 'outline',
      goal: '产出可执行方案：分渠道预算、预期增量、停止条件、风险' }
  ]
},
{
  id: 'data',
  layer: 'L2',
  name: '数据与实验',
  goal: 'SQL 现场能写、实验能判读、结论不被统计陷阱带偏',
  why: '经营分析与商业化岗都要求 SQL 熟练 + 能判断实验结论。你有 SQL 基础，缺的是粒度与陷阱意识。',
  units: [
    { id: 'db01', title: 'SQL 粒度：为什么 join 之后行数变了', depth: '入门', status: 'outline',
      goal: '看到行数变化能立刻定位是「一对多」还是「过滤条件」导致的' },
    { id: 'db02', title: '指标一致性：同名不同口径', depth: '入门', status: 'outline',
      goal: '能识别两个报表同名指标的口径差异，并写清统一定义' },
    { id: 'db03', title: '实验设计：分流、样本量、护栏指标', depth: '进阶', status: 'outline',
      goal: '给一个业务问题，能说清怎么分流、需要多少样本、护栏看什么' },
    { id: 'db04', title: '实验判读：peeking、多重比较', depth: '进阶', status: 'outline',
      goal: '解释为什么「每天看一次显著性」会让假阳性变多' },
    { id: 'db05', title: '常见统计陷阱：辛普森悖论与均值回归', depth: '进阶', status: 'outline',
      goal: '看到一个「分群与总体结论相反」的数据，能说出原因' },
    { id: 'db06', title: '综合实战：一次实验复盘', depth: '实战', status: 'outline',
      goal: '产出复盘：假设、设计、结果、结论、局限、下一步' }
  ]
},

/* ===================== L1 决策素养 ===================== */
{
  id: 'fin',
  layer: 'L1',
  name: '金融',
  goal: '看得懂财经新闻里的数字，能独立判断「贵不贵」和「该配多少」',
  why: '你明确说过「关于股票、基金的持有，相关的概念和一些指数我都看不懂」。这门课就是补这个。',
  units: [
    { id: 'fin01', title: '指数与估值：为什么「上证涨了」不等于你赚钱了', depth: '入门', status: 'ready',
      goal: '说清点位不是价格、两个指数为什么涨跌不同、用 PE 分位数而不是绝对值判断贵不贵' },
    { id: 'fin02', title: '货币、利率、通胀：钱为什么会「变毛」', depth: '入门', status: 'outline',
      goal: '说清利率与通胀的关系，以及为什么降准不必然降息' },
    { id: 'fin03', title: '资产类别：股 / 债 / 现金 / 黄金 / 房产', depth: '入门', status: 'outline',
      goal: '说清五类资产各自赚的是什么钱、在什么环境下会亏' },
    { id: 'fin04', title: '基金：主动 vs 被动、ETF 与费率', depth: '进阶', status: 'outline',
      goal: '算得出一只基金的真实持有成本（管理费+托管费+申赎+跟踪误差）' },
    { id: 'fin05', title: '估值进阶：PE / PB / 股息率 / 分位数', depth: '进阶', status: 'outline',
      goal: '能判断「当前估值处于历史什么位置」，而不是只看 PE 数字高低' },
    { id: 'fin06', title: '债券与利率风险：为什么降息时债券会涨', depth: '进阶', status: 'outline',
      goal: '说清久期与利率变动的关系，以及「债券也会亏」的机制' },
    { id: 'fin07', title: '汇率与海外资产：换汇那点事', depth: '进阶', status: 'outline',
      goal: '说清汇率变动怎么影响海外资产的收益，以及换汇成本' },
    { id: 'fin08', title: '综合实战：把钱分成几份', depth: '实战', status: 'outline',
      goal: '产出一份自己的资产配置草案：比例、理由、什么情况下调整' }
  ]
},
{
  id: 'tax',
  layer: 'L1',
  name: '税法与到手工资',
  goal: '搞清自己每个月被扣了什么，以及跳槽/离职时能拿多少',
  why: '你已经在领工资，但这四项（五险一金、个税、扣除、年终奖）大多数人说不清。',
  units: [
    { id: 'tax01', title: '五险一金：基数怎么定、扣多少', depth: '入门', status: 'outline',
      goal: '算出自己的社保公积金口径，并说清「基数按下限缴」对未来的影响' },
    { id: 'tax02', title: '个税：税率表与速算扣除', depth: '入门', status: 'outline',
      goal: '用手算出一个月的个税，理解「累计预扣」为什么会让后期到手变少' },
    { id: 'tax03', title: '专项附加扣除：你能扣哪些', depth: '入门', status: 'outline',
      goal: '列全自己符合条件的扣除项，算出一年能省多少' },
    { id: 'tax04', title: '年终奖计税与「跳档」', depth: '进阶', status: 'outline',
      goal: '说清年终奖单独计税的临界点，以及为什么多发 1 元可能少拿几千' },
    { id: 'tax05', title: '离职补偿与股权激励的税', depth: '进阶', status: 'outline',
      goal: '算清 N+1 的免税额度，说清期权行权的纳税时点' },
    { id: 'tax06', title: '综合实战：算一次自己真实的到手与离职账', depth: '实战', status: 'outline',
      goal: '用自己真实的月薪与年限，算出本月到手、年度总税负、以及如果现在离职能拿多少' }
  ]
},
{
  id: 'ins',
  layer: 'L1',
  name: '保险',
  goal: '知道该买什么、不该买什么，以及为什么 26 岁是费率最低的窗口',
  why: '保险是典型的「条款看不懂就买了错的」，而错的保险比没保险更贵。',
  units: [
    { id: 'ins01', title: '医疗险与重疾险：边界在哪', depth: '入门', status: 'outline',
      goal: '说清两者赔什么、能不能互相替代、为什么通常都要' },
    { id: 'ins02', title: '意外险与寿险：谁需要', depth: '入门', status: 'outline',
      goal: '判断自己现阶段需不需要寿险，以及保额怎么定' },
    { id: 'ins03', title: '免赔额 / 赔付比例 / 等待期 / 保证续保', depth: '进阶', status: 'outline',
      goal: '拿到一份条款能圈出这四项，并判断它是否适合自己' },
    { id: 'ins04', title: '26 岁的配置顺序', depth: '实战', status: 'outline',
      goal: '产出一份自己的保障清单：买什么、保额多少、预算上限' }
  ]
},
{
  id: 'health',
  layer: 'L1',
  name: '健康与代谢',
  goal: '在「热量 + 蛋白」之上，理解血糖、纤维、睡眠与平台期',
  why: '你已有健身与饮食基础（体脂 12-14%、热量 2600/2400、蛋白 130-140g），需要补的是代谢层。',
  units: [
    { id: 'he01', title: '血糖与胰岛素：为什么「不胖但容易累」', depth: '入门', status: 'outline',
      goal: '说清血糖波动与进食顺序、精制碳水的关系' },
    { id: 'he02', title: '膳食纤维与肠道', depth: '入门', status: 'outline',
      goal: '说出可溶/不可溶纤维的作用差异，以及每天大概需要多少' },
    { id: 'he03', title: '微量营养素：最容易缺的几种', depth: '进阶', status: 'outline',
      goal: '列出自己饮食结构里可能缺的 2-3 项，以及怎么从食物补' },
    { id: 'he04', title: '睡眠：周期、光照与咖啡因半衰期', depth: '进阶', status: 'outline',
      goal: '算清自己睡前多久不该摄入咖啡因，并说清光照为什么影响入睡' },
    { id: 'he05', title: '平台期：为什么体重不动了', depth: '实战', status: 'outline',
      goal: '区分「真平台」与「水分波动」，并给出调整顺序' }
  ]
},
{
  id: 'rel',
  layer: 'L1',
  name: '亲密关系与沟通',
  goal: '把「表达需求」和「指责对方」分开，能处理冲突而不是回避',
  why: '最少人教、对生活质量影响最大。求职期压力大时，这一块最容易被忽略也最容易出问题。',
  units: [
    { id: 're01', title: '非暴力沟通四步：观察 / 感受 / 需要 / 请求', depth: '入门', status: 'outline',
      goal: '把一句抱怨改写成一句可回应的请求' },
    { id: 're02', title: '边界：什么是我的事，什么是他的事', depth: '入门', status: 'outline',
      goal: '识别「我在替别人承担情绪」的场景，并说出一句设定边界的话' },
    { id: 're03', title: '冲突处理：从对抗到共同问题', depth: '进阶', status: 'outline',
      goal: '在分歧中把「你 vs 我」转成「我们 vs 问题」' },
    { id: 're04', title: '依恋类型与自我认识', depth: '进阶', status: 'outline',
      goal: '说清自己的默认模式，以及它在压力下的表现' },
    { id: 're05', title: '综合实战：把一次真实的对话重写一遍', depth: '实战', status: 'outline',
      goal: '拿一段自己最近没说好的对话，按非暴力沟通四步重写，并写下如果重来会怎么说' }
  ]
},

/* ===================== L0 元能力 ===================== */
{
  id: 'stat',
  layer: 'L0',
  name: '统计直觉',
  goal: '看到数字与结论时，能第一反应问「这个比较公平吗」',
  why: '你有经济统计学本科底子 —— 这是你最大的存量优势，但要用到日常判断而不是只做报表。',
  units: [
    { id: 'st01', title: '基准率：为什么「准确率 99%」也可能是坏消息', depth: '入门', status: 'outline',
      goal: '用一个 2×2 表算出「阳性中真正有问题的比例」，理解为什么它常被忽视' },
    { id: 'st02', title: '回归均值：为什么「连续三次第一」多半会回落', depth: '入门', status: 'outline',
      goal: '区分「真的变差」与「只是回归均值」，避免错误归因' },
    { id: 'st03', title: '幸存者偏差：你看到的样本怎么被筛过', depth: '入门', status: 'outline',
      goal: '看到一个成功案例时，能问出「失败的那些去哪了」' },
    { id: 'st04', title: '辛普森悖论：分群与总体结论为什么相反', depth: '进阶', status: 'outline',
      goal: '给出一个分群与总体方向相反的例子，并说明该信哪个' },
    { id: 'st05', title: '置信区间：怎么读新闻里的百分比', depth: '进阶', status: 'outline',
      goal: '判断一个「上升 3%」的结论是否可能只是噪声' },
    { id: 'st06', title: '综合实战：用最近一个月看过的 3 条新闻做体检', depth: '实战', status: 'outline',
      goal: '挑 3 条带数字的新闻，逐条指出它的样本、比较对象、可能的基准率问题' }
  ]
},
{
  id: 'logic',
  layer: 'L0',
  name: '逻辑与论证',
  goal: '做策略分析时不被「听起来有道理」带走，能构造站得住的论证',
  why: '这是策略分析的底层能力，比任何工具都重要，而且在面试追问时直接暴露。',
  units: [
    { id: 'lo01', title: '必要 vs 充分条件：面试最常被问倒的逻辑', depth: '入门', status: 'outline',
      goal: '区分「A 需要 B」与「有 B 就够」，并能指出别人混淆的地方' },
    { id: 'lo02', title: '相关不等于因果：三种替代解释', depth: '入门', status: 'outline',
      goal: '看到相关性时，能列出共同原因、反向因果、选择偏差三种可能' },
    { id: 'lo03', title: '常见形式谬误', depth: '进阶', status: 'outline',
      goal: '识别肯定后件、否定前件、以偏概全、稻草人四种' },
    { id: 'lo04', title: '反例的力量：怎么反驳一个论断', depth: '进阶', status: 'outline',
      goal: '构造一个有效反例，而不是用「我觉得」反驳' },
    { id: 'lo05', title: '构造一个能站住的论证', depth: '实战', status: 'outline',
      goal: '写出「主张 / 依据 / 推理 / 反方 / 局限」五段，并接受挑错' }
  ]
},
{
  id: 'sys',
  layer: 'L0',
  name: '系统思维',
  goal: '解释「为什么很多措施做了但没效果」，并能找到真正的杠杆点',
  why: '经营分析的深层能力：单点归因容易，看清回路与延迟很难。',
  units: [
    { id: 'sy01', title: '存量与流量：为什么「每月新增」不等于「总用户」', depth: '入门', status: 'outline',
      goal: '用浴缸模型解释存量变化，并说清什么时候该看流量、什么时候看存量' },
    { id: 'sy02', title: '反馈回路：正反馈与负反馈', depth: '入门', status: 'outline',
      goal: '在一个业务现象里画出至少一条正反馈和一条负反馈' },
    { id: 'sy03', title: '延迟：为什么措施三个月后才见效', depth: '进阶', status: 'outline',
      goal: '说清延迟如何导致「过度调整」与「归因错误」' },
    { id: 'sy04', title: '局部最优与全局最优', depth: '进阶', status: 'outline',
      goal: '举出一个「每个部门都在做最优选择，整体却变差」的例子' },
    { id: 'sy05', title: '系统杠杆点：在哪里下手最省力', depth: '实战', status: 'outline',
      goal: '给一个真实问题，能指出 3 个杠杆点并排序' }
  ]
}
];

if (typeof module !== 'undefined' && module.exports) module.exports = ACADEMY_COURSES;
