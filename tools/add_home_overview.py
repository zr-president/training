# -*- coding: utf-8 -*-
"""首页增加「这个训练场是什么」的概括说明（用户第 3 点要求）

内容分三层：
  1) 一句话定位：它不教你「知道」，只验证你「会」
  2) 三栏资产：学 / 练 / 验 各有多少东西
  3) 可展开的完整模块清单表（15 个模块，写明练什么）
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'

# ---------------- 1) app.js 插入概览区 ----------------
AP = os.path.join(T, 'js', 'app.js')
s = open(AP, encoding='utf-8').read()

ANCHOR = "    /* ---- 3 接着上次 ---- */"
if '这个训练场是什么' in s:
    print('ℹ️  概览区已存在')
elif ANCHOR not in s:
    print('❌ 找不到锚点')
    raise SystemExit(1)
else:
    OVERVIEW = r'''    /* ---- 2.5 训练场概览（整体说明） ---- */
    h += '<div class="home-sec">';
    h += '<div class="home-sec-h"><h3>这个训练场是什么</h3><span>一句话：它不教我「知道」，只验证我「会」</span></div>';
    h += '<div class="home-about">' +
         '<p>个人网站解决「我今天该关注什么」（信息中枢）；这里解决「我这项能力到底行不行」（刻意练习）。' +
         '三件事分开做：<b>系统学</b>（有人讲清为什么）→ <b>专项练</b>（动手做，自动判分）→ <b>检验判断</b>（写下预测，到期验证）。' +
         '全部纯前端，数据只存在本机浏览器，不上传任何服务器。</p>' +
         '</div>';
    h += '<div class="home-about-grid">';
    h += '<div><b>学</b><span>学习学院 · 15 门课 / 88 个单元</span><em>分 L0 元能力 / L1 决策素养 / L2 求职主线三层，每单元 7 步、以实战收尾</em></div>';
    h += '<div><b>练</b><span>专项训练 · 7 个模块 / 182 道题</span><em>SQL 31 · 数据集实验室 12 · 指标设计 8 · 实验分析 9 · Case 拆解 7 · AI 工作流 110 · 语音复述 5</em></div>';
    h += '<div><b>验</b><span>预测日志 + Brier 校准</span><em>写下判断与概率 → 到期判定对错 → 算出「说 70% 的那些是不是真对了七成」</em></div>';
    h += '</div>';

    /* 完整模块清单 */
    h += '<details class="acc" style="margin-top:12px"><summary>查看全部 15 个模块（各练什么）</summary><div class="accbody">';
    h += '<table class="home-tbl"><tr><th>模块</th><th>内容量</th><th>练什么</th></tr>';
    var MODROWS = [
      ['学习学院', '15 门课 / 88 单元', '系统教学：概念 + 核心图 + 例题 + 引导练习 + 变式 + 产物 + 复测'],
      ['预测日志', '—', '判断力校准：概率、Brier 分数、过度/欠自信'],
      ['SQL 训练场', '31 题 · 5 难度层', 'SQL 写法与自动判分（面试会现场出题）'],
      ['数据集实验室', '12 题 · 30 条参考 SQL', '分析思路：拆哪个维度、用什么口径'],
      ['指标设计', '8 场景 · 70 个候选指标', '辨别虚荣指标 / 存量指标 / 不可归因指标'],
      ['实验分析', '9 个 A/B 判读', 'peeking、护栏指标、分层异质性、分流质量'],
      ['Case 拆解', '7 个现象 · 34 个原因假设', '结构化拆解：列假设 → 设计验证 → 给方案'],
      ['AI 工作流', '110 题（36 核心 + 72 变式 + 2 挑战）', '把重复劳动拆成可检查的流程：工具 / 人工点 / 验收'],
      ['语音复述', '5 段材料 · CER 评分', '口头表达准确度：数字与术语最容易说错'],
      ['AI Agent 实操', '判读 3 + 实操 4 + 模板 3', '算清提效，而不是只看生成速度'],
      ['AI 产品经理', '判读 12 + PRD 4 + 面试 18', '（选修）AI 适用性、验收标准、成本测算、PRD 表达'],
      ['Python 案例', '22 个案例 + 6 道代码题', 'pandas 常用套路（读取/清洗/聚合/留存/统计）'],
      ['数据集', '4 张表在线预览', '字段结构与分页浏览，免下载'],
      ['30 天计划', '30 天 / 91 个任务', '从 0 开始的每日安排'],
      ['能力雷达', '9 维自评', '对照岗位要求，看先补哪个短板收益最高']
    ];
    MODROWS.forEach(function (r) {
      h += '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
    });
    h += '</table></div></details>';
    h += '</div>';

'''
    s = s.replace(ANCHOR, OVERVIEW + ANCHOR, 1)
    open(AP, 'w', encoding='utf-8').write(s)
    print('✅ 首页已插入概览区 + 模块清单表')

r = subprocess.run(['node', '--check', AP], capture_output=True, text=True, encoding='utf-8', errors='replace')
print('  语法:', 'OK' if r.returncode == 0 else 'FAIL ' + (r.stderr or '')[:300])

# ---------------- 2) CSS ----------------
CP = os.path.join(T, 'css', 'style.css')
css = open(CP, encoding='utf-8').read()
ADD = '''
/* 首页概览区 */
.home-about p{font-size:13px;color:var(--text2);line-height:1.95;margin:0}
.home-about b{color:var(--text)}
.home-about-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:13px}
.home-about-grid>div{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:15px 16px}
.home-about-grid b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:var(--mcl,var(--accent-light));color:var(--mc,var(--accent));font-size:12px;font-weight:800;margin-bottom:9px}
.home-about-grid span{display:block;font-size:12.5px;font-weight:700;color:var(--text);line-height:1.6}
.home-about-grid em{display:block;font-style:normal;font-size:11.5px;color:var(--text3);line-height:1.7;margin-top:5px}
.home-tbl{width:100%;border-collapse:collapse;font-size:12px}
.home-tbl th,.home-tbl td{border-bottom:1px solid var(--border);padding:7px 9px;text-align:left;vertical-align:top;line-height:1.7}
.home-tbl th{background:var(--bg2);font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
.home-tbl td b{color:var(--text)}
.home-tbl td:nth-child(2){color:var(--text3);white-space:nowrap}
.home-tbl tr:last-child td{border-bottom:none}
'''
if '.home-about-grid' not in css:
    css = css.rstrip() + '\n' + ADD
    open(CP, 'w', encoding='utf-8').write(css)
    print('✅ CSS 已加概览样式')
else:
    print('ℹ️  CSS 已有概览样式')
