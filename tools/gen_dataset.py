# -*- coding: utf-8 -*-
"""生成「用户增长」训练数据集 → data/dataset.js
场景：一个内容社区 App（增长实验室）2026-08-01 ~ 2026-09-10 的用户行为数据
表：users / events / orders / channels
特点：渠道质量差异化（朋友推荐留存高、抖音量大留存低），便于练习留存/ROI/LTV/漏斗
"""
import io, sys, os, json, random
from datetime import date, timedelta
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

random.seed(20260912)
OUT = r'C:\Users\ZR\Desktop\钟锐的训练场\data\dataset.js'
OUT_META = r'C:\Users\ZR\Desktop\钟锐的训练场\data\dataset.meta.js'
os.makedirs(os.path.dirname(OUT), exist_ok=True)

START = date(2026, 8, 1)
END = date(2026, 9, 10)
DAYS = (END - START).days + 1

# 渠道：名称, 投放成本(元), 量级权重, 次日留存率, 付费率, 客单价
CHANNELS = [
    ("朋友推荐", 0,     9,  0.66, 0.38, 128),
    ("微信",     12000, 22, 0.52, 0.30, 112),
    ("小红书",   45000, 25, 0.38, 0.21, 98),
    ("B站",      38000, 15, 0.44, 0.25, 105),
    ("抖音",     88000, 42, 0.25, 0.13, 76),
    ("应用商店", 26000, 12, 0.33, 0.17, 88),
]
CITIES = [("广州", 18), ("深圳", 16), ("北京", 15), ("上海", 14), ("杭州", 11),
          ("成都", 9), ("武汉", 7), ("西安", 6), ("长沙", 4)]
GENDERS = [("男", 54), ("女", 46)]
PRODUCTS = ["会员月卡", "会员季卡", "会员年卡", "内容打赏", "虚拟礼物", "课程包"]

def wpick(pairs):
    total = sum(w for _, w in pairs)
    r = random.uniform(0, total)
    acc = 0
    for name, w in pairs:
        acc += w
        if r <= acc:
            return name
    return pairs[-1][0]

def d2s(d):
    return d.strftime("%Y-%m-%d")

# ---------- users ----------
N_USERS = 620
users = []          # (uid, reg_date, channel, city, age, gender)
uid = 10001
for i in range(N_USERS):
    reg = START + timedelta(days=random.randrange(DAYS))
    ch = wpick([(c[0], c[2]) for c in CHANNELS])
    city = wpick(CITIES)
    age = random.choice([18,19,20,21,22,23,24,25,26,27,28,29,30,32,35,38])
    gender = wpick(GENDERS)
    users.append((uid, d2s(reg), ch, city, age, gender))
    uid += 1

ch_meta = {c[0]: c for c in CHANNELS}
user_by_id = {u[0]: u for u in users}

# ---------- events ----------
# 行为：login / post / like / comment / share
events = []
eid = 1
for u in users:
    u_id, reg_s, ch, _, _, _ = u
    reg = date.fromisoformat(reg_s)
    retain = ch_meta[ch][3]
    # 约 4% 用户「注册但从未登录」——真实产品普遍存在，供"流失诊断"类题目使用
    if random.random() < 0.04:
        continue
    # 注册当天必有 login
    events.append((eid, u_id, reg_s, "login")); eid += 1
    # 后续行为：留存缓慢衰减（保留可分析的留存信号）
    active_days = 1
    span = min(DAYS - (reg - START).days, 30)
    for off in range(1, span):
        p = retain * (0.88 ** off) + 0.10
        if random.random() < p:
            d = reg + timedelta(days=off)
            if d > END:
                break
            events.append((eid, u_id, d2s(d), "login")); eid += 1
            active_days += 1
            # 活跃用户产生内容行为（用于漏斗分析）
            if active_days >= 2:
                if random.random() < 0.55:
                    events.append((eid, u_id, d2s(d), random.choice(["post", "post", "like", "comment", "share"]))); eid += 1
                if random.random() < 0.38:
                    events.append((eid, u_id, d2s(d), random.choice(["like", "comment", "share"]))); eid += 1

# ---------- orders ----------
orders = []
oid = 90001
for u in users:
    u_id, reg_s, ch, _, _, _ = u
    reg = date.fromisoformat(reg_s)
    pay_rate = ch_meta[ch][4]
    aov = ch_meta[ch][5]
    if random.random() < pay_rate:
        off = random.choice([0, 0, 1, 2, 3, 5, 7, 10, 14, 20])
        d = reg + timedelta(days=off)
        if d > END:
            d = reg
        amt = round(aov * random.uniform(0.6, 1.9), 2)
        orders.append((oid, u_id, d2s(d), amt, random.choice(PRODUCTS))); oid += 1
        # 复购
        if random.random() < 0.26:
            d2 = d + timedelta(days=random.choice([6, 12, 18, 25]))
            if d2 <= END:
                amt2 = round(aov * random.uniform(0.5, 1.6), 2)
                orders.append((oid, u_id, d2s(d2), amt2, random.choice(PRODUCTS))); oid += 1

# ---------- 输出 SQL ----------
def fmt(v):
    """SQL 字面量格式化（注意：必须逐个字段格式化，不能把条件表达式直接塞进 join）"""
    if v is None:
        return "NULL"
    if isinstance(v, str):
        return "'" + v.replace("'", "''") + "'"
    return str(v)

def insert_sql(table, cols, rows, per=20):
    """紧凑格式：每行多条记录，减小体积"""
    lines = [f"INSERT INTO {table} ({', '.join(cols)}) VALUES"]
    for i in range(0, len(rows), per):
        chunk = rows[i:i+per]
        rows_sql = ["(" + ",".join(fmt(v) for v in row) + ")" for row in chunk]
        lines.append(",".join(rows_sql) + ("," if i + per < len(rows) else ";"))
    return "\n".join(lines)

schema = [
    "DROP TABLE IF EXISTS orders;", "DROP TABLE IF EXISTS events;",
    "DROP TABLE IF EXISTS users;", "DROP TABLE IF EXISTS channels;",
    """CREATE TABLE channels (
  channel    TEXT PRIMARY KEY,   -- 渠道名
  cost       INTEGER,            -- 投放成本(元)
  channel_type TEXT              -- paid=付费投放 / organic=自然流量
);""",
    """CREATE TABLE users (
  user_id     INTEGER PRIMARY KEY,  -- 用户ID
  register_date TEXT,               -- 注册日期 (YYYY-MM-DD)
  channel     TEXT,                 -- 获客渠道
  city        TEXT,                 -- 城市
  age         INTEGER,              -- 年龄
  gender      TEXT                  -- 性别
);""",
    """CREATE TABLE events (
  event_id   INTEGER PRIMARY KEY,
  user_id    INTEGER,               -- 用户ID
  event_date TEXT,                  -- 事件日期
  event_type TEXT                   -- login/post/like/comment/share
);""",
    """CREATE TABLE orders (
  order_id   INTEGER PRIMARY KEY,
  user_id    INTEGER,               -- 用户ID
  order_date TEXT,                  -- 下单日期
  amount     REAL,                  -- 订单金额(元)
  product    TEXT                   -- 商品
);""",
]

ch_rows = [(name, cost, "organic" if cost == 0 else "paid") for name, cost, *_ in CHANNELS]

sql_parts = schema + [
    insert_sql("channels", ["channel", "cost", "channel_type"], ch_rows),
    insert_sql("users", ["user_id", "register_date", "channel", "city", "age", "gender"], users),
    insert_sql("events", ["event_id", "user_id", "event_date", "event_type"], events),
    insert_sql("orders", ["order_id", "user_id", "order_date", "amount", "product"], orders),
]
sql = "\n".join(sql_parts)

meta_note = f"""场景说明：内容社区App「增长实验室」，数据区间 {d2s(START)} ~ {d2s(END)}
用户 {len(users)} 人 · 行为 {len(events)} 条 · 订单 {len(orders)} 条 · 渠道 {len(ch_rows)} 个
渠道差异：朋友推荐(留存最高·自然流量) / 抖音(量最大但留存最低·成本最高) → 便于练习留存、ROI、LTV/CAC"""

# ---------- 字段元数据（供「数据集」页在线预览字段，无需下载） ----------
SCHEMA = [
    ("users", "用户表 · 每个注册用户一行", "user_id", [
        ("user_id", "INTEGER", "PRIMARY KEY", "用户ID（唯一标识）"),
        ("register_date", "TEXT", "", "注册日期，格式 YYYY-MM-DD"),
        ("channel", "TEXT", "", "获客渠道：朋友推荐/微信/小红书/B站/抖音/应用商店"),
        ("city", "TEXT", "", "城市：广州/深圳/北京/上海/杭州/成都/武汉/西安/长沙"),
        ("age", "INTEGER", "", "年龄（18-38）"),
        ("gender", "TEXT", "", "性别：男 / 女"),
    ]),
    ("events", "行为表 · 一次行为一行（login/post/like/comment/share）", "event_id", [
        ("event_id", "INTEGER", "PRIMARY KEY", "行为ID"),
        ("user_id", "INTEGER", "FOREIGN KEY → users", "用户ID"),
        ("event_date", "TEXT", "", "行为日期 YYYY-MM-DD"),
        ("event_type", "TEXT", "", "行为类型：login(登录)/post(发帖)/like(点赞)/comment(评论)/share(分享)"),
    ]),
    ("orders", "订单表 · 一笔付费一行", "order_id", [
        ("order_id", "INTEGER", "PRIMARY KEY", "订单ID"),
        ("user_id", "INTEGER", "FOREIGN KEY → users", "用户ID"),
        ("order_date", "TEXT", "", "下单日期 YYYY-MM-DD"),
        ("amount", "REAL", "", "订单金额（元）"),
        ("product", "TEXT", "", "商品：会员月卡/会员季卡/会员年卡/内容打赏/虚拟礼物/课程包"),
    ]),
    ("channels", "渠道表 · 一个获客渠道一行（含投放成本）", "channel", [
        ("channel", "TEXT", "PRIMARY KEY", "渠道名"),
        ("cost", "INTEGER", "", "投放成本（元），0 表示自然流量"),
        ("channel_type", "TEXT", "", "渠道类型：paid(付费投放) / organic(自然流量)"),
    ]),
]

row_counts = {"users": len(users), "events": len(events), "orders": len(orders), "channels": len(ch_rows)}
schema_js = [{"table": t, "desc": d, "pk": pk, "rows": row_counts[t],
              "fields": [{"name": f[0], "type": f[1], "key": f[2], "desc": f[3]} for f in fs]}
             for (t, d, pk, fs) in SCHEMA]

js = "// 自动生成，请勿手改（生成器: tools/gen_dataset.py）\n" \
     + "var DATASET_META = " + repr({"name": "增长实验室 · 用户增长数据集", "note": meta_note,
        "tables": [
          {"name": "users", "desc": "用户表（注册日期/渠道/城市/年龄/性别）", "rows": len(users)},
          {"name": "events", "desc": "行为表（login/post/like/comment/share）", "rows": len(events)},
          {"name": "orders", "desc": "订单表（金额/商品）", "rows": len(orders)},
          {"name": "channels", "desc": "渠道表（投放成本/类型）", "rows": len(ch_rows)}
        ]}).replace("'", '"') + ";\n\n"
js += "var DATASET_SQL = `\n" + sql + "\n`;\n"

# 元数据单独一个小文件（首页立即加载）；大数据集文件懒加载
meta_js = ("// 自动生成（生成器: tools/gen_dataset.py）· 仅元数据，体积小\n"
           + js.split("var DATASET_SQL = ")[0]
           + "\nvar DATASET_SCHEMA = " + json.dumps(schema_js, ensure_ascii=False) + ";\n")
open(OUT_META, 'w', encoding='utf-8').write(meta_js)
open(OUT, 'w', encoding='utf-8').write(js)
print('OK 已生成:', OUT, '+', OUT_META)
print(f'users={len(users)} events={len(events)} orders={len(orders)} channels={len(ch_rows)}')
print('数据集文件: %.1f KB | 元数据文件: %.1f KB' % (os.path.getsize(OUT) / 1024, os.path.getsize(OUT_META) / 1024))
