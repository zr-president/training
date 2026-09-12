// Python 实算 · 任务库（Pyodide 浏览器内跑真实 Python + pandas/scipy）
// 与 SQL 训练场的区别：这里练的是「用 Python 做数据分析与统计检验」
// 判分方式：执行你的代码 → 取 check 表达式的结果 → 与参考解结果比对（数值容差）

var PY_TASKS = [

{
  id:'py00', tag:'纯 Python · 留存', level:'入门',
  title:'先不用 pandas：手算一遍次日留存率',
  ctx:'留存分析的核心逻辑其实很简单：对每个用户，判断他"注册次日"有没有回来。先用纯 Python 把逻辑走通，再学 pandas 会轻松很多。\n下面 records 里每个元素是 (user_id, 注册日期, 该用户登录过的日期列表)。',
  task:'计算这 8 个用户的次日留存率（注册次日出现在登录列表里的用户数 ÷ 总用户数），以百分数表示并保留 2 位小数，赋值给变量 answer。',
  starter:`from datetime import date, timedelta

records = [
    (1, '2026-08-01', ['2026-08-01', '2026-08-02', '2026-08-05']),
    (2, '2026-08-01', ['2026-08-01']),
    (3, '2026-08-02', ['2026-08-02', '2026-08-03']),
    (4, '2026-08-02', ['2026-08-02']),
    (5, '2026-08-03', ['2026-08-03', '2026-08-04']),
    (6, '2026-08-03', ['2026-08-03']),
    (7, '2026-08-04', ['2026-08-04']),
    (8, '2026-08-04', ['2026-08-04', '2026-08-05']),
]

# 提示：
# 1) 对每个用户，用 date.fromisoformat(注册日期) + timedelta(days=1) 算出"次日"
# 2) 判断这个次日是否在登录列表里
# 3) 留存率 = 命中人数 / 总人数 * 100

# 你的代码写在这里


answer = 0   # ← 把最终结果赋值给 answer
`,
  sol:`from datetime import date, timedelta

records = [
    (1, '2026-08-01', ['2026-08-01', '2026-08-02', '2026-08-05']),
    (2, '2026-08-01', ['2026-08-01']),
    (3, '2026-08-02', ['2026-08-02', '2026-08-03']),
    (4, '2026-08-02', ['2026-08-02']),
    (5, '2026-08-03', ['2026-08-03', '2026-08-04']),
    (6, '2026-08-03', ['2026-08-03']),
    (7, '2026-08-04', ['2026-08-04']),
    (8, '2026-08-04', ['2026-08-04', '2026-08-05']),
]

hit = 0
for uid, reg, logins in records:
    d1 = (date.fromisoformat(reg) + timedelta(days=1)).isoformat()
    if d1 in logins:
        hit += 1
answer = round(hit * 100 / len(records), 2)
`,
  check:'answer',
  hint:'日期在 Python 里用 datetime.date 对象做加减；转成字符串用 .isoformat() 方便和列表里的字符串比较。',
  why:'提前算一下：命中次日的是 1、3、5、8 四个人，所以答案是 50.0。**把逻辑先想清楚，再用 pandas 只是把这套逻辑批量、向量化地表达出来**——很多人学 pandas 卡住，是因为根本没想清楚要算什么。'
},

{
  id:'py01', tag:'pandas · 留存', level:'基础', needs:'pandas',
  title:'用 pandas 算各渠道次日留存率',
  ctx:'数据集已加载为 pandas DataFrame：users / events / orders / channels 四个变量可直接用（还有一个 sqlite 连接 con 可用）。\n字段：users(user_id, register_date, channel, city, age, gender)、events(event_id, user_id, event_date, event_type)。',
  task:'计算「抖音」渠道的次日留存率（注册次日有 login 行为的用户数 ÷ 该渠道注册用户数），结果以百分数表示、保留 2 位小数，把结果赋值给变量 answer。\n（注意：要排除最后一天 2026-09-10 注册的用户，他们无法观察次日行为）',
  starter:`import pandas as pd

# users / events 已经是 DataFrame，直接用
# 提示：
# 1) 先筛出抖音渠道、且 register_date < '2026-09-10' 的用户
# 2) 给每个用户算出「次日」是哪天
# 3) 在 events 里找 event_type=='login' 且 event_date 等于该用户次日 的记录
# 4) 留存率 = 命中用户数 / 该渠道用户数 * 100

# 你的代码写在这里


answer = 0   # ← 把最终结果赋值给 answer
`,
  sol:`import pandas as pd

# 1) 抖音渠道、且可观察次日行为的用户
u = users[(users['channel'] == '抖音') & (users['register_date'] < '2026-09-10')].copy()
u['next_day'] = (pd.to_datetime(u['register_date']) + pd.Timedelta(days=1)).dt.strftime('%Y-%m-%d')

# 2) 次日登录行为
login = events[events['event_type'] == 'login'][['user_id', 'event_date']]
u = u.merge(login, left_on=['user_id', 'next_day'], right_on=['user_id', 'event_date'], how='left')
u['retained'] = u['event_date'].notna()

# 3) 留存率
answer = round(u['retained'].sum() / len(u) * 100, 2)
`,
  check:'answer',
  hint:'merge 时用 left_on=[用户ID, 次日] 与 login 的 [user_id, event_date] 对齐；没匹配上的 event_date 就是 NaN，说明次日没登录。',
  why:'这是留存分析的标准做法——「注册日 +1 天」与行为表对齐。注意分母要排除无法观察次日行为的用户，否则留存率会被系统性低估（这是新手最常犯的错）。'
},

{
  id:'py02', tag:'pandas · 趋势', level:'基础', needs:'pandas',
  title:'找出 DAU 最高的那一天',
  ctx:'events 表记录了每个用户的登录行为（event_type == "login"）。',
  task:'计算每日活跃用户数（DAU，按 user_id 去重），找出 DAU 最高的那一天，把该日期（字符串，格式 YYYY-MM-DD）赋值给变量 answer。',
  starter:`import pandas as pd

# 提示：
# 1) 先筛出 login 行为
# 2) 按 event_date 分组，对 user_id 去重计数
# 3) 取最大值对应的日期

# 你的代码写在这里


answer = ''   # ← 把日期字符串赋值给 answer
`,
  sol:`import pandas as pd

login = events[events['event_type'] == 'login']
dau = login.groupby('event_date')['user_id'].nunique().reset_index(name='dau')
answer = dau.sort_values('dau', ascending=False).iloc[0]['event_date']
`,
  check:'answer',
  hint:'groupby(...)["user_id"].nunique() 就是去重计数；排序后取第一行的日期。',
  why:'DAU 的关键在「去重」——不去重算出来的是登录次数而不是人数，会把指标算虚高。用 nunique() 而不是 count()。'
},

{
  id:'py03', tag:'scipy · 统计检验', level:'进阶', needs:'scipy',
  title:'用卡方检验判断 A/B 实验是否显著',
  ctx:'一次推荐算法 A/B 实验的结果：\n· 对照组：5000 人，480 人转化\n· 实验组：5000 人，545 人转化\n你要判断这个差异是真实的，还是随机波动。',
  task:'对上面的 2×2 列联表做卡方检验（显著性水平 α=0.05），把 p 值（保留 4 位小数）赋值给变量 answer。',
  starter:`import numpy as np
from scipy.stats import chi2_contingency

# 2×2 列联表：行 = 组别，列 = [转化, 未转化]
table = np.array([[480, 5000 - 480],
                  [545, 5000 - 545]])

# 提示：chi2_contingency(table) 返回 (卡方值, p值, 自由度, 期望频数)
# 取 p 值并四舍五入到 4 位小数


answer = 0   # ← 把 p 值赋值给 answer
`,
  sol:`import numpy as np
from scipy.stats import chi2_contingency

table = np.array([[480, 5000 - 480],
                  [545, 5000 - 545]])
chi2, p, dof, expected = chi2_contingency(table)
answer = round(float(p), 4)
`,
  check:'answer',
  hint:'chi2_contingency 返回四个值，第二个就是 p 值。记得 round(..., 4)。',
  why:'p<0.05 只说明「差异不太可能是随机噪声」，**不等于「这个改动值得上线」**——还要看提升幅度是否覆盖成本、护栏指标有没有恶化。这正是「统计显著 ≠ 业务显著」。'
},

{
  id:'py04', tag:'pandas · 单位经济', level:'进阶', needs:'pandas',
  title:'算出 LTV/CAC 最高的付费渠道',
  ctx:'channels 表有每个渠道的投放成本（cost，0 表示自然流量），orders 表有订单金额。',
  task:'只考虑付费渠道（channels.cost > 0），计算各渠道的 LTV（人均贡献收入 = 该渠道总收入 ÷ 该渠道注册用户数）与 CAC（人均获客成本 = cost ÷ 该渠道注册用户数），求 LTV/CAC 比值最高的渠道名，赋值给变量 answer。',
  starter:`import pandas as pd

# 提示：
# 1) 先算出各渠道的注册用户数（users.groupby('channel')）
# 2) 再算各渠道的总收入（users 与 orders 按 user_id 关联后 groupby channel 求和）
# 3) LTV = 总收入 / 用户数；CAC = cost / 用户数；比值 = LTV/CAC = 总收入 / cost
# 4) 只保留 channels.cost > 0 的渠道，取比值最大的渠道名

# 你的代码写在这里


answer = ''   # ← 渠道名
`,
  sol:`import pandas as pd

uc = users.groupby('channel')['user_id'].nunique().reset_index(name='users')
rev = (users.merge(orders, on='user_id', how='inner')
            .groupby('channel')['amount'].sum().reset_index(name='revenue'))
c = channels[channels['cost'] > 0][['channel', 'cost']]
df = c.merge(uc, on='channel').merge(rev, on='channel', how='left').fillna({'revenue': 0})
df['ltv'] = df['revenue'] / df['users']
df['cac'] = df['cost'] / df['users']
df['ltv_cac'] = df['ltv'] / df['cac']
answer = df.sort_values('ltv_cac', ascending=False).iloc[0]['channel']
`,
  check:'answer',
  hint:'注意 LTV/CAC = (总收入/用户数) ÷ (cost/用户数) = 总收入 / cost —— 用户数约掉了，但为了展示两个指标还是建议分开算。',
  why:'这是渠道决策的最终依据。LTV/CAC < 1 是亏钱买量，1-3 打平偏紧，> 3 才值得放量。算的时候别忘了一部分渠道可能没有订单（要用 left join 补齐为 0）。'
},

{
  id:'py05', tag:'scipy · 相关性', level:'进阶', needs:['pandas','scipy'],
  title:'用户活跃度与付费金额有关系吗？',
  ctx:'一个常见假设：越活跃的用户越愿意付费。你要用数据验证这个假设。',
  task:'对「已付费用户」计算其活跃天数（events 中 login 的去重日期数）与累计付费金额之间的皮尔逊相关系数，保留 3 位小数赋值给变量 answer。',
  starter:`import pandas as pd
from scipy.stats import pearsonr

# 提示：
# 1) 算出每个已付费用户的活跃天数
# 2) 算出每个已付费用户的累计付费金额
# 3) 用 pearsonr(x, y)[0] 取相关系数

# 你的代码写在这里


answer = 0   # ← 相关系数（3 位小数）
`,
  sol:`import pandas as pd
from scipy.stats import pearsonr

login = events[events['event_type'] == 'login']
act = login.groupby('user_id')['event_date'].nunique().reset_index(name='active_days')
amt = orders.groupby('user_id')['amount'].sum().reset_index(name='gmv')
df = act.merge(amt, on='user_id', how='inner')
answer = round(float(pearsonr(df['active_days'], df['gmv'])[0]), 3)
`,
  check:'answer',
  hint:'pearsonr(x, y) 返回 (相关系数, p值)，取第一个。注意只对「已付费用户」计算——用 inner join 天然实现。',
  why:'相关系数接近 0 说明「活跃度」和「付费金额」在这批数据里几乎没有线性关系——这恰恰提醒我们：**业务直觉需要用数据验证**，不要想当然地认为「用得越多就一定付得越多」。'
}
];

var PY_META = {
  updated: '2026-09-12',
  intro: '在浏览器里跑真实 Python（Pyodide + pandas + scipy），不需要安装任何环境。内核加载完成后，<b>纯 Python 题可立即开练</b>；涉及 pandas / scipy 的题会在首次使用时按需加载对应库。每题要求你把最终结果赋值给变量 <b>answer</b>，系统会自动与参考解比对——<b>思路对、结果对就给过</b>，不限制你的写法。',
  loadNote: '首次启动需加载 Python 内核（约 10MB，30 秒内可用）；pandas 与 scipy 在用到对应题目时按需加载（合计约 60MB），浏览器会缓存，只需一次。'
};
