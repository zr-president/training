// 数据集实验室 · 业务问题集（用户增长域）
// 与 SQL 训练场的区别：训练场是「按需求写 SQL」（有唯一答案）；
// 实验室是「给你一个业务问题，自己去数据里找答案」（无唯一答案，但有参考分析路径）。
// 每题：question=业务问题  context=背景  deliverable=要交付什么结论
//       steps=分析步骤提示  queries=参考分析路径(可运行SQL+关键发现)  conclusion=参考结论

var LAB_QUESTIONS = [

{
  id:'lab01', icon:'📉', tag:'渠道质量',
  title:'抖音渠道的用户质量到底差在哪？',
  question:'抖音占了最多的投放预算。运营总监问你：这个渠道的用户到底行不行？用数据说明。',
  context:'渠道评估最大的误区是只看拉新量。必须把「量」和「质」拆开看——质包括留存（愿不愿意回来）、活跃（用得深不深）、付费（愿不愿意掏钱）。',
  deliverable:'一张各渠道对比表 + 一句话结论：抖音是"量大利薄"还是"物有所值"？',
  steps:[
    '第一步：先看量——各渠道各拉来多少人（确认抖音确实是量最大的）',
    '第二步：再看质——次日留存率（愿不愿意回来）',
    '第三步：看付费——付费用户数与付费率',
    '第四步：算单位经济——人均贡献收入（LTV）',
    '第五步：横向对比，找出抖音最短板的那一项'
  ],
  queries:[
    { t:'① 各渠道"量 × 质"总览（留存/付费/人均收入一次看清）',
      sql:`SELECT u.channel,
  COUNT(DISTINCT u.user_id)                                          AS users,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2)       AS d1_rate,
  COUNT(DISTINCT o.user_id)                                          AS pay_users,
  ROUND(COUNT(DISTINCT o.user_id)*100.0/COUNT(DISTINCT u.user_id),2) AS pay_rate,
  ROUND(SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id),2)               AS ltv
FROM users u
LEFT JOIN events e ON u.user_id=e.user_id
LEFT JOIN orders o ON o.user_id=u.user_id
WHERE u.register_date < '2026-09-10'
GROUP BY u.channel
ORDER BY users DESC`,
      finding:'抖音 users 最多，但 d1_rate、pay_rate、ltv 三项都排在末尾——典型的"量大质低"。' },
    { t:'② 抖音 vs 朋友推荐：一对一硬碰硬',
      sql:`SELECT CASE WHEN u.channel='抖音' THEN '抖音' ELSE '朋友推荐' END AS channel,
  COUNT(DISTINCT u.user_id)                                    AS users,
  ROUND(SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id),2)         AS ltv,
  ROUND(SUM(o.amount),2)                                       AS revenue
FROM users u
LEFT JOIN orders o ON o.user_id=u.user_id
WHERE u.channel IN ('抖音','朋友推荐')
GROUP BY 1`,
      finding:'朋友推荐用几乎为零的成本，拿到了更高的 LTV——质量差距一目了然。' }
  ],
  conclusion:'抖音是"量大质低"：拉新量第一，但次日留存、付费率、人均贡献收入三项垫底，且获客成本最高。结论：不能因为"量最大"就继续加预算——它的单位经济最差，是**最该被审视的渠道**。专业做法是把结论落到"量×质×成本"三维上，而不是只报一个拉新数。'
},

{
  id:'lab02', icon:'✂️', tag:'预算决策',
  title:'预算砍半，应该砍哪个渠道？',
  question:'公司要求下季度投放预算砍掉一半。你要给出一个明确的砍法，并说明理由。',
  context:'判断渠道该不该留，业内通用标准是 LTV/CAC：低于 1 = 亏钱买量（越投越亏）；1-3 = 打平偏紧；大于 3 = 值得放量。',
  deliverable:'一份"砍/保/加"清单：哪些渠道砍掉、哪些保住、哪些加大投入，各给一句依据。',
  steps:[
    '第一步：算每个付费渠道的 LTV（人均贡献收入）',
    '第二步：算每个渠道的 CAC（人均获客成本 = 渠道成本 / 该渠道注册用户数）',
    '第三步：算 LTV/CAC，按比值排序',
    '第四步：LTV/CAC < 1 的直接砍；1-3 的优化后再看；> 3 的加投',
    '第五步：注意自然流量渠道（朋友推荐 cost=0）——它的 CAC 近乎为零，是"免费的高质量供给"，要保护而不是砍'
  ],
  queries:[
    { t:'① 渠道单位经济模型（LTV / CAC / 比值）',
      sql:`SELECT c.channel,
  COUNT(DISTINCT u.user_id)                                          AS users,
  c.cost,
  ROUND(SUM(o.amount),2)                                             AS revenue,
  ROUND(SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id),2)               AS ltv,
  ROUND(c.cost*1.0/COUNT(DISTINCT u.user_id),2)                      AS cac,
  ROUND((SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id))
        /(c.cost*1.0/COUNT(DISTINCT u.user_id)),2)                   AS ltv_cac
FROM channels c
JOIN users u ON u.channel=c.channel
JOIN orders o ON o.user_id=u.user_id
WHERE c.cost>0
GROUP BY c.channel, c.cost
ORDER BY ltv_cac DESC`,
      finding:'按 LTV/CAC 排序后，能清楚看到哪些渠道在"亏钱买量"，哪些值得加码。' },
    { t:'② 各渠道花掉的钱 vs 挣回的钱（看绝对缺口）',
      sql:`SELECT c.channel, c.cost AS spend,
  ROUND(COALESCE(SUM(o.amount),0),2) AS revenue,
  ROUND(COALESCE(SUM(o.amount),0)-c.cost,2) AS profit
FROM channels c
LEFT JOIN users u ON u.channel=c.channel
LEFT JOIN orders o ON o.user_id=u.user_id
GROUP BY c.channel, c.cost
ORDER BY profit DESC`,
      finding:'绝对缺口比比值更直观：哪些渠道是净亏，一眼可见。' }
  ],
  conclusion:'砍法应该是"砍比值最低的、保零成本的、优化中间地带的"。具体判断逻辑：LTV/CAC 明显低于 1 的渠道（典型是抖音这类量大质低的）优先砍；朋友推荐零成本高留存必须保住并想办法放大；1-3 之间的渠道先做优化实验（改素材/改落地页/换人群包）再决定去留。**关键：结论要落到具体渠道名 + 数字，不能只说"优化投放结构"。**'
},

{
  id:'lab03', icon:'🔍', tag:'留存诊断',
  title:'新用户为什么第二天就不来了？',
  question:'次日留存上不去。你要找出"哪一类新用户"掉得最狠，而不是笼统地说"留存差"。',
  context:'留存诊断的核心是**拆维度**：把整体留存率拆成"渠道 × 城市 × 年龄"，找出留存洼地。整体数字只是结果，细分才能定位原因。',
  deliverable:'找出 2-3 个留存最低的细分人群（渠道/城市/年龄），并说明它们有什么共同特征。',
  steps:[
    '第一步：先确认整体次日留存基线（有对比才有判断）',
    '第二步：按渠道拆——哪个渠道的新用户最容易走',
    '第三步：按年龄段拆——年轻人还是年长者更留得住',
    '第四步：按城市拆——一线和新一线的差异',
    '第五步：交叉看（渠道 × 年龄），找"双重劣势"的人群'
  ],
  queries:[
    { t:'① 整体次日留存基线',
      sql:`SELECT COUNT(DISTINCT u.user_id) AS cohort,
  COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END) AS d1_users,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2) AS d1_rate
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
WHERE u.register_date < '2026-09-10'`,
      finding:'先拿到基线数字，后面所有细分都跟它比。' },
    { t:'② 按年龄段拆次日留存',
      sql:`SELECT CASE WHEN u.age<22 THEN '18-21'
              WHEN u.age<26 THEN '22-25'
              WHEN u.age<30 THEN '26-29'
              ELSE '30+' END AS age_group,
  COUNT(DISTINCT u.user_id) AS cohort,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2) AS d1_rate
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
WHERE u.register_date < '2026-09-10'
GROUP BY age_group
ORDER BY d1_rate DESC`,
      finding:'年龄段之间的留存差距，往往指向内容调性或引导流程不适配。' },
    { t:'③ 渠道 × 年龄段交叉（找双重劣势人群）',
      sql:`SELECT u.channel,
  CASE WHEN u.age<24 THEN '18-23' ELSE '24+' END AS age_group,
  COUNT(DISTINCT u.user_id) AS cohort,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2) AS d1_rate
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
WHERE u.register_date < '2026-09-10'
GROUP BY u.channel, age_group
HAVING cohort >= 15
ORDER BY d1_rate ASC`,
      finding:'HAVING cohort>=15 过滤掉样本太小的分组——样本不够的结论不可信，这是分析纪律。' }
  ],
  conclusion:'结论要具体到"哪类人"。典型发现：抖音渠道的年轻用户留存最低（渠道本身质量差 + 年轻用户注意力分散双重叠加）。**注意两点分析纪律**：①样本量太小的分组不下结论（用 HAVING 过滤）；②留存差通常是"渠道质量"和"产品体验"共同作用，要区分是"人不合适"还是"体验不好"。'
},

{
  id:'lab04', icon:'🏙️', tag:'资源投放',
  title:'哪个城市值得做线下活动？',
  question:'有一笔线下活动预算，只能选一个城市。怎么用数据选出最优解？',
  context:'线下活动的价值 = 用户密度（能来多少人）× 用户质量（值不值得维护）。只看哪个城市人多是不够的。',
  deliverable:'给出推荐城市 + 排名依据（至少包含用户规模、活跃度、付费能力三个维度）。',
  steps:[
    '第一步：看各城市用户规模（能触达多少人）',
    '第二步：看活跃度（人均活跃天数——用户是否真的在用）',
    '第三步：看付费能力（付费率与人均消费）',
    '第四步：综合排序，选出密度和质量双高的城市',
    '第五步：注意样本量——用户太少的城市即使指标高也不稳定'
  ],
  queries:[
    { t:'① 城市三维评估（规模 / 活跃 / 付费）',
      sql:`SELECT u.city,
  COUNT(DISTINCT u.user_id) AS users,
  ROUND(AVG(act.active_days),2) AS avg_active_days,
  COUNT(DISTINCT o.user_id) AS pay_users,
  ROUND(COUNT(DISTINCT o.user_id)*100.0/COUNT(DISTINCT u.user_id),2) AS pay_rate,
  ROUND(COALESCE(SUM(DISTINCT o.amount),0),2) AS note_amount
FROM users u
LEFT JOIN (SELECT user_id, COUNT(DISTINCT event_date) AS active_days
           FROM events WHERE event_type='login' GROUP BY user_id) act ON act.user_id=u.user_id
LEFT JOIN orders o ON o.user_id=u.user_id
GROUP BY u.city
ORDER BY users DESC`,
      finding:'三维一起看，才能避免"人多但都是薅羊毛的"这种误判。' },
    { t:'② 城市人均贡献（质量视角）',
      sql:`SELECT u.city,
  COUNT(DISTINCT u.user_id) AS users,
  ROUND(COALESCE(SUM(o.amount),0),2) AS gmv,
  ROUND(COALESCE(SUM(o.amount),0)*1.0/COUNT(DISTINCT u.user_id),2) AS arpu
FROM users u LEFT JOIN orders o ON o.user_id=u.user_id
GROUP BY u.city
HAVING users >= 20
ORDER BY arpu DESC`,
      finding:'ARPU（人均贡献）比总量更能反映"单个用户值不值钱"；HAVING 剔除小样本。' }
  ],
  conclusion:'选城市的标准是"规模够大 + 人均贡献高"的交集，而不是单纯的用户数排名。**注意 SUM(DISTINCT amount) 在这类多表聚合里可能重复计数——真实工作中更稳的写法是先按用户聚合再汇总**（这个坑值得你自己动手验证一下）。另外要明确说清推荐逻辑，而不是给一个城市名就完事。'
},

{
  id:'lab05', icon:'💎', tag:'人群运营',
  title:'找出"高潜力未付费"人群并给转化策略',
  question:'有一批用户很活跃但从不付费。他们是谁？有多大规模？该怎么做转化？',
  context:'"高活跃未付费"是付费转化实验最该优先做的人群——他们已经有使用深度（说明产品有价值），缺的只是付费理由或触发点。相比冷启动用户，转化成本低得多。',
  deliverable:'人群规模 + 画像特征（渠道/城市/年龄/活跃度）+ 一条具体的转化策略建议。',
  steps:[
    '第一步：定义"高活跃"——比如活跃天数 ≥ 5 天',
    '第二步：筛出其中从未下过单的人',
    '第三步：看这批人的渠道/城市/年龄分布（找出他们从哪来、是谁）',
    '第四步：估算规模——绝对值多少人、占全站多少比例',
    '第五步：基于画像给转化策略（不是泛泛的"发优惠券"）'
  ],
  queries:[
    { t:'① 高活跃未付费人群规模',
      sql:`SELECT COUNT(*) AS high_active_unpaid
FROM (
  SELECT u.user_id
  FROM users u
  JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  WHERE u.user_id NOT IN (SELECT user_id FROM orders)
  GROUP BY u.user_id
  HAVING COUNT(DISTINCT e.event_date) >= 5
) t`,
      finding:'先量化规模——如果只有几十人，就不值得做大规模实验。' },
    { t:'② 这批人的画像（渠道/城市/年龄）',
      sql:`SELECT u.channel,
  COUNT(*) AS cnt,
  ROUND(AVG(u.age),1) AS avg_age
FROM (
  SELECT u.user_id, u.channel, u.age
  FROM users u
  JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  WHERE u.user_id NOT IN (SELECT user_id FROM orders)
  GROUP BY u.user_id, u.channel, u.age
  HAVING COUNT(DISTINCT e.event_date) >= 5
) u
GROUP BY u.channel
ORDER BY cnt DESC`,
      finding:'看这批人集中在哪些渠道——如果集中在某个渠道，说明该渠道人群有共同的付费卡点。' },
    { t:'③ 对比：已付费用户的活跃度长什么样',
      sql:`SELECT '已付费' AS grp, ROUND(AVG(d),2) AS avg_active_days FROM (
  SELECT u.user_id, COUNT(DISTINCT e.event_date) AS d
  FROM users u JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  WHERE u.user_id IN (SELECT user_id FROM orders)
  GROUP BY u.user_id) a
UNION ALL
SELECT '未付费' AS grp, ROUND(AVG(d),2) FROM (
  SELECT u.user_id, COUNT(DISTINCT e.event_date) AS d
  FROM users u JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  WHERE u.user_id NOT IN (SELECT user_id FROM orders)
  GROUP BY u.user_id) b`,
      finding:'如果未付费用户里有一批活跃度已经接近付费用户，那他们就是最该被转化的"临门一脚"人群。' }
  ],
  conclusion:'输出要包含"多少人 + 是谁 + 怎么转"。策略方向举例：如果这批人活跃度已接近付费用户但迟迟不付费，说明卡点在**付费理由**（价值感知不足）而非体验——适合做"首次体验付费权益 + 限时"的实验；如果卡点在**价格敏感**，则用阶梯定价或小额尝鲜包。**切忌只给"发优惠券"这种没有画像依据的答案。**'
},

{
  id:'lab06', icon:'🚀', tag:'版本评估',
  title:'8/15 版本上线后，用户表现有变化吗？',
  question:'8 月 15 日上线了新版本。老板问：这次改版到底有没有用？',
  context:'版本评估的标准做法是"前后对比"（before/after）：把用户按注册时间切成"改版前"和"改版后"两批，对比关键指标。注意——这不等同于 A/B 实验（没有随机分流），只能说"相关"不能说"因果"。',
  deliverable:'改版前后关键指标对比表 + 结论（有提升/没提升/无法判断，并说明理由）。',
  steps:[
    '第一步：定义前后两批人群（按 register_date 切 8/15）',
    '第二步：对比次日留存（新手体验是否变好）',
    '第三步：对比发帖率（核心行为是否被促进）',
    '第四步：对比付费转化',
    '第五步：特别检查——两批人的渠道结构是否相似？如果不相似，差异可能来自渠道而非版本'
  ],
  queries:[
    { t:'① 改版前后：留存与发帖对比',
      sql:`SELECT CASE WHEN u.register_date < '2026-08-15' THEN '改版前' ELSE '改版后' END AS period,
  COUNT(DISTINCT u.user_id) AS cohort,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2) AS d1_rate,
  COUNT(DISTINCT CASE WHEN e.event_type='post' THEN u.user_id END) AS posters,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='post' THEN u.user_id END)*100.0
        /COUNT(DISTINCT u.user_id),2) AS post_rate
FROM users u
LEFT JOIN events e ON u.user_id=e.user_id
WHERE u.register_date < '2026-09-10'
GROUP BY period`,
      finding:'两批人的 d1_rate / post_rate 差异就是改版效果的第一手证据。' },
    { t:'② 检查可比性：两批人的渠道结构一样吗（关键！）',
      sql:`SELECT CASE WHEN register_date < '2026-08-15' THEN '改版前' ELSE '改版后' END AS period,
  channel, COUNT(*) AS users
FROM users
WHERE register_date < '2026-09-10'
GROUP BY period, channel
ORDER BY period, users DESC`,
      finding:'如果改版后抖音占比明显升高，那指标变化可能主要来自"渠道结构变了"，而不是版本变好了——这就是**辛普森悖论**的现实版。' }
  ],
  conclusion:'结论必须带"可比性检查"。如果两批人渠道结构差异大，就要做**分层对比**（在每个渠道内部比前后），否则会把渠道结构变化误判成版本效果。另外要明确说明：这是前后对比、不是随机实验，**能说"相关"但不能说"因果"**——这个区分是专业度的体现。'
},

{
  id:'lab07', icon:'🗺️', tag:'用户分层',
  title:'用户分层：活跃 × 付费四象限',
  question:'把全站用户按"活跃度"和"是否付费"分成四类。各有多少人？每类该用什么策略？',
  context:'用户分层的意义在于**资源分配**：不可能对所有人做同样的运营。分层后，每一层对应不同的运营动作（拉新/激活/转化/召回）。',
  deliverable:'四象限人数表 + 每一层的运营策略（一句话一个动作）。',
  steps:[
    '第一步：定义"高活跃"阈值（如活跃天数 ≥ 5）',
    '第二步：用 CASE WHEN 打出四个标签',
    '第三步：统计各象限人数与占比',
    '第四步：算出各象限贡献的 GMV（钱主要来自哪一层）',
    '第五步：为每层设计一个运营动作'
  ],
  queries:[
    { t:'① 四象限人数分布',
      sql:`WITH u AS (
  SELECT uu.user_id,
    COUNT(DISTINCT e.event_date) AS active_days,
    CASE WHEN EXISTS (SELECT 1 FROM orders o WHERE o.user_id=uu.user_id) THEN 1 ELSE 0 END AS paid
  FROM users uu
  LEFT JOIN events e ON e.user_id=uu.user_id AND e.event_type='login'
  GROUP BY uu.user_id
)
SELECT CASE WHEN active_days>=5 AND paid=1 THEN 'A 高活·已付费'
            WHEN active_days>=5 AND paid=0 THEN 'B 高活·未付费'
            WHEN active_days<5  AND paid=1 THEN 'C 低活·已付费'
            ELSE 'D 低活·未付费' END AS quadrant,
       COUNT(*) AS users,
       ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM u),2) AS pct
FROM u
GROUP BY quadrant
ORDER BY users DESC`,
      finding:'B 层（高活未付费）通常是最值得投入的转化池；D 层规模最大但最"冷"。' },
    { t:'② 各象限贡献的 GMV（钱从哪来）',
      sql:`WITH u AS (
  SELECT uu.user_id,
    COUNT(DISTINCT e.event_date) AS active_days
  FROM users uu
  LEFT JOIN events e ON e.user_id=uu.user_id AND e.event_type='login'
  GROUP BY uu.user_id
)
SELECT CASE WHEN u.active_days>=5 THEN '高活跃' ELSE '低活跃' END AS act,
  ROUND(COALESCE(SUM(o.amount),0),2) AS gmv,
  COUNT(DISTINCT u.user_id) AS pay_users
FROM u JOIN orders o ON o.user_id=u.user_id
GROUP BY act
ORDER BY gmv DESC`,
      finding:'如果 GMV 高度集中在"高活跃已付费"，说明核心用户盘子小但价值高——策略重点是"保"而不是"拉"。' }
  ],
  conclusion:'分层结论要能直接指导动作：A 层（高活已付费）= 重点维护 + 提客单价（会员/年卡）；B 层（高活未付费）= 转化实验主战场（体验权益+限时）；C 层（低活已付费）= 召回（他们付过钱，最有召回价值）；D 层（低活未付费）= 低成本触达，不投入重资源。**关键洞察：不要平均用力，把资源压到"转化概率×价值"最高的那一层。**'
},

{
  id:'lab08', icon:'📣', tag:'召回策略',
  title:'要做一次 push 唤醒，应该发给谁？',
  question:'要发一次召回 push。全量发会打扰用户、拉低信誉。应该圈出哪批人？规模多大？',
  context:'召回的前提是"定义沉默"：注册过、用过（有登录行为）、但最近一段时间没来。push 是有限资源，要优先发给"还有救"的人。',
  deliverable:'沉默用户定义 + 可触达规模 + 按渠道/城市拆分的优先级建议。',
  steps:[
    '第一步：定义"沉默"——比如最近 7 天（2026-09-04 起）没有登录',
    '第二步：同时要求"曾经活跃过"（至少登录过 1 次），排除注册即流失的',
    '第三步：算出可触达规模',
    '第四步：按渠道拆分（哪些渠道的沉默用户最多）',
    '第五步：按"历史活跃度"再分层——高活跃后沉默的人更值得召回'
  ],
  queries:[
    { t:'① 沉默用户规模（最近 7 天未登录但曾登录过）',
      sql:`SELECT COUNT(DISTINCT u.user_id) AS silent_users
FROM users u
WHERE EXISTS (SELECT 1 FROM events e
              WHERE e.user_id=u.user_id AND e.event_type='login')
  AND NOT EXISTS (SELECT 1 FROM events e2
                  WHERE e2.user_id=u.user_id AND e2.event_type='login'
                    AND e2.event_date >= '2026-09-04')`,
      finding:'EXISTS / NOT EXISTS 是"存在性判断"的标准写法，比 JOIN 去重更安全。' },
    { t:'② 沉默用户按渠道分布（优先级判断）',
      sql:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS silent_users
FROM users u
WHERE EXISTS (SELECT 1 FROM events e
              WHERE e.user_id=u.user_id AND e.event_type='login')
  AND NOT EXISTS (SELECT 1 FROM events e2
                  WHERE e2.user_id=u.user_id AND e2.event_type='login'
                    AND e2.event_date >= '2026-09-04')
GROUP BY u.channel
ORDER BY silent_users DESC`,
      finding:'沉默用户集中的渠道，就是召回资源应该倾斜的方向。' },
    { t:'③ 按历史活跃度给沉默用户分级（谁更值得召回）',
      sql:`SELECT CASE WHEN d >= 10 THEN '高活跃后沉默（优先召回）'
                  WHEN d >= 5  THEN '中活跃后沉默'
                  ELSE '低活跃后沉默' END AS tier,
  COUNT(*) AS users
FROM (
  SELECT u.user_id, COUNT(DISTINCT e.event_date) AS d
  FROM users u
  JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  WHERE NOT EXISTS (SELECT 1 FROM events e2
                    WHERE e2.user_id=u.user_id AND e2.event_type='login'
                      AND e2.event_date >= '2026-09-04')
  GROUP BY u.user_id
) t
GROUP BY tier
ORDER BY users DESC`,
      finding:'"曾经高活跃"说明用户认可过产品价值，召回成功率通常显著高于从未活跃的人。' }
  ],
  conclusion:'召回策略的核心是"分层递进、不要全量轰炸"：优先召回"高活跃后沉默"（他们认可过产品，只是被打断）；其次是"中活跃后沉默"；"注册即流失"（低活跃）应排除在 push 之外，改用成本更低的手段（站内信/新用户引导优化）。**同时要注意 push 的边际成本——发的越多，打开率越低、卸载率越高，全量发是最差的选择。**'
},


{
  id:'lab09', icon:'🚀', tag:'新用户激活',
  title:'新用户的"首单之路"卡在哪一步？',
  question:'新用户从注册到第一次付费要经过好几步。老板问：我们到底卡在哪一步？',
  context:'激活漏斗是增长分析的基础工具：要区分清楚每一环的流失原因，才能对症下药。',
  ctx:'新用户从注册到第一次付费要经过好几步。老板问：我们到底卡在哪一步？',
  deliverable:'画出新用户激活漏斗（注册→登录→发帖/互动→付费），指出最大的流失环节，并给出 2 条改进动作。',
  steps:[
    '第一步：先看"注册但从未登录"的用户有多少（最前端就漏了）',
    '第二步：看登录过但从未产生互动（发帖/评论）的用户占比',
    '第三步：看互动过的用户里有多少付费',
    '第四步：算出每一步的转化率，找出流失最大的那一环',
    '第五步：针对最大流失环给动作'
  ],
  queries:[
    { t:'① 注册但从未登录（最前端流失）',
      sql:`SELECT COUNT(*) AS never_login_users
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM events e
                  WHERE e.user_id=u.user_id AND e.event_type='login')`,
      finding:'这批人连产品都没进来过——是注册流程、渠道质量或手机号验证的问题，跟产品体验无关。' },
    { t:'② 四级激活漏斗',
      sql:`SELECT
  (SELECT COUNT(*) FROM users) AS s1_注册,
  (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type='login') AS s2_登录,
  (SELECT COUNT(DISTINCT user_id) FROM events
     WHERE event_type IN ('post','comment','share')) AS s3_互动,
  (SELECT COUNT(DISTINCT user_id) FROM orders) AS s4_付费`,
      finding:'四个数字横向一比，最大的断层就是你要优化的地方。注意"互动"用 IN 把三类行为合并（任一即算）。' },
    { t:'③ 各步骤转化率（更直观）',
      sql:`WITH f AS (
  SELECT
    (SELECT COUNT(*) FROM users) AS s1,
    (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type='login') AS s2,
    (SELECT COUNT(DISTINCT user_id) FROM events
       WHERE event_type IN ('post','comment','share')) AS s3,
    (SELECT COUNT(DISTINCT user_id) FROM orders) AS s4
)
SELECT s1, s2, ROUND(s2*100.0/s1,1) AS 注册到登录,
       s3, ROUND(s3*100.0/s2,1) AS 登录到互动,
       s4, ROUND(s4*100.0/s3,1) AS 互动到付费
FROM f`,
      finding:'"注册→登录"和"互动→付费"通常是流失最大的两环，但原因完全不同：前者是渠道/流程问题，后者是价值感知问题。' }
  ],
  conclusion:'漏斗分析的关键不是算出一堆百分比，而是**指出断层最大的一环并解释原因**。经验上：注册→登录的断层通常来自渠道质量或验证流程摩擦；登录→互动的断层来自"没有内容可看/没有引导"；互动→付费的断层来自付费理由不足。**给动作时要对应到具体那一环**，不要笼统说"优化体验"。'
},
{
  id:'lab10', icon:'🏆', tag:'渠道决策',
  title:'综合评估：哪个渠道最健康？',
  context:'前面几题分别看过量、留存、付费、单位经济。现在要综合成一个结论。',
  ctx:'前面几题分别看过量、留存、付费、单位经济。现在要综合成一个结论。',
  question:'如果只能保留 3 个渠道，你留哪 3 个？给出排名依据（要求同时覆盖规模、质量、成本三个维度）。',
  deliverable:'一个排名表（含三维指标 + 综合排序）+ 一句话结论 + 被淘汰渠道的处理建议。',
  steps:[
    '第一步：把三维指标放在一张表里（用户数 / 次日留存 / LTV-CAC）',
    '第二步：不要简单相加——先判断哪个维度是当前瓶颈（规模优先还是效率优先）',
    '第三步：给出你的排序逻辑（并说明为什么这样排）',
    '第四步：对被淘汰渠道给处理建议（直接停 / 优化后再看）'
  ],
  queries:[
    { t:'① 三维综合表',
      sql:`SELECT u.channel,
  COUNT(DISTINCT u.user_id) AS users,
  ROUND(COUNT(DISTINCT CASE WHEN e.event_type='login'
        AND e.event_date=date(u.register_date,'+1 day')
        THEN u.user_id END)*100.0/COUNT(DISTINCT u.user_id),2) AS d1_rate,
  ROUND(SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id),2) AS ltv,
  ROUND(COALESCE(c.cost,0)*1.0/COUNT(DISTINCT u.user_id),2) AS cac,
  ROUND((SUM(o.amount)*1.0/COUNT(DISTINCT u.user_id))
        / NULLIF(COALESCE(c.cost,0)*1.0/COUNT(DISTINCT u.user_id),0),2) AS ltv_cac
FROM users u
LEFT JOIN events e ON u.user_id=e.user_id
LEFT JOIN orders o ON o.user_id=u.user_id
LEFT JOIN channels c ON c.channel=u.channel
WHERE u.register_date < '2026-09-10'
GROUP BY u.channel
ORDER BY users DESC`,
      finding:'NULLIF(...,0) 用来避免自然流量渠道 cost=0 时除零报错——返回 NULL 表示"无成本，比值无意义"，比报错好。' },
    { t:'② 各渠道对总收入的贡献占比',
      sql:`SELECT u.channel,
  ROUND(COALESCE(SUM(o.amount),0),2) AS revenue,
  ROUND(COALESCE(SUM(o.amount),0)*100.0
        /(SELECT SUM(amount) FROM orders),2) AS rev_share
FROM users u LEFT JOIN orders o ON o.user_id=u.user_id
GROUP BY u.channel
ORDER BY revenue DESC`,
      finding:'收入贡献占比会揭示"哪些渠道虽然量小但赚钱多"——这类渠道往往被忽视。' }
  ],
  conclusion:'综合决策没有唯一正确答案，但**必须说清你的排序依据**。专业答法示例："当前阶段规模已不是瓶颈，因此以 LTV/CAC 为第一排序标准，规模作为次要标准"——先声明判断标准，再给结论。**最忌讳把三个指标简单相加**（量纲不同、重要性不同）。另外要区分：自然流量渠道（朋友推荐）的特殊价值不在 ROI 而在"零成本 + 高留存"，属于必须保护的战略资产。'
},
{
  id:'lab11', icon:'⚠️', tag:'流失预警',
  title:'定义"即将流失"的用户并评估规模',
  question:'你如何定义"即将流失"？按你的定义圈出这批人，并给出规模与渠道分布。',
  context:'预警的价值在于"提前介入"——用户流失后再召回，成本高得多、成功率低得多。难点在于把"即将流失"变成可度量、可自动执行的规则。',
  ctx:'运营想在用户流失前就介入，而不是等流失后再召回。但"即将流失"必须能被定义和度量。',
  deliverable:'流失定义（含阈值与理由）+ 可触达规模 + 渠道分布 + 一条预警规则。',
  steps:[
    '第一步：先算"活跃用户"的典型使用间隔（判断多长不来算异常）',
    '第二步：把"曾经活跃但最近 N 天未登录"定义为高危',
    '第三步：算规模，并按渠道拆分',
    '第四步：把定义写成一条可自动执行的预警规则'
  ],
  queries:[
    { t:'① 活跃用户的平均使用间隔（用于定阈值）',
      sql:`SELECT ROUND(AVG(gap),2) AS avg_gap_days
FROM (
  SELECT user_id, event_date,
    julianday(event_date) - julianday(LAG(event_date) OVER (PARTITION BY user_id ORDER BY event_date)) AS gap
  FROM events WHERE event_type='login'
) t WHERE gap IS NOT NULL`,
      finding:'用 LAG 窗口函数算"上一次登录到这一次登录"的间隔，平均间隔的 2-3 倍就是合理的"沉默"阈值——这比拍脑袋定"7 天"更有依据。' },
    { t:'② 高危用户规模（曾活跃 ≥3 天、但最近 10 天未登录）',
      sql:`SELECT COUNT(*) AS at_risk_users
FROM (
  SELECT u.user_id
  FROM users u JOIN events e ON u.user_id=e.user_id AND e.event_type='login'
  GROUP BY u.user_id
  HAVING COUNT(DISTINCT e.event_date) >= 3
     AND MAX(e.event_date) <= '2026-08-31'
) t`,
      finding:'同时限定"历史活跃度"和"最近未活跃"——只满足一个条件都不算高危。' },
    { t:'③ 高危用户的渠道分布',
      sql:`SELECT u.channel, COUNT(*) AS at_risk
FROM (
  SELECT uu.user_id, uu.channel
  FROM users uu JOIN events e ON uu.user_id=e.user_id AND e.event_type='login'
  GROUP BY uu.user_id, uu.channel
  HAVING COUNT(DISTINCT e.event_date) >= 3
     AND MAX(e.event_date) <= '2026-08-31'
) u
GROUP BY u.channel
ORDER BY at_risk DESC`,
      finding:'渠道集中度高的高危人群，说明某个渠道的用户体验或预期出现了系统性问题。' }
  ],
  conclusion:'流失预警的核心是**把"感觉要流失"变成可执行的规则**：①阈值要有依据（用平均使用间隔推导，而不是拍脑袋）②要同时看历史活跃度和最近行为（只满足一个都不算）③规则要能自动跑（写成 SQL 定时执行）。**预警的价值在于"提前介入"**——用户流失后再召回，成本高得多、成功率低得多。'
},
{
  id:'lab12', icon:'✍️', tag:'内容供给',
  title:'谁在产出内容？发帖用户的特征',
  question:'描述发帖用户的画像（渠道/城市/年龄/活跃度），并估算他们占全站的比例。',
  context:'内容平台的供给端通常极度集中：少数人产出、多数人消费。弄清"谁在产出"是扩大供给的前提。',
  ctx:'内容平台最怕"看的人多、发的人少"。要先弄清楚：产出内容的是怎样一群人？',
  deliverable:'发帖用户画像 + 占比 + 一条"如何扩大供给"的建议。',
  steps:[
    '第一步：圈出发过帖的用户（去重）',
    '第二步：算他们占全站用户的比例（供给率）',
    '第三步：看他们的渠道/城市/年龄分布，与全站对比',
    '第四步：看他们的活跃度是否显著高于非发帖用户',
    '第五步：基于画像给扩供给的建议'
  ],
  queries:[
    { t:'① 发帖用户占比（供给率）',
      sql:`SELECT
  (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type='post') AS posters,
  (SELECT COUNT(*) FROM users) AS total_users,
  ROUND((SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type='post')*100.0
        /(SELECT COUNT(*) FROM users),2) AS poster_rate`,
      finding:'供给率是内容平台的核心健康指标。业内通常不到 5% 的用户会主动产出——这个比例决定内容的丰富度。' },
    { t:'② 发帖用户的渠道/年龄画像',
      sql:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS posters, ROUND(AVG(u.age),1) AS avg_age
FROM users u
WHERE EXISTS (SELECT 1 FROM events e WHERE e.user_id=u.user_id AND e.event_type='post')
GROUP BY u.channel
ORDER BY posters DESC`,
      finding:'把发帖用户的渠道分布与全站渠道分布对比，就能看出"哪个渠道更容易产出内容"——这是投放结构的优化依据。' },
    { t:'③ 发帖用户 vs 非发帖用户的活跃度差异',
      sql:`SELECT CASE WHEN p.user_id IS NULL THEN '非发帖用户' ELSE '发帖用户' END AS grp,
  COUNT(*) AS users,
  ROUND(AVG(a.d),2) AS avg_active_days
FROM (SELECT user_id, COUNT(DISTINCT event_date) AS d
      FROM events WHERE event_type='login' GROUP BY user_id) a
LEFT JOIN (SELECT DISTINCT user_id FROM events WHERE event_type='post') p ON p.user_id=a.user_id
GROUP BY grp`,
      finding:'发帖用户的活跃天数通常是普通用户的数倍——这说明"创作"和"留存"是强绑定的，扩供给本身就是在做留存。' }
  ],
  conclusion:'供给分析的结论要落到**"如何扩大供给"**：①供给率低说明绝大多数人只消费——要降低创作门槛（模板/话题引导）；②如果某渠道用户特别爱发帖，就加大该渠道投放；③"发帖用户活跃度显著更高"意味着**引导创作本身就是留存手段**，而不是单纯的内容运营动作。'
}

];

var LAB_META = {
  updated: '2026-09-12',
  intro: '训练场是「按需求写 SQL」（有唯一答案）；实验室是「给你一个业务问题，自己去数据里找答案」（无唯一答案，但有参考分析路径）。每题都没有标准答案，重点是**分析思路**：拆哪个维度、用什么口径、结论能不能落地。'
};
