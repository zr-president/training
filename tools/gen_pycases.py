# -*- coding: utf-8 -*-
"""生成 Python 数据分析教学案例 → data/pycase.js
关键点：每个案例的代码都会在本地用真实 pandas 跑一遍，把真实输出一并写入，
       所以页面上展示的「预期输出」与代码严格一致。
"""
import io, sys, os, re, json, sqlite3, contextlib
import pandas as pd
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------- 载入数据集 ----------
src = open(BASE + r'\data\dataset.js', 'r', encoding='utf-8').read()
DATASET_SQL = re.search(r'var DATASET_SQL = `\n([\s\S]*)\n`;', src).group(1)
con = sqlite3.connect(':memory:')
con.executescript(DATASET_SQL)
USERS = pd.read_sql_query('SELECT * FROM users', con)
EVENTS = pd.read_sql_query('SELECT * FROM events', con)
ORDERS = pd.read_sql_query('SELECT * FROM orders', con)
CHANNELS = pd.read_sql_query('SELECT * FROM channels', con)

PREAMBLE = """import pandas as pd
import numpy as np

# 四个表已加载为 DataFrame，直接用：
#   users / events / orders / channels
pd.set_option('display.width', 130)
pd.set_option('display.max_columns', 30)
pd.set_option('display.float_format', lambda x: f'{x:,.2f}')
"""

# ============================================================
# 案例定义：(id, group, title, scenario, code, notes, pitfalls)
# code 中**不要**包含 PREAMBLE（生成时会自动加）
# ============================================================
CASES = [
# ---------------- 组 1：读取与体检 ----------------
(
 'c01', '数据读取与体检', '把数据读进来 + 3 行代码做体检',
 '拿到一份新数据，第一件事不是分析，而是"体检"：多少行多少列、每列什么类型、有没有明显异常。这一步能避免 80% 的低级错误。',
 '''# 体检三件套
print("shape (行, 列):", users.shape)
print()
print("每列类型与缺失情况：")
print(users.dtypes)
print()
print("数值列统计概览：")
print(users[['age']].describe())
print()
print("前 3 行：")
print(users.head(3))''',
 ['`shape` 看规模，`dtypes` 看类型（**日期读成 object 是最常见的坑**），`describe()` 看分布与异常值。',
  '养成习惯：先 `head()` 看几行真实数据，再动手写分析逻辑。',
  '如果 `dtypes` 里出现 `object`，通常意味着这列需要转换类型或做清洗。'],
 ['跳过体检直接分析，结果因为类型不对（如日期是字符串）导致筛选/排序全错。']
),
(
 'c02', '数据读取与体检', '缺失值与重复值：先查清楚再动手',
 '数据里的空值和重复行会悄悄污染所有指标。清洗前必须先量化：有多少、在哪几列。',
 '''def check(df, name):
    print(f"【{name}】行数 {len(df)}")
    miss = df.isna().sum()
    miss = miss[miss > 0]
    if len(miss):
        for col, cnt in miss.items():
            print(f"  缺失 {col}: {cnt} 条 ({cnt/len(df)*100:.2f}%)")
    else:
        print("  无缺失值")
    dup = df.duplicated().sum()
    print(f"  完全重复行: {dup}")

for df, nm in [(users, 'users'), (events, 'events'), (orders, 'orders')]:
    check(df, nm)
    print()

# 按业务主键查重复（比"完全重复"更有意义）
dup_user = users['user_id'].duplicated().sum()
print("user_id 重复条数:", dup_user)''',
 ['`isna().sum()` 给出每列缺失数；除以行数才是"缺失率"，缺失率才可比较。',
  '`duplicated()` 查完全重复行；**业务主键重复**（如 user_id 重复）往往更致命，要单独查。',
  '缺失处理有三条路：删除、填充（均值/中位数/前值）、或**保留并单独标记**——选哪条取决于业务含义。'],
 ['无脑 `dropna()` 会把有效数据一起删掉（例如"未付费"本来就是空值，不是缺失）。',
  '只看缺失数不看缺失率：100 条缺失在 1 万行和 100 万行里的严重程度完全不同。']
),

# ---------------- 组 2：清洗与加工 ----------------
(
 'c03', '数据清洗与加工', '日期解析 + 类型转换（留存分析的前提）',
 '注册日期现在是字符串 "YYYY-MM-DD"。不做解析就没法算"次日""第 7 天"。这一步是留存、漏斗、周期分析的地基。',
 '''# 字符串 → 日期类型
users['reg_dt'] = pd.to_datetime(users['register_date'])
events['evt_dt'] = pd.to_datetime(events['event_date'])

print("转换后类型：")
print(users[['register_date', 'reg_dt']].dtypes)
print()
print("日期范围：", users['reg_dt'].min().date(), "~", users['reg_dt'].max().date())
print()

# 日期运算：算出"次日"和"注册周"
users['next_day'] = (users['reg_dt'] + pd.Timedelta(days=1)).dt.strftime('%Y-%m-%d')
users['reg_week'] = users['reg_dt'].dt.to_period('W').astype(str)
print(users[['user_id', 'register_date', 'next_day', 'reg_week']].head(4))''',
 ['`pd.to_datetime()` 是日期分析的开关。转完后就能用 `.dt` 访问器取年/月/周/星期。',
  '`+ pd.Timedelta(days=1)` 做日期加减，比手写字符串拼接安全得多。',
  '`.dt.to_period(\'W\')` 取自然周，是做周报/周留存的标准做法。'],
 ['在字符串上做日期加减（如 `"2026-08-31" + 1`）——必错，且不会报错只会算错。',
  '忘记处理时区或格式不一致（如混有 "2026/8/1"）导致 `to_datetime` 报错或产生 NaT。']
),
(
 'c04', '数据清洗与加工', '条件筛选 + 向量化新增列（别用 for 循环）',
 'pandas 的核心优势是向量化运算：整列一起算，比 for 循环快几十倍，代码也更短。',
 '''# 条件筛选：多条件要用 & 且每个条件加括号
vip = users[(users['age'] >= 22) & (users['age'] <= 28) & (users['channel'] == '抖音')]
print("22-28 岁抖音用户数:", len(vip))
print()

# 向量化新增列：np.where 相当于 Excel 的 IF
users['age_seg'] = np.where(users['age'] < 22, '18-21',
                    np.where(users['age'] < 26, '22-25',
                    np.where(users['age'] < 30, '26-29', '30+')))
print(users['age_seg'].value_counts().sort_index())
print()

# 一次性给多条件打标签
orders['is_big'] = np.where(orders['amount'] >= 150, '大额', '普通')
print(orders.groupby('is_big')['amount'].agg(['count', 'mean']).round(2))''',
 ['多条件必须用 `&`（与）/`|`（或），**且每个条件都要加括号**——运算符优先级会让 `a > 1 & b < 2` 出错。',
  '`np.where(条件, 真值, 假值)` 是向量化的 if-else，比 `apply` 快得多。',
  '嵌套 `np.where` 可以处理多分支；分支超过 4 个时建议改用 `pd.cut`。'],
 ['用 `and`/`or` 连接条件——pandas 里会直接报错（`ValueError: truth value ambiguous`）。',
  '写 `for` 循环逐行处理——慢且容易出错，几乎总有向量化替代方案。']
),
(
 'c05', '数据清洗与加工', '分箱与用户分层（cut 等距 / qcut 等频）',
 '把连续值变成分层标签是运营的基本功：年龄段、消费档位、活跃度分层都靠它。',
 '''# pd.cut：按指定边界分段（等距/自定义）
users['age_band'] = pd.cut(users['age'], bins=[0, 21, 25, 29, 100],
                           labels=['18-21', '22-25', '26-29', '30+'])
print("按年龄段分层（cut）：")
print(users['age_band'].value_counts().sort_index())
print()

# pd.qcut：按分位数等频分段（每段人数尽量相等）——做用户分层更常用
orders_per_user = orders.groupby('user_id')['amount'].sum()
orders_per_user.name = 'gmv'
tier = pd.qcut(orders_per_user, q=4, labels=['普通', '潜力', '优质', '高价值'])
print("按消费金额等频分 4 层（qcut）：")
print(tier.value_counts().sort_index())
print()
print(tier.value_counts().sort_index().to_frame('人数').assign(
    金额下限=lambda d: [round(orders_per_user.quantile(q), 2) for q in [0, .25, .5, .75]]))''',
 ['`cut` 按**你指定的边界**切（可能各段人数悬殊）；`qcut` 按**分位数**切（各段人数接近）。',
  '用户分层通常用 `qcut`——因为运营希望每层都有人可运营。',
  '`qcut` 遇到大量重复值会报 "Bin edges must be unique"，此时改用 `cut` 或先 `rank()`。'],
 ['用 `cut` 做分层后发现某层只有 3 个人——无法运营，该用 `qcut`。',
  '分箱边界随手写（如 0/50/100），与业务无关；边界应来自业务定义或分位数。']
),

# ---------------- 组 3：聚合与合并 ----------------
(
 'c06', '聚合与合并', 'groupby 一次算出多个指标（agg 的威力）',
 '运营看渠道、看品类、看城市，几乎都是"分组后算多个指标"。一次 agg 搞定，避免反复写循环。',
 '''# 一次算多个指标
g = (orders.groupby('user_id')['amount']
     .agg(订单数='count', 总金额='sum', 客单价='mean', 最大单笔='max')
     .round(2)
     .sort_values('总金额', ascending=False))
print("消费 Top5 用户：")
print(g.head())
print()
print("全体汇总：")
print(g.agg(['sum', 'mean', 'max']).round(2))''',
 ['`agg({新列名: 函数})` 可以一次产出多列，比分别算再 merge 清晰得多。',
  '`count` 数非空条数、`size` 数所有行（含空值），两者在有空值时结果不同——聚合前想清楚要哪个。',
  '算完立刻 `sort_values` 排序，输出才可读。'],
 ['把 `count` 和 `size` 混用导致人数统计偏差（尤其是外连接后出现 NaN 时）。',
  '分组键里有空值，pandas 默认会把它丢掉（`dropna=True`）——需要时记得改成 `dropna=False`。']
),
(
 'c07', '聚合与合并', '多表 merge：先查行数有没有膨胀',
 '用户表 + 订单表是最常见的关联。**merge 后行数变化是判断关联是否正确的最快方法**。',
 '''u_orders = users.merge(orders, on='user_id', how='left')

print(f"users 行数        : {len(users)}")
print(f"orders 行数       : {len(orders)}")
print(f"left join 后行数  : {len(u_orders)}")
print(f"其中有订单的用户数: {u_orders['order_id'].notna().sum()}")
print()

# 一次关联多张表：users ← orders，再并上渠道成本
full = (users.merge(orders, on='user_id', how='left')
             .merge(channels[['channel', 'cost']], on='channel', how='left'))
print("关联后列名：", list(full.columns))
print()
# 按渠道汇总（注意：用 nunique 避免用户被订单行数放大）
res = (full.groupby('channel')
       .agg(用户数=('user_id', 'nunique'),
            订单数=('order_id', 'count'),
            收入=('amount', 'sum'))
       .round(2)
       .sort_values('收入', ascending=False))
print(res)''',
 ['**left join 的行数应等于左表行数**（除非右表有重复键）。行数变多说明右表键重复，数据会重复计数。',
  '聚合用户数要用 `nunique`（去重），用 `count` 会因为订单行数把用户数放大。',
  '多表关联后要检查列名，避免同名列变成 `col_x`/`col_y`。'],
 ['merge 后行数暴涨却没发现，导致所有"人数"指标被放大数倍。',
  '用 `count` 统计用户数（应为 `nunique`）——这是最高频的指标计算错误之一。']
),
(
 'c08', '聚合与合并', '透视表 pivot_table：交叉分析一把梭',
 '想看"渠道 × 年龄段"的交叉表现，透视表比嵌套 groupby 直观得多。',
 '''users['age_band'] = pd.cut(users['age'], bins=[0, 21, 25, 29, 100],
                           labels=['18-21', '22-25', '26-29', '30+'])

pv = pd.pivot_table(users, index='channel', columns='age_band',
                    values='user_id', aggfunc='nunique', fill_value=0,
                    observed=False)   # age_band 是 categorical，需显式声明
print("渠道 × 年龄段 用户分布：")
print(pv)
print()
print("按行求占比（每行加起来 100%）：")
print((pv.div(pv.sum(axis=1), axis=0) * 100).round(1))''',
 ['`index` 是行、`columns` 是列、`values` 是要算的字段、`aggfunc` 是算法（默认 mean，数人数要显式写 `nunique` 或 `count`）。',
  '`fill_value=0` 把空白填 0，输出更整洁。',
  '占比要用 `div(..., axis=0)` 按行归一化——写成 `axis=1` 会把百分比算错。',
  '**`observed=False`**：`pd.cut/qcut` 产生的是 categorical 类型，不写这个参数 pandas 会发弃用警告（未来版本行为会变）。虽然不影响结果，但生产代码里应显式声明。'],
 ['忘了写 `aggfunc`，默认求出的是平均值而不是人数。',
  '归一化方向搞错（`axis` 写反），得到的百分比加总不等于 100%。']
),
(
 'c09', '聚合与合并', '组内占比与标准化（transform 一行搞定）',
 '"每个渠道内部各城市的占比"这类"组内占比"，用 `transform` 不需要 merge 回原表。',
 '''# transform 会把聚合结果"广播"回每一行，长度与原来一致
users['ch_users'] = users.groupby('channel')['user_id'].transform('nunique')
users['ch_share'] = (1 / users['ch_users'] * 100).round(3)

summary = (users.groupby('channel')
           .agg(渠道用户数=('ch_users', 'max'))
           .sort_values('渠道用户数', ascending=False))
summary['占全站比(%)'] = (summary['渠道用户数'] / len(users) * 100).round(2)
print(summary)
print()
print("每个城市在其所属渠道内的占比（前 5 行）：")
users['city_in_ch'] = users.groupby(['channel', 'city'])['user_id'].transform('nunique')
print(users[['channel', 'city', 'city_in_ch', 'ch_users']].drop_duplicates().head(5))''',
 ['`transform` 返回与原表等长的结果，可直接赋值成新列——这比 `groupby().agg()` 再 merge 回原表简洁得多。',
  '典型的"组内占比"公式：`组内计数 / 组内总数`，两个数都能用 transform 得到。',
  '`drop_duplicates()` 用来把"广播后重复的行"压回每个组合一行。'],
 ['用 `agg` 得到的结果长度变了，直接赋值给原表会报错或错位——这时就该用 `transform`。',
  '把 `transform` 和 `apply` 混用，`apply` 返回结构不一致时容易得到嵌套结果。']
),

# ---------------- 组 4：时间与留存 ----------------
(
 'c10', '时间序列与留存', '按月聚合 + 环比增长（时间序列入门）',
 '"每月新增多少、环比涨跌"是运营日报/周报的常客。关键是先转日期，再用 `to_period` 聚合。',
 '''users['reg_dt'] = pd.to_datetime(users['register_date'])
users['ym'] = users['reg_dt'].dt.to_period('M').astype(str)

m = users.groupby('ym').agg(新增用户=('user_id', 'nunique')).reset_index()
m['环比(%)'] = (m['新增用户'].pct_change() * 100).round(2)
m['累计用户'] = m['新增用户'].cumsum()
print(m)
print()
print("新增最高的月份：", m.loc[m['新增用户'].idxmax(), 'ym'],
      "共", m['新增用户'].max(), "人")''',
 ['`dt.to_period(\'M\')` 得到"年月"分组键（`dt.month` 只给月份数字，跨年会把 1 月混在一起）。',
  '`pct_change()` 直接算环比（小数），乘 100 才是百分比。',
  '`cumsum()` 算累计值，做增长曲线很常用。'],
 ['用 `dt.month` 分组导致跨年数据混在一起（2025-12 和 2026-12 被算成同一个月）。',
  '第一个月的环比是 NaN（没有上月），展示时要处理，否则报错或显示怪异。']
),
(
 'c11', '时间序列与留存', '次日留存率（cohort 分析标准写法）',
 '留存是运营最核心的指标。这里的写法可以直接套用到 D7/D30：把 `days=1` 改成 `days=7` 即可。',
 '''users['reg_dt'] = pd.to_datetime(users['register_date'])
events['evt_dt'] = pd.to_datetime(events['event_date'])

# 1) 只保留能观察到次日行为的用户（数据截止 2026-09-10）
u = users[users['register_date'] < '2026-09-10'].copy()
u['d1_date'] = (u['reg_dt'] + pd.Timedelta(days=1)).dt.strftime('%Y-%m-%d')

# 2) 次日登录行为
login = events[events['event_type'] == 'login'][['user_id', 'event_date']]

# 3) 左连接判断是否留存
u = u.merge(login, left_on=['user_id', 'd1_date'],
            right_on=['user_id', 'event_date'], how='left')
u['retained'] = u['event_date'].notna()

# 4) 分渠道汇总
res = (u.groupby('channel')
        .agg(同期群人数=('user_id', 'nunique'),
             次日留存人数=('retained', 'sum'))
        .assign(**{'次日留存率(%)': lambda d: (d['次日留存人数'] / d['同期群人数'] * 100).round(2)})
        .sort_values('次日留存率(%)', ascending=False))
print(res)
print()
print("全站次日留存率: %.2f%%" % (u['retained'].mean() * 100))''',
 ['**分母必须排除"观察期不足"的用户**（最后一天注册的人看不到次日行为），否则留存率被系统性低估。',
  '用 left join 判断留存：匹配上就是留存，`NaN` 就是流失——比 `isin` 更省内存且能保留所有人。',
  '`.assign(**{...})` 可以在链式写法里新增计算列，`**` 是为了支持中文列名。'],
 ['分母没排除最后一天注册的用户——这是留存分析最常见、也最容易被忽略的错误。',
  '把"次日留存"算成"次日内任意一天留存"（口径不同，结论会差很多）。']
),
(
 'c12', '时间序列与留存', '漏斗转化率（每一步掉了多少人）',
 '漏斗用于定位"卡在哪一步"。核心是先给每个用户打上"是否到达每一步"的标记，再逐层统计。',
 '''# 定义漏斗步骤：注册 → 登录 → 互动(发帖/评论/分享) → 付费
steps = [
    ('注册', set(users['user_id'])),
    ('登录', set(events[events['event_type'] == 'login']['user_id'])),
    ('互动', set(events[events['event_type'].isin(['post', 'comment', 'share'])]['user_id'])),
    ('付费', set(orders['user_id'])),
]

rows, prev = [], None
for name, ids in steps:
    n = len(ids)
    rows.append({
        '步骤': name,
        '人数': n,
        '相对上一步(%)': round(n / prev * 100, 2) if prev else 100.0,
        '相对首步(%)': round(n / len(steps[0][1]) * 100, 2),
    })
    prev = n

funnel = pd.DataFrame(rows)
print(funnel.to_string(index=False))
print()
worst = funnel.iloc[1:].assign(流失=lambda d: 100 - d['相对上一步(%)']).sort_values('流失', ascending=False).iloc[0]
print(f"流失最大的环节：{worst['步骤']}（流失 {worst['流失']:.2f}%）")''',
 ['漏斗的核心是"每步用集合去重求人数"，再算相邻两步的转化率。',
  '同时给出"相对上一步"和"相对首步"两个口径——前者定位瓶颈，后者看整体效率。',
  '用 `set` 做去重比反复 `nunique` 更直观（数据量大时可用 `nunique`）。'],
 ['漏斗步骤之间不是"子集关系"却当成漏斗（例如"发帖用户"不一定"登录过"），会算出超过 100% 的转化率。',
  '只看最终转化率不看中间环节，无法定位问题在哪一步。']
),

# ---------------- 组 5：排名与统计 ----------------
(
 'c13', '排名与统计', '分组 TopN 与排名（nlargest / rank）',
 '"每个渠道消费最高的 3 个用户""各城市排名第一的品类"——这类需求用一套组合拳即可。',
 '''gmv = (orders.groupby('user_id')['amount'].sum()
        .reset_index(name='gmv')
        .merge(users[['user_id', 'channel', 'city']], on='user_id'))

# 方法一：sort + groupby + head（最直观）
top3 = (gmv.sort_values('gmv', ascending=False)
           .groupby('channel').head(3)
           .sort_values(['channel', 'gmv'], ascending=[True, False]))
print("各渠道消费 Top3（sort + head）：")
print(top3.to_string(index=False))
print()

# 方法二：rank 给组内排名（可继续筛选/打标）
gmv['组内排名'] = gmv.groupby('channel')['gmv'].rank(ascending=False, method='dense').astype(int)
gmv['组内占比(%)'] = (gmv['gmv'] / gmv.groupby('channel')['gmv'].transform('sum') * 100).round(2)
print("组内排名前 5 行：")
print(gmv.sort_values(['channel', '组内排名']).head().to_string(index=False))''',
 ['`sort_values` 后接 `groupby().head(n)` 是"分组取 TopN"最易读的写法。',
  '`rank(method=\'dense\')` 处理并列名次（1,2,2,3），`method=\'min\'` 则给 1,2,2,4。',
  '组内占比同样用 `transform(\'sum\')` 广播回每行，避免 merge。'],
 ['`groupby().head(n)` 前忘了先排序——取到的是"前 n 行"而不是"最大的 n 个"。',
  '并列名次处理不当（如用默认 `method=\'average\'`）导致排名出现小数。']
),
(
 'c14', '排名与统计', '相关性分析：用数据验证你的直觉',
 '业务常说"越活跃越愿意付费"。这种直觉必须用数据验证——相关系数就是最快的验证工具。',
 '''from scipy.stats import pearsonr

# 已付费用户的活跃天数 与 累计付费金额
login = events[events['event_type'] == 'login']
act = login.groupby('user_id')['event_date'].nunique().reset_index(name='active_days')
amt = orders.groupby('user_id')['amount'].sum().reset_index(name='gmv')
df = act.merge(amt, on='user_id', how='inner')

r, p = pearsonr(df['active_days'], df['gmv'])
print(f"样本量: {len(df)} 个已付费用户")
print(f"皮尔逊相关系数 r = {r:.3f}")
print(f"p 值 = {p:.4f}")
print()
print("按活跃天数分组的平均消费：")
print(df.groupby('active_days')['gmv'].agg(['count', 'mean']).round(2).head(8))''',
 ['`pearsonr` 返回 `(相关系数, p值)`：相关系数看强度（-1~1），p 值看是否显著（<0.05 通常认为显著）。',
  '**相关 ≠ 因果**：即使强相关，也不能说"活跃导致付费"——也可能是付费带来了更多活跃。',
  '相关系数接近 0 说明没有**线性**关系，但不代表完全无关（可能存在非线性关系，可看分组均值）。'],
 ['只看相关系数不看 p 值 / 样本量：几十个样本的 r=0.3 很可能只是噪声。',
  '把相关性当成因果，据此下"提升活跃就能提升付费"的结论。']
),
(
 'c15', '排名与统计', '卡方检验：判断 A/B 差异是否真实',
 '实验组转化率比对照组高 2%，这个差异是真实的还是随机波动？卡方检验是标准答案。',
 '''from scipy.stats import chi2_contingency

# 2×2 列联表：行 = 组别，列 = [转化, 未转化]
table = np.array([[480, 5000 - 480],    # 对照组
                  [545, 5000 - 545]])   # 实验组

chi2, p, dof, expected = chi2_contingency(table)

cvr_c = table[0, 0] / table[0].sum() * 100
cvr_t = table[1, 0] / table[1].sum() * 100

print(f"对照组转化率: {cvr_c:.2f}%")
print(f"实验组转化率: {cvr_t:.2f}%")
print(f"相对提升    : {(cvr_t/cvr_c - 1)*100:.2f}%")
print()
print(f"卡方统计量 chi2 = {chi2:.4f}")
print(f"自由度 dof      = {dof}")
print(f"p 值            = {p:.4f}")
print()
alpha = 0.05
print("结论：", "差异显著（拒绝原假设）" if p < alpha else "差异不显著（无法拒绝原假设）")
print()
print("期望频数（检验是否满足卡方使用条件，每个格子应 >=5）：")
print(pd.DataFrame(expected, index=['对照组', '实验组'],
                   columns=['转化', '未转化']).round(1))''',
 ['卡方检验回答的是"两组差异是否可能由随机造成"，`p < 0.05` 才能认为差异显著。',
  '**统计显著 ≠ 业务显著**：样本极大时，0.02% 的提升也会显著，但不值得为此增加系统复杂度。',
  '卡方检验要求期望频数 ≥5（至少 80% 的格子）。这里期望频数都很大，条件满足。'],
 ['p 值不显著却因为"方向是正的"就上线——等于在赌随机波动。',
  '为了凑显著性而反复观察/延长实验（peeking），会让假阳性率大幅上升。']
),
(
 'c16', '排名与统计', '结果落地：把分析结果导出成文件',
 '分析做完要交付。常见的两种格式：CSV（通用、轻量）与 Excel（多 sheet、方便业务方看）。',
 '''import os

os.makedirs('output', exist_ok=True)

# 1) 组装一张结果表
res = (users.merge(orders, on='user_id', how='left')
            .groupby('channel')
            .agg(用户数=('user_id', 'nunique'),
                 订单数=('order_id', 'count'),
                 收入=('amount', 'sum'))
            .round(2)
            .sort_values('收入', ascending=False)
            .reset_index())

# 2) 导出 CSV：utf-8-sig 能让 Excel 正确识别中文
csv_path = 'output/channel_summary.csv'
res.to_csv(csv_path, index=False, encoding='utf-8-sig')
print("已导出 CSV:", csv_path)
print("文件大小: %.1f KB" % (os.path.getsize(csv_path) / 1024))
print()

# 3) 导出 Excel（多 sheet，一个文件放多张表）
try:
    xlsx_path = 'output/report.xlsx'
    with pd.ExcelWriter(xlsx_path, engine='openpyxl') as w:
        res.to_excel(w, sheet_name='渠道汇总', index=False)
        users.head(100).to_excel(w, sheet_name='用户样本', index=False)
    print("已导出 Excel:", xlsx_path, "（含 2 个 sheet）")
except Exception as e:
    print("Excel 导出需要 openpyxl，未安装时可用 CSV 代替：", type(e).__name__)
    print("安装命令：pip install openpyxl")
print()
print("最终结果表：")
print(res.to_string(index=False))''',
 ['导出 CSV 用 `encoding=\'utf-8-sig\'`——否则 Excel 打开中文会乱码（这是国内环境最常见的坑）。',
  '`ExcelWriter` 的 `with` 语法可以一次写入多个 sheet，方便给业务方一份"报告"。',
  '导出前先 `reset_index()`，避免索引变成多余的一列。'],
 ['用默认 utf-8 导出 CSV，业务方用 Excel 打开全是乱码。',
  '导出 Excel 没装 `openpyxl` 导致报错——可以 `try/except` 降级到 CSV，或先 `pip install openpyxl`。']
),
]

# ============================================================
# 逐个真实运行，捕获输出
# ============================================================
import tempfile, shutil
workdir = tempfile.mkdtemp()
os.chdir(workdir)

results = []
for cid, group, title, scenario, code, notes, pitfalls in CASES:
    env = {'pd': pd, 'np': np, 'users': USERS.copy(), 'events': EVENTS.copy(),
           'orders': ORDERS.copy(), 'channels': CHANNELS.copy()}
    buf = io.StringIO()
    ok, err = True, ''
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(PREAMBLE + code, '<case>', 'exec'), env)
    except Exception as e:
        ok = False
        err = f'{type(e).__name__}: {e}'
    output = buf.getvalue().rstrip()
    results.append({'id': cid, 'group': group, 'title': title, 'scenario': scenario,
                    'code': PREAMBLE + code, 'output': output, 'ok': ok, 'err': err,
                    'notes': notes, 'pitfalls': pitfalls})
    print(f'{"OK " if ok else "FAIL"} {cid} {title}' + ('' if ok else '  -> ' + err))

shutil.rmtree(workdir, ignore_errors=True)

# ============================================================
# 输出 data/pycase.js
# ============================================================
def js_str(s):
    return json.dumps(s, ensure_ascii=False)

items = []
for r in results:
    items.append('{\n'
                 f"  id:{js_str(r['id'])}, group:{js_str(r['group'])}, title:{js_str(r['title'])},\n"
                 f"  scenario:{js_str(r['scenario'])},\n"
                 f"  code:{js_str(r['code'])},\n"
                 f"  output:{js_str(r['output'])},\n"
                 f"  notes:{json.dumps(r['notes'], ensure_ascii=False)},\n"
                 f"  pitfalls:{json.dumps(r['pitfalls'], ensure_ascii=False)}\n"
                 '}')

js = ('// 自动生成（生成器: tools/gen_pycases.py）\n'
      '// 注意：每个案例的 output 都是**真实运行**代码后捕获的标准输出，与代码严格一致。\n'
      'var PY_CASES = [\n' + ',\n'.join(items) + '\n];\n\n'
      'var PY_CASE_META = ' + json.dumps({
          'updated': '2026-09-12',
          'intro': 'Python 数据分析常用案例 · 每个案例都可直接复制到本地运行。代码下方的「运行结果」是用真实 pandas 跑出来的标准输出，不是手写的示意。',
          'env': 'pandas 2.2 / numpy 2.2 / scipy 1.15 · 数据集为平台内置的 users / events / orders / channels 四张表',
          'groups': list(dict.fromkeys([r['group'] for r in results]))
      }, ensure_ascii=False) + ';\n')

out = BASE + r'\data\pycase.js'
open(out, 'w', encoding='utf-8').write(js)
print()
print('OK 已生成', out)
print('案例数:', len(results), '| 文件大小: %.1f KB' % (os.path.getsize(out) / 1024))

# ============================================================
# 附：把 data/python.js 里的练习题参考解也跑一遍，输出预期结果
# ============================================================
src_py = open(BASE + r'\data\python.js', 'r', encoding='utf-8').read()
task_ids = re.findall(r"id:'(py\d+)'", src_py)
task_refs = []
for tid in task_ids:
    i = src_py.find("id:'" + tid + "'")
    nxt = src_py.find("id:'py", i + 5)
    seg = src_py[i: nxt if nxt > 0 else len(src_py)]
    m_sol = re.search(r"sol:`([\s\S]*?)`", seg)
    m_ttl = re.search(r"title:'([^']*)'", seg)
    if not m_sol:
        print('  MISS sol:', tid); continue
    code = m_sol.group(1)
    env = {'pd': pd, 'np': np, 'users': USERS.copy(), 'events': EVENTS.copy(),
           'orders': ORDERS.copy(), 'channels': CHANNELS.copy()}
    buf = io.StringIO()
    ok, err, val = True, '', ''
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(PREAMBLE + code, '<task>', 'exec'), env)
        val = repr(env.get('answer', 'NOT_FOUND'))
    except Exception as e:
        ok = False
        err = f'{type(e).__name__}: {e}'
    task_refs.append({'id': tid, 'title': m_ttl.group(1) if m_ttl else tid,
                      'code': PREAMBLE + code, 'output': buf.getvalue().rstrip(),
                      'answer': val, 'ok': ok, 'err': err})
    print(f'  {"OK " if ok else "FAIL"} {tid} answer={val}' + ('' if ok else ' -> ' + err))

ref_js = ('// 自动生成 · 练习题参考解与预期结果（真实运行得到）\n'
          'var PY_TASK_REFS = ' + json.dumps(task_refs, ensure_ascii=False, indent=1) + ';\n')
open(BASE + r'\data\pytask_ref.js', 'w', encoding='utf-8').write(ref_js)
print('OK 已生成 data/pytask_ref.js（', len(task_refs), '题）')

