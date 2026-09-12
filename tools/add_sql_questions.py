# -*- coding: utf-8 -*-
"""SQL 训练场加题：20 → 30（新增 L2/L3/L4/L5 各若干）"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\data\questions.js'
c = open(FP, 'r', encoding='utf-8').read()

# 找到数组结尾（最后一个题目对象的 "}" + "];"）
marker = "\n];"
i = c.rfind(marker)
if i < 0:
    print('MISS end'); sys.exit(1)

new = """,

/* ==================== 追加 L2 聚合进阶 ==================== */
{
  id:'q21', level:2, topic:'聚合分组', order:true,
  title:'各渠道用户的平均年龄',
  ctx:'产品要判断不同渠道的人群画像差异，年龄是一个关键维度。',
  task:'按 channel 统计用户的平均年龄（列名 avg_age，保留 1 位小数），按 avg_age 降序。',
  hint:'AVG(age) 求平均，ROUND(x,1) 保留一位。',
  solution:`SELECT channel, ROUND(AVG(age), 1) AS avg_age FROM users GROUP BY channel ORDER BY avg_age DESC`,
  why:'渠道不只带来"量"的差异，也带来"人"的差异。年龄结构会影响内容调性和运营话术。'
},
{
  id:'q22', level:2, topic:'聚合分组', order:true,
  title:'找出复购用户（下过 2 单以上）',
  ctx:'复购是健康度的重要信号——只买一次的用户和反复购买的用户，价值完全不同。',
  task:'统计订单数大于 1 的用户，输出 user_id、order_cnt（订单数）、total（累计金额，2 位小数），按 order_cnt 降序、再按 total 降序。',
  hint:'先 GROUP BY 再 HAVING COUNT(*) > 1。',
  solution:`SELECT user_id, COUNT(*) AS order_cnt, ROUND(SUM(amount), 2) AS total FROM orders GROUP BY user_id HAVING COUNT(*) > 1 ORDER BY order_cnt DESC, total DESC`,
  why:'WHERE 过滤的是"行"，HAVING 过滤的是"分组"。判断聚合结果（如订单数>1）必须用 HAVING——这是面试高频考点。'
},
{
  id:'q23', level:2, topic:'聚合分组', order:true,
  title:'每月新增用户趋势',
  ctx:'要看拉新的月度节奏，而不是每日噪音。',
  task:'按注册月份（格式 YYYY-MM，列名 ym）统计新增用户数（列名 new_users），按月份升序。',
  hint:'SQLite 用 strftime(\'%Y-%m\', register_date) 取年月。',
  solution:`SELECT strftime('%Y-%m', register_date) AS ym, COUNT(*) AS new_users FROM users GROUP BY ym ORDER BY ym`,
  why:'把日粒度聚合到月粒度，能过滤掉短期波动、看清趋势方向。分析时"选对时间粒度"和"选对维度"一样重要。'
},

/* ==================== 追加 L3 多表进阶 ==================== */
{
  id:'q24', level:3, topic:'多表JOIN', order:true,
  title:'注册后 7 天内下单的用户数（按渠道）',
  ctx:'首单速度反映了新用户体验到价值的快慢。',
  task:'统计各渠道「注册后 7 天内（含第 7 天）下过单」的用户数（列名 fast_pay_users，去重），按该人数降序。',
  hint:'条件：o.order_date <= date(u.register_date, \'+7 day\')；用 COUNT(DISTINCT CASE WHEN ... THEN ... END)。',
  solution:`SELECT u.channel, COUNT(DISTINCT CASE WHEN o.order_date <= date(u.register_date, '+7 day') THEN u.user_id END) AS fast_pay_users FROM users u LEFT JOIN orders o ON u.user_id = o.user_id GROUP BY u.channel ORDER BY fast_pay_users DESC`,
  why:'"多久转化"和"是否转化"是两个不同的问题。首单速度快的渠道，往往说明用户预期与产品匹配度高。'
},
{
  id:'q25', level:3, topic:'多表JOIN', order:true,
  title:'从未登录过的注册用户',
  ctx:'有一批用户注册了但从未登录——这是注册流程或渠道质量的严重问题。',
  task:'找出在 events 表中没有 login 记录的用户的 user_id、channel，按 user_id 升序。',
  hint:'用 NOT EXISTS 或 NOT IN 子查询。',
  solution:`SELECT u.user_id, u.channel FROM users u WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.user_id = u.user_id AND e.event_type = 'login') ORDER BY u.user_id`,
  why:'EXISTS / NOT EXISTS 是"存在性判断"的标准写法，比 JOIN 去重更安全、语义更清晰。'
},
{
  id:'q26', level:3, topic:'多表JOIN', order:true,
  title:'各商品的销售额与订单数',
  ctx:'要看哪些商品是真正的收入支柱。',
  task:'按 product 统计订单数（order_cnt）、销售额（gmv，2 位小数）与客单价（avg_amount，2 位小数），按 gmv 降序。',
  hint:'COUNT(*)、SUM(amount)、AVG(amount) 三个聚合一次算完。',
  solution:`SELECT product, COUNT(*) AS order_cnt, ROUND(SUM(amount), 2) AS gmv, ROUND(AVG(amount), 2) AS avg_amount FROM orders GROUP BY product ORDER BY gmv DESC`,
  why:'"销售额高"可能是因为卖得多，也可能是因为单价高——拆成订单数 + 客单价才能看清驱动因素。'
},

/* ==================== 追加 L4 窗口函数进阶 ==================== */
{
  id:'q27', level:4, topic:'窗口函数', order:true,
  title:'复购间隔：第一次到第二次下单隔了几天',
  ctx:'复购间隔越短，说明用户黏性越强。',
  task:'对下过 2 单以上的用户，计算其第 1 单与第 2 单之间相隔的天数（列名 gap_days，整数），输出 user_id 与 gap_days，按 gap_days 升序、再按 user_id 升序。',
  hint:'先用 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date, order_id) 给订单编号，再自连接取 rn=1 与 rn=2；天数差用 CAST(julianday(b) - julianday(a) AS INTEGER)。',
  solution:`WITH o AS (SELECT user_id, order_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date, order_id) AS rn FROM orders) SELECT a.user_id, CAST(julianday(b.order_date) - julianday(a.order_date) AS INTEGER) AS gap_days FROM o a JOIN o b ON a.user_id = b.user_id AND a.rn = 1 AND b.rn = 2 ORDER BY gap_days, a.user_id`,
  why:'"第 N 次行为"的分析都靠 ROW_NUMBER 打标 + 自连接。这是留存、复购、流失预测类分析的通用套路。'
},
{
  id:'q28', level:4, topic:'窗口函数', order:true,
  title:'各城市消费金额最高的用户',
  ctx:'每个城市都要找出本地的大客户做重点维护。',
  task:'找出每个城市累计消费金额最高的用户，输出 city、user_id、gmv（2 位小数），按 gmv 降序。',
  hint:'先按 城市+用户 聚合算 gmv，再用 ROW_NUMBER() 按 gmv 降序分组取第 1。',
  solution:`SELECT city, user_id, gmv FROM (SELECT u.city, u.user_id, ROUND(SUM(o.amount), 2) AS gmv, ROW_NUMBER() OVER (PARTITION BY u.city ORDER BY SUM(o.amount) DESC) AS rn FROM users u JOIN orders o ON u.user_id = o.user_id GROUP BY u.city, u.user_id) t WHERE rn = 1 ORDER BY gmv DESC`,
  why:'"分组取 TopN"在运营里无处不在。注意窗口函数里可以直接对聚合结果（SUM）排序，不需要多套一层子查询。'
},
{
  id:'q29', level:4, topic:'窗口函数', order:true,
  title:'各渠道用户数的累计占比',
  ctx:'判断渠道集中度：是不是少数渠道贡献了绝大多数用户。',
  task:'统计各渠道用户数（users），并计算按 users 降序的累计占比（列名 cum_pct，百分比 2 位小数），输出 channel、users、cum_pct，按 users 降序。',
  hint:'SUM(users) OVER (ORDER BY users DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) 做累计，SUM(users) OVER () 做总量。',
  solution:`SELECT channel, users, ROUND(SUM(users) OVER (ORDER BY users DESC, channel ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0 / SUM(users) OVER (), 2) AS cum_pct FROM (SELECT channel, COUNT(*) AS users FROM users GROUP BY channel) t ORDER BY users DESC`,
  why:'累计占比（帕累托分析）用来判断集中度风险：如果前两个渠道就占 70%，任何一个出问题都会直接冲击大盘。'
},

/* ==================== 追加 L5 业务场景 ==================== */
{
  id:'q30', level:5, topic:'业务场景·留存', order:true,
  title:'【7日留存】各渠道 D7 留存率对比',
  ctx:'次日留存看"有没有兴趣"，7 日留存看"有没有形成习惯"。两个一起看才有完整判断。',
  task:'计算各渠道的 D7 留存率：分母为该渠道中 register_date < \'2026-09-04\' 的用户数（保证能观察到第 7 天），分子为其中在注册后第 7 天（date(register_date, \'+7 day\')）有 login 的用户数。输出 channel、cohort_users、d7_users、d7_rate（百分比 2 位小数），按 d7_rate 降序。',
  hint:'分母要限定 register_date < \'2026-09-04\'（因为数据到 9/10，只有 9/4 之前注册的才能观察到第 7 天）；用 CASE WHEN + date(...,\'+7 day\') 判断。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS cohort_users, COUNT(DISTINCT CASE WHEN e.event_type = 'login' AND e.event_date = date(u.register_date, '+7 day') THEN u.user_id END) AS d7_users, ROUND(COUNT(DISTINCT CASE WHEN e.event_type = 'login' AND e.event_date = date(u.register_date, '+7 day') THEN u.user_id END) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS d7_rate FROM users u LEFT JOIN events e ON u.user_id = e.user_id WHERE u.register_date < '2026-09-04' GROUP BY u.channel ORDER BY d7_rate DESC`,
  why:'做留存分析最容易犯的错是**分母包含了观察期不足的用户**。D7 分析必须把"注册不到 7 天"的人排除，否则留存率会被系统性低估——这个坑在真实工作里非常常见。'
},
{
  id:'q31', level:5, topic:'业务场景·变现', order:true,
  title:'【ARPPU】各渠道付费用户价值对比',
  ctx:'付费率高的渠道不一定赚钱多——还要看每个付费用户贡献多少。',
  task:'计算各渠道的：users（注册用户数）、pay_users（付费用户数）、pay_rate（付费率百分比 2 位小数）、arppu（每付费用户平均收入 = 该渠道总收入 / 付费用户数，2 位小数），按 arppu 降序。',
  hint:'ARPPU 的分母是"付费用户数"（不是注册用户数，那是 ARPU）；用 COUNT(DISTINCT CASE WHEN o.user_id IS NOT NULL THEN u.user_id END) 数付费用户。',
  solution:`SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT o.user_id) AS pay_users, ROUND(COUNT(DISTINCT o.user_id) * 100.0 / COUNT(DISTINCT u.user_id), 2) AS pay_rate, ROUND(SUM(o.amount) * 1.0 / COUNT(DISTINCT o.user_id), 2) AS arppu FROM users u LEFT JOIN orders o ON u.user_id = o.user_id GROUP BY u.channel ORDER BY arppu DESC`,
  why:'ARPU（分母全体用户）和 ARPPU（分母付费用户）是两个不同指标，混用会导致结论完全错误。回答"用户值不值钱"要说清用的是哪个口径——这是专业度的直接体现。'
}
];"""

# 去掉原来的结尾 "];"，替换为新内容（新内容已含 "];"）
c = c[:i] + new + c[i + len(marker):]
open(FP, 'w', encoding='utf-8').write(c)
print('OK SQL 题已从 20 增加到 31')
