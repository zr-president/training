# -*- coding: utf-8 -*-
"""给 gen_pycases.py 增补：①全部案例加「面试常考」标签 ②新增 6 个案例（c17-c22）
   注意：外层用 \"\"\" 定界，避免与案例代码里的 ''' 冲突
"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\gen_pycases.py'
c = open(FP, 'r', encoding='utf-8').read()

# ---------- 1) EXAM_TAGS ----------
if 'EXAM_TAGS' not in c:
    tags = '''# 面试常考标签（显示在案例标题旁，帮你判断该重点掌握哪些）
EXAM_TAGS = {
 'c01': ['基本功', '面试常考'],
 'c02': ['基本功'],
 'c03': ['面试常考', '留存前置'],
 'c04': ['面试常考', '必会'],
 'c05': ['运营高频'],
 'c06': ['面试必考'],
 'c07': ['面试必考', '最容易错'],
 'c08': ['面试常考'],
 'c09': ['进阶', '面试常考'],
 'c10': ['高频', '周报必备'],
 'c11': ['面试必考', '运营核心'],
 'c12': ['面试必考', '运营核心'],
 'c13': ['面试常考'],
 'c14': ['分析思维'],
 'c15': ['A/B 必考', '面试常考'],
 'c16': ['实用', '交付必备'],
 'c17': ['面试常考'],
 'c18': ['面试常考'],
 'c19': ['实用'],
 'c20': ['实用'],
 'c21': ['面试常考'],
 'c22': ['实用'],
}

'''
    c = c.replace('CASES = [', tags + 'CASES = [', 1)
    print('OK 已插入 EXAM_TAGS')

# ---------- 2) 追加新案例（外层用双三引号） ----------
NEW = r"""
(
 'c17', '时间序列与留存', '时间重采样与移动平均（resample / rolling）',
 '原始数据是"每天一条"的事件明细，但看趋势时按天太抖。重采样（resample）能把日粒度聚合成周/月，滚动平均则能平滑掉短期噪音。',
 '''events['evt_dt'] = pd.to_datetime(events['event_date'])
login = events[events['event_type'] == 'login'].copy().set_index('evt_dt')

# 按周重采样（D=日, W=周, M=月）
weekly = login['user_id'].resample('W').nunique().to_frame('周活跃用户')

# 移动平均：平滑短期波动，看真实趋势
weekly['近4周均值'] = weekly['周活跃用户'].rolling(4).mean().round(1)
weekly['环比(%)'] = (weekly['周活跃用户'].pct_change() * 100).round(1)

print(weekly)
print()
print("波动幅度对比：原始标准差 %.2f，4 周滑动后 %.2f"
      % (weekly['周活跃用户'].std(), weekly['近4周均值'].std()))''',
 ['`resample` 需要先把日期设为**索引**（`set_index`），这是和 `groupby` 最大的区别。',
  '常用频率：`D` 日 / `W` 周 / `M` 月 / `Q` 季。',
  '`rolling(4).mean()` 是移动平均——前 3 行必然是 NaN（窗口不够），展示时要处理。'],
 ['忘了先 `set_index` 日期，直接 `resample` 会报错（它只对时间索引生效）。',
  '用了移动平均却忽略开头的 NaN，导致画图时曲线起点缺失。']
),
(
 'c18', '聚合与合并', '表格拼接：纵向堆叠与横向拼接（concat）',
 'merge 是"按键关联"，concat 是"物理拼接"：纵向把多批数据摞起来，横向把多列指标并排起来。两者用途完全不同。',
 '''# ① 纵向堆叠：结构相同的多批数据摞起来（如多个月份的导出文件）
w1 = users.head(5).copy(); w1['批次'] = '第一批'
w2 = users.tail(5).copy(); w2['批次'] = '第二批'
stacked = pd.concat([w1, w2], ignore_index=True)
print("纵向堆叠后 shape:", stacked.shape)
print(stacked['批次'].value_counts().to_string())
print()

# ② 横向拼接：按索引对齐，把不同来源的指标并到一起
u = users.set_index('user_id')
gmv = orders.groupby('user_id')['amount'].sum().rename('gmv')
joined = pd.concat([u, gmv], axis=1)
print("横向拼接后列:", list(joined.columns))
print(joined[['channel', 'gmv']].head(3))
print()
print("未付费（gmv 为空）人数:", int(joined['gmv'].isna().sum()))''',
 ['`axis=0`（默认）纵向堆叠，`axis=1` 横向拼接——**方向搞反是最常见的错误**。',
  '`ignore_index=True` 重新生成行号；不加则保留原索引（容易出现重复索引）。',
  '横向拼接是**按索引对齐**的：对不上的地方填 NaN——这正好可以用来找出"未付费用户"。'],
 ['纵向堆叠时列名不一致，导致大量 NaN 列——拼接前应先统一列名。',
  '误以为 `axis=1` 是按列名对齐：它其实按**索引**对齐，列名不同也照样拼。']
),
(
 'c19', '数据清洗与加工', '分层抽样：保证每层都抽到人（groupby + sample）',
 '直接 `sample()` 可能某些分层一个人都没抽到。做分层分析或人工标注时，必须保证**每层都有样本**。',
 '''users['age_band'] = pd.cut(users['age'], bins=[0, 21, 25, 29, 100],
                           labels=['18-21', '22-25', '26-29', '30+'])

# ① 每层固定抽 10 个（层内不足 10 个则全取）
fixed = (users.groupby('age_band', observed=False, group_keys=False)
              .apply(lambda d: d.sample(min(10, len(d)), random_state=42)))
print("每层抽 10 个后，各层样本量：")
print(fixed['age_band'].value_counts().sort_index().to_string())
print()

# ② 每层按相同比例抽 10%（保持与原分布一致）
prop = (users.groupby('age_band', observed=False, group_keys=False)
             .apply(lambda d: d.sample(frac=0.1, random_state=42)))
print("每层抽 10% 后，各层样本量：")
print(prop['age_band'].value_counts().sort_index().to_string())
print()
print("原始分布(%)：")
print((users['age_band'].value_counts(normalize=True).sort_index() * 100).round(1).to_string())''',
 ['`groupby(...).sample()` 是分层抽样的标准写法；`group_keys=False` 避免多出一层索引。',
  '**固定数量 vs 固定比例**：人工标注用固定数量（每层 10 条好分配），统计推断用固定比例（保持分布）。',
  '`random_state=42` 固定随机种子保证可复现——写分析脚本务必带上。'],
 ['直接 `df.sample(n)` 导致小分层一个样本都没有，分层结论无法计算。',
  '抽样不设 `random_state`，每次结果不同，无法复现也无法交接。']
),
(
 'c20', '数据读取与体检', 'Excel 多 sheet 读写（一次读回全部工作表）',
 '业务方的数据经常是一个 Excel 里放多个 sheet。`sheet_name=None` 能一次读回所有表并返回字典，省去反复调用。',
 '''import os
os.makedirs('output', exist_ok=True)
path = 'output/report_multi.xlsx'

# ① 一次写出多个 sheet
with pd.ExcelWriter(path, engine='openpyxl') as w:
    users.head(50).to_excel(w, sheet_name='用户样本', index=False)
    orders.to_excel(w, sheet_name='订单', index=False)
    channels.to_excel(w, sheet_name='渠道', index=False)
print("已写出:", path, "(%.1f KB)" % (os.path.getsize(path) / 1024))
print()

# ② 一次读回所有 sheet（返回 dict: 表名 -> DataFrame）
sheets = pd.read_excel(path, sheet_name=None)
print("读回的工作表:", list(sheets.keys()))
for name, df in sheets.items():
    print("  %s: %d 行 × %d 列" % (name, df.shape[0], df.shape[1]))
print()
print(sheets['渠道'])

os.remove(path)''',
 ['`sheet_name=None` 返回 **dict**（表名 → DataFrame），`.items()` 遍历即可批量处理。',
  '读写 Excel 需要 `openpyxl`（`pip install openpyxl`）。',
  '`index=False` 避免把行号写进 Excel——业务方看到多余的索引列会很困惑。'],
 ['只读 `sheet_name=\\'Sheet1\\'`，漏掉其它工作表还不知道——用 `None` 一次读全更安全。',
  '忘了装 `openpyxl`，报 "Missing optional dependency" 却以为是代码问题。']
),
(
 'c21', '数据清洗与加工', '长宽表转换：melt 与 pivot（数据整形）',
 '"宽表"适合人看报表，"长表"适合画图和建模。这两步转换是数据分析的中转站，必会。',
 '''users['reg_dt'] = pd.to_datetime(users['register_date'])
users['ym'] = users['reg_dt'].dt.to_period('M').astype(str)

# 宽表：渠道（行） × 月份（列）
wide = pd.pivot_table(users, index='channel', columns='ym',
                      values='user_id', aggfunc='nunique', fill_value=0)
print("宽表（人看）：")
print(wide)
print()

# 宽 -> 长：每行一个"渠道+月份+数值"，适合画图与建模
long = (wide.reset_index()
            .melt(id_vars='channel', var_name='月份', value_name='用户数'))
print("长表前 5 行（机器用）：")
print(long.head().to_string(index=False))
print()

# 长 -> 宽：转回报表形态
back = long.pivot(index='channel', columns='月份', values='用户数').fillna(0).astype(int)
print("再转回宽表（取前两列）：")
print(back.iloc[:, :2])''',
 ['`melt` 把"多列"压成"两列"（一列放原列名，一列放数值）——画图/入库的标准形态。',
  '`pivot` 是 `melt` 的逆操作：把"某列的值"变成新的列名。',
  '宽表适合人看，长表适合机器处理（如 seaborn 的 `hue` 就要求长表）。'],
 ['`pivot` 报 "Index contains duplicate entries"——说明"行+列"组合有重复，应改用 `pivot_table`（自带聚合）。',
  '忘了 `fill_value=0`，空组合变成 NaN，后续计算或画图出问题。']
),
(
 'c22', '排名与统计', '给图表准备数据（画图前的最后一步）',
 '画图本身很简单，难的是把数据整理成"画图要的形状"。这里演示最常用的两种：趋势折线图与堆叠面积图。',
 '''users['reg_dt'] = pd.to_datetime(users['register_date'])
users['ym'] = users['reg_dt'].dt.to_period('M').astype(str)

# 取用户量 Top3 渠道，做"月份 × 渠道"的宽表
top3 = users['channel'].value_counts().head(3).index.tolist()
plot_df = (users[users['channel'].isin(top3)]
           .groupby(['ym', 'channel'], observed=False)['user_id']
           .nunique()
           .unstack(fill_value=0))
print("折线图数据（index=月份, columns=渠道）：")
print(plot_df)
print()
print("画折线图：df.plot(marker='o')")
print("画堆叠面积图：df.cumsum().plot.area(stacked=True)")
print()
print("累计值（堆叠面积图用）：")
print(plot_df.cumsum().tail(3))
print()
print("各渠道占 Top3 总量比例(%)：")
print((plot_df.sum() / plot_df.sum().sum() * 100).round(1).to_string())''',
 ['折线图要"宽表"（行是时间、列是分组），`unstack()` 正好把长表转成这个形状。',
  '堆叠图通常用**累计值**（`cumsum`），让曲线体现"累积贡献"。',
  '画图前先算好比例列，比在图里硬编码百分比更可靠。'],
 ['把长表直接丢给 `plot()`，得到一团乱线——画分组图前必须 `unstack` / `pivot`。',
  '不筛选 TopN，把所有渠道都画上，图例挤成一团什么也看不清。']
),
]"""

m = re.search(r"\n\]\s*\n", c)
if m and 'c17' not in c:
    c = c[:m.start()] + NEW + c[m.end() - 1:]
    print('OK 已追加 6 个新案例')
else:
    print('MISS 或已存在')

# ---------- 3) 输出带 exam ----------
old_out = """    items.append('{\\n'
                 f"  id:{js_str(r['id'])}, group:{js_str(r['group'])}, title:{js_str(r['title'])},\\n\""""
new_out = """    items.append('{\\n'
                 f"  id:{js_str(r['id'])}, group:{js_str(r['group'])}, title:{js_str(r['title'])},\\n"
                 f"  exam:{json.dumps(EXAM_TAGS.get(r['id'], []), ensure_ascii=False)},\\n\""""
if old_out in c:
    c = c.replace(old_out, new_out, 1)
    print('OK 输出已带 exam')
else:
    print('MISS 输出模板')

open(FP, 'w', encoding='utf-8').write(c)
print('done')
