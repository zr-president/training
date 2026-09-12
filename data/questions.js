// SQL 训练场题库 · 用户增长领域（对标策略运营/增长运营岗位）
// 每题：ctx=业务背景  task=要算什么  hint=提示  solution=参考解  why=业务含义
// 判分方式：把你的结果与参考解的结果集对比（含 ORDER BY 的题按顺序比，否则按无序多重集比）

var SQL_QUESTIONS = [

/* ==================== L1 基础查询 ==================== */
{
  id:'q01', level:1, topic:'基础查询', order:false,
  title:'筛出女性用户的画像字段',
  ctx:'增长团队要针对女性用户做一次站内活动，需要先拿到这批人的基础画像。',
  task:'从 users 表中查出所有女性用户的 user_id、city、age。',
  hint:'用 WHERE 过滤 gender。字符串条件要加单引号。',
  solution:`SELECT user_id, city, age FROM users WHERE gender = '女'`,
  why:'这是最基础的"圈人"动作——做任何分层运营（push/活动/权益）第一步都是把人群筛出来。'
},
{
  id:'q02', level:1, topic:'基础查询', order:false,
  title:'找出 8/15 之后注册的用户',
  ctx:'8 月 15 日上线了新版本，运营想单独看新版本之后的注册用户表现。',
  task:'查出 register_date 大于等于 2026-08-15 的用户的 user_id、register_date、channel。',
  hint:'日期在 SQLite 里存成 YYYY-MM-DD 文本，可以直接用 >= 比较。',
  solution:`SELECT user_id, register_date, channel FROM users WHERE register_date >= '2026-08-15'`,
  why:'按时间切"版本/活动前后"的对比分析，是评估迭代效果的标准做法。'
},
{
  id:'q03', level:1, topic:'基础查询', order:false,
  title:'抖音渠道带来了多少用户',
  ctx:'抖音投放花了最多的钱，先看它到底带来多少人。',
  task:'统计 channel 为「抖音」的用户数量，列名用 user_cnt。',
  hint:'数人头用 COUNT(*)。',
  solution:`SELECT COUNT(*) AS user_cnt FROM users WHERE channel = '抖音'`,
  why:'先看"量"，再看"质"——渠道评估必须量、质一起看，只看量会被大渠道误导。'
},
{
  id:'q04', level:1, topic:'基础查询', order:true,
  title:'各城市用户数排行',
  ctx:'要决定下一个线下活动落在哪个城市。',
  task:'按 city 统计用户数（列名 user_cnt），按用户数从多到少排序。',
  hint:'分组用 GROUP BY，排序用 ORDER BY ... DESC。',
  solution:`SELECT city, COUNT(*) AS user_cnt FROM users GROUP BY city ORDER BY user_cnt DESC`,
  why:'地区分布决定资源投放优先级——用数据代替"感觉哪个城市人多"。'
},
{
  id:'q05', level:1, topic:'基础查询', order:true,
  title:'挑出高客单价订单',
  ctx:'运营想看单价 150 元以上的订单都是谁买的、买了什么。',
  task:'查出 orders 表中 amount 大于 150 的订单的 order_id、user_id、amount，按 amount 从高到低排序。',
  hint:'注意是"大于"，不是"大于等于"。',
  solution:`SELECT order_id, user_id, amount FROM orders WHERE amount > 150 ORDER BY amount DESC`,
  why:'高客单价订单是"高价值用户"的第一线索，通常后续会重点维护这批人。'
},

/* ==================== L2 聚合与分组 ==================== */
{
  id:'q06', level:2, topic:'聚合分组', order:true,
  title:'各渠道拉新量对比',
  ctx:'盘点 6 个渠道各自贡献了多少注册用户。',
  task:'按 channel 统计注册用户数（列名 users），按 users 从多到少排序。',
  hint:'这就是 GROUP BY 的典型用法。',
  solution:`SELECT channel, COUNT(*) AS users FROM users GROUP BY channel ORDER BY users DESC`,
  why:'拉新量是渠道的第一层画像，但要和后面的留存/ROI 一起看才有意义。'
},
{
  id:'q07', level:2, topic:'聚合分组', order:true,
  title:'每日新增用户趋势',
  ctx:'想看拉新是不是稳定的，还是某天突然暴涨/断崖。',
  task:'按 register_date 统计每日新增用户数（列名 new_users），按日期升序。',
  hint:'对日期字段分组即可得到"每日"。',
  solution:`SELECT register_date, COUNT(*) AS new_users FROM users GROUP BY register_date ORDER BY register_date`,
  why:'新增趋势能暴露投放节奏问题——突然的断崖往往意味着渠道停投或归因出问题。'
},
{
  id:'q08', level:2, topic:'聚合分组', order:true,
  title:'计算 DAU（日活跃用户数）',
  ctx:'DAU 是增长团队每天必看的第一指标。',
  task:'从 events 表统计每天的活跃用户数（只算 login 行为，列名 dau，按日期升序）。',
  hint:'同一个用户一天可能登录多次，要用 COUNT(DISTINCT user_id) 去重。',
  solution:`SELECT event_date, COUNT(DISTINCT user_id) AS dau FROM events WHERE event_type = 'login' GROUP BY event_date ORDER BY event_date`,
  why:'DAU 的关键在"去重"——不去重算出来的是登录次数，不是人数，会把指标算虚高。'
},
{
  id:'q09', level:2, topic:'聚合分组', order:true,
  title:'用户消费排行（频次 + 金额）',
  ctx:'找出贡献最多的用户，纳入核心用户池。',
  task:'统计每个下过单的用户的订单数（order_cnt）和累计消费金额（gmv，保留2位小数），按 gmv 降序。',
  hint:'用 SUM(amount) 算金额、COUNT(*) 算单数；ROUND(x,2) 保留两位。',
  solution:`SELECT user_id, COUNT(*) AS order_cnt, ROUND(SUM(amount),2) AS gmv FROM orders GROUP BY user_id ORDER BY gmv DESC`,
  why:'"频次 × 金额"是用户价值的二维切分——高频高额才是真正的核心用户。'
},
{
  id:'q10', level:2, topic:'聚合分组', order:true,
  title:'各渠道用户占比',
  ctx:'看渠道结构是否健康（是否过度依赖单一渠道）。',
  task:'统计各渠道的用户数（users）及其占总用户数的百分比（pct，保留2位小数），按 users 降序。',
  hint:'总用户数可以用子查询 (SELECT COUNT(*) FROM users) 拿到。',
  solution:`SELECT channel, COUNT(*) AS users, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS pct FROM users GROUP BY channel ORDER BY users DESC`,
  why:'占比结构决定风险——如果 70% 用户来自单一渠道，一旦该渠道涨价或限流，增长立刻失速。'
},

/* ==================== L3 多表 JOIN ==================== */
{
  id:'q11', level:3, topic:'多表JOIN', order:true,
  title:'各渠道付费用户数',
  ctx:'拉新量大不等于能赚钱，要看各渠道真正掏钱的人有多少。',
  task:'关联 users 与 orders，统计各渠道的付费用户数（列名 pay_users，去重），按 pay_users 降序。',
  hint:'JOIN ... ON u.user_id = o.user_id；付费用户要 DISTINCT。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS pay_users FROM users u JOIN orders o ON u.user_id = o.user_id GROUP BY u.channel ORDER BY pay_users DESC`,
  why:'付费用户数才是"有效获客"——和拉新量对比就能看出渠道的"虚胖"程度。'
},
{
  id:'q12', level:3, topic:'多表JOIN', order:true,
  title:'各渠道 ROI（投入产出比）',
  ctx:'预算有限，要在付费渠道之间做取舍。',
  task:'关联 channels（成本）→ users（渠道归属）→ orders（收入），计算各付费渠道（cost > 0）的：cost、revenue（收入合计，2位小数）、roi（revenue / cost，3位小数），按 roi 降序。',
  hint:'三张表连续 JOIN；只保留 cost > 0 的渠道（自然流量没有成本）。',
  solution:`SELECT c.channel, c.cost, ROUND(SUM(o.amount),2) AS revenue, ROUND(SUM(o.amount) / c.cost, 3) AS roi FROM channels c JOIN users u ON u.channel = c.channel JOIN orders o ON o.user_id = u.user_id WHERE c.cost > 0 GROUP BY c.channel, c.cost ORDER BY roi DESC`,
  why:'ROI 是渠道决策的最终依据——注意它是"比值"，必须带上 cost 一起看，否则会误判。'
},
{
  id:'q13', level:3, topic:'多表JOIN', order:true,
  title:'有发帖但从未付费的用户',
  ctx:'这批人是"高活跃但零付费"，是付费转化的最大机会池。',
  task:'统计各渠道中「有过 post 行为、但从未下过订单」的用户数（列名 cnt，去重），按 cnt 降序。',
  hint:'用 NOT IN (SELECT user_id FROM orders) 排除付费用户；关联 events 时限定 event_type。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS cnt FROM users u JOIN events e ON u.user_id = e.user_id AND e.event_type = 'post' WHERE u.user_id NOT IN (SELECT user_id FROM orders) GROUP BY u.channel ORDER BY cnt DESC`,
  why:'"高活跃未付费"是最值得做转化实验的人群——已有使用深度，缺的是付费理由。'
},
{
  id:'q14', level:3, topic:'多表JOIN', order:true,
  title:'各渠道首单转化率',
  ctx:'对比渠道质量最直接的方式：来的人里有多少最终付费。',
  task:'用 LEFT JOIN 统计各渠道的：total_users（注册用户数）、pay_users（付费用户数）、cvr（付费转化率百分比，2位小数），按 cvr 降序。',
  hint:'必须用 LEFT JOIN，否则没付费的渠道会消失；注意 COUNT(DISTINCT o.user_id) 会自动忽略 NULL。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS total_users, COUNT(DISTINCT o.user_id) AS pay_users, ROUND(COUNT(DISTINCT o.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS cvr FROM users u LEFT JOIN orders o ON u.user_id = o.user_id GROUP BY u.channel ORDER BY cvr DESC`,
  why:'LEFT JOIN 是渠道分析的标准写法——用 INNER JOIN 会把"零转化"的渠道直接吃掉，得出错误结论。'
},

/* ==================== L4 窗口函数 ==================== */
{
  id:'q15', level:4, topic:'窗口函数', order:true,
  title:'各渠道最早注册的 3 位用户',
  ctx:'要复盘每个渠道的"种子用户"，他们是渠道冷启动的关键。',
  task:'用窗口函数找出每个渠道按注册时间最早的前 3 位用户，输出 channel、user_id、register_date，按 channel、register_date 升序。',
  hint:'ROW_NUMBER() OVER (PARTITION BY channel ORDER BY ...) 再在外层筛 rn <= 3。',
  solution:`SELECT channel, user_id, register_date FROM (SELECT channel, user_id, register_date, ROW_NUMBER() OVER (PARTITION BY channel ORDER BY register_date, user_id) AS rn FROM users) t WHERE rn <= 3 ORDER BY channel, register_date`,
  why:'PARTITION BY + 排序 + 取前 N，是"分组取 TopN"的通用解法——面试高频题。'
},
{
  id:'q16', level:4, topic:'窗口函数', order:true,
  title:'渠道用户数的累计占比（帕累托）',
  ctx:'想知道是不是少数渠道贡献了绝大多数用户（二八分布）。',
  task:'统计各渠道用户数（users），并计算按 users 降序的累计占比 cum_pct（百分比，2位小数），输出 channel、users、cum_pct，按 users 降序。',
  hint:'SUM(users) OVER (ORDER BY users DESC ...) 做累计，SUM(users) OVER () 做总计。',
  solution:`SELECT channel, users, ROUND(SUM(users) OVER (ORDER BY users DESC, channel ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0 / SUM(users) OVER (), 2) AS cum_pct FROM (SELECT channel, COUNT(*) AS users FROM users GROUP BY channel) t ORDER BY users DESC`,
  why:'累计占比用来判断"集中度"——如果前 2 个渠道就占 70%，运营策略必须优先保这两个。'
},
{
  id:'q17', level:4, topic:'窗口函数', order:true,
  title:'各渠道消费最高的用户',
  ctx:'每个渠道都要找出自己的"头号用户"做重点维护。',
  task:'找出每个渠道累计消费金额最高的用户，输出 channel、user_id、gmv（保留2位小数），按 gmv 降序。',
  hint:'先按渠道+用户聚合算 gmv，再用 ROW_NUMBER() 取每组第 1 名。',
  solution:`SELECT channel, user_id, gmv FROM (SELECT u.channel, u.user_id, ROUND(SUM(o.amount),2) AS gmv, ROW_NUMBER() OVER (PARTITION BY u.channel ORDER BY SUM(o.amount) DESC) AS rn FROM users u JOIN orders o ON u.user_id = o.user_id GROUP BY u.channel, u.user_id) t WHERE rn = 1 ORDER BY gmv DESC`,
  why:'"分组取第一名"在运营里到处都是：每渠道 TOP 用户、每品类销冠、每城市最佳门店。'
},

/* ==================== L5 业务场景题 ==================== */
{
  id:'q18', level:5, topic:'业务场景·留存', order:true,
  title:'【次日留存】各渠道留存率对比',
  ctx:'这是渠道质量评估的核心题。留存差的大渠道会持续烧钱——拉来的人第二天就走，等于白买流量。',
  task:'计算各渠道的：cohort_users（注册用户数，只统计 2026-09-10 之前注册的，因为最后一天无法观察次日行为）、d1_users（注册次日有 login 的用户数）、d1_rate（次日留存率百分比，2位小数），按 d1_rate 降序。',
  hint:'判断"次日登录"：e.event_date = date(u.register_date, \'+1 day\')；用 CASE WHEN 条件计数。记得 WHERE 排除最后一天注册的人，否则分母被污染。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS cohort_users, COUNT(DISTINCT CASE WHEN e.event_type = 'login' AND e.event_date = date(u.register_date, '+1 day') THEN u.user_id END) AS d1_users, ROUND(COUNT(DISTINCT CASE WHEN e.event_type = 'login' AND e.event_date = date(u.register_date, '+1 day') THEN u.user_id END) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS d1_rate FROM users u LEFT JOIN events e ON u.user_id = e.user_id WHERE u.register_date < '2026-09-10' GROUP BY u.channel ORDER BY d1_rate DESC`,
  why:'留存是增长的"复利开关"：留存差 10 个点，一年后用户规模差好几倍。渠道评估必须量（拉新）× 质（留存/付费）一起看。'
},
{
  id:'q19', level:5, topic:'业务场景·漏斗', order:true,
  title:'【漏斗】注册 → 次日登录 → 发帖 → 付费',
  ctx:'要定位增长卡在哪一环——是没人来，还是来了不活跃，还是活跃了不付费。',
  task:'输出一行四列：s1_register（注册用户数，只算 2026-09-10 之前）、s2_d1login（次日登录用户数）、s3_post（有过 post 行为的用户数）、s4_pay（下过单的用户数）。',
  hint:'四个数都可以各写一个标量子查询（SELECT ...）拼在一行里。',
  solution:`SELECT (SELECT COUNT(*) FROM users WHERE register_date < '2026-09-10') AS s1_register, (SELECT COUNT(DISTINCT u.user_id) FROM users u JOIN events e ON u.user_id = e.user_id WHERE e.event_type = 'login' AND e.event_date = date(u.register_date, '+1 day')) AS s2_d1login, (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type = 'post') AS s3_post, (SELECT COUNT(DISTINCT user_id) FROM orders) AS s4_pay`,
  why:'漏斗的价值在于"定位瓶颈"：哪个环节掉得最狠，资源就投哪里。先定位、再优化，不要凭感觉all in。'
},
{
  id:'q20', level:5, topic:'业务场景·LTV/CAC', order:true,
  title:'【LTV/CAC】渠道单位经济模型',
  ctx:'最终决策题：哪个渠道值得加预算？核心看 LTV/CAC（用户终身价值 / 获客成本）。业内经验值：LTV/CAC > 3 才算健康。',
  task:'计算各付费渠道（cost > 0）的：users（注册用户数）、revenue（收入合计，2位小数）、ltv（人均贡献收入，2位小数）、cac（人均获客成本 = cost / 注册用户数，2位小数）、ltv_cac（ltv / cac，2位小数），按 ltv_cac 降序。',
  hint:'注意 cac 的分母是"注册用户数"而不是"付费用户数"——获客成本要摊到所有拉来的人身上。',
  solution:`SELECT c.channel, COUNT(DISTINCT u.user_id) AS users, ROUND(SUM(o.amount),2) AS revenue, ROUND(SUM(o.amount) * 1.0 / COUNT(DISTINCT u.user_id), 2) AS ltv, ROUND(c.cost * 1.0 / COUNT(DISTINCT u.user_id), 2) AS cac, ROUND((SUM(o.amount) * 1.0 / COUNT(DISTINCT u.user_id)) / (c.cost * 1.0 / COUNT(DISTINCT u.user_id)), 2) AS ltv_cac FROM channels c JOIN users u ON u.channel = c.channel JOIN orders o ON o.user_id = u.user_id WHERE c.cost > 0 GROUP BY c.channel, c.cost ORDER BY ltv_cac DESC`,
  why:'这是"花钱决策"的最终依据：LTV/CAC < 1 是亏钱买量（越投越亏），1-3 是打平偏紧，> 3 才值得放量。策略运营的核心价值就是让这个比值变好。'
}
];

var SQL_LEVELS = {
  1:{name:'基础查询', color:'em'},
  2:{name:'聚合分组', color:'bl'},
  3:{name:'多表 JOIN', color:'vi'},
  4:{name:'窗口函数', color:'am'},
  5:{name:'业务场景题', color:'rd'}
};
