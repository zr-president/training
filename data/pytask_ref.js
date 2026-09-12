// 自动生成 · 练习题参考解与预期结果（真实运行得到）
var PY_TASK_REFS = [
 {
  "id": "py00",
  "title": "先不用 pandas：手算一遍次日留存率",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nfrom datetime import date, timedelta\n\nrecords = [\n    (1, '2026-08-01', ['2026-08-01', '2026-08-02', '2026-08-05']),\n    (2, '2026-08-01', ['2026-08-01']),\n    (3, '2026-08-02', ['2026-08-02', '2026-08-03']),\n    (4, '2026-08-02', ['2026-08-02']),\n    (5, '2026-08-03', ['2026-08-03', '2026-08-04']),\n    (6, '2026-08-03', ['2026-08-03']),\n    (7, '2026-08-04', ['2026-08-04']),\n    (8, '2026-08-04', ['2026-08-04', '2026-08-05']),\n]\n\nhit = 0\nfor uid, reg, logins in records:\n    d1 = (date.fromisoformat(reg) + timedelta(days=1)).isoformat()\n    if d1 in logins:\n        hit += 1\nanswer = round(hit * 100 / len(records), 2)\n",
  "output": "",
  "answer": "50.0",
  "ok": true,
  "err": ""
 },
 {
  "id": "py01",
  "title": "用 pandas 算各渠道次日留存率",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nimport pandas as pd\n\n# 1) 抖音渠道、且可观察次日行为的用户\nu = users[(users['channel'] == '抖音') & (users['register_date'] < '2026-09-10')].copy()\nu['next_day'] = (pd.to_datetime(u['register_date']) + pd.Timedelta(days=1)).dt.strftime('%Y-%m-%d')\n\n# 2) 次日登录行为\nlogin = events[events['event_type'] == 'login'][['user_id', 'event_date']]\nu = u.merge(login, left_on=['user_id', 'next_day'], right_on=['user_id', 'event_date'], how='left')\nu['retained'] = u['event_date'].notna()\n\n# 3) 留存率\nanswer = round(u['retained'].sum() / len(u) * 100, 2)\n",
  "output": "",
  "answer": "np.float64(27.32)",
  "ok": true,
  "err": ""
 },
 {
  "id": "py02",
  "title": "找出 DAU 最高的那一天",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nimport pandas as pd\n\nlogin = events[events['event_type'] == 'login']\ndau = login.groupby('event_date')['user_id'].nunique().reset_index(name='dau')\nanswer = dau.sort_values('dau', ascending=False).iloc[0]['event_date']\n",
  "output": "",
  "answer": "'2026-09-05'",
  "ok": true,
  "err": ""
 },
 {
  "id": "py03",
  "title": "用卡方检验判断 A/B 实验是否显著",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nimport numpy as np\nfrom scipy.stats import chi2_contingency\n\ntable = np.array([[480, 5000 - 480],\n                  [545, 5000 - 545]])\nchi2, p, dof, expected = chi2_contingency(table)\nanswer = round(float(p), 4)\n",
  "output": "",
  "answer": "0.0349",
  "ok": true,
  "err": ""
 },
 {
  "id": "py04",
  "title": "算出 LTV/CAC 最高的付费渠道",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nimport pandas as pd\n\nuc = users.groupby('channel')['user_id'].nunique().reset_index(name='users')\nrev = (users.merge(orders, on='user_id', how='inner')\n            .groupby('channel')['amount'].sum().reset_index(name='revenue'))\nc = channels[channels['cost'] > 0][['channel', 'cost']]\ndf = c.merge(uc, on='channel').merge(rev, on='channel', how='left').fillna({'revenue': 0})\ndf['ltv'] = df['revenue'] / df['users']\ndf['cac'] = df['cost'] / df['users']\ndf['ltv_cac'] = df['ltv'] / df['cac']\nanswer = df.sort_values('ltv_cac', ascending=False).iloc[0]['channel']\n",
  "output": "",
  "answer": "'微信'",
  "ok": true,
  "err": ""
 },
 {
  "id": "py05",
  "title": "用户活跃度与付费金额有关系吗？",
  "code": "import pandas as pd\nimport numpy as np\n\n# 四个表已加载为 DataFrame，直接用：\n#   users / events / orders / channels\npd.set_option('display.width', 130)\npd.set_option('display.max_columns', 30)\npd.set_option('display.float_format', lambda x: f'{x:,.2f}')\nimport pandas as pd\nfrom scipy.stats import pearsonr\n\nlogin = events[events['event_type'] == 'login']\nact = login.groupby('user_id')['event_date'].nunique().reset_index(name='active_days')\namt = orders.groupby('user_id')['amount'].sum().reset_index(name='gmv')\ndf = act.merge(amt, on='user_id', how='inner')\nanswer = round(float(pearsonr(df['active_days'], df['gmv'])[0]), 3)\n",
  "output": "",
  "answer": "0.226",
  "ok": true,
  "err": ""
 }
];
