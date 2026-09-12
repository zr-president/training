# -*- coding: utf-8 -*-
"""修正剩余深色专用颜色：输入框黑底、选中态青色、SVG 填充等"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'

PATCH = {
    'js/agent-module.js': [
        # 计算器输入框：深色底 → 代码区变量
        ("background:#05070e;border:1px solid var(--line2);border-radius:8px;color:var(--code-text);",
         "background:var(--code-bg);border:1px solid var(--border2);border-radius:8px;color:var(--code-text);"),
        ("#10b981", "var(--green)"),
    ],
    'js/quiz-module.js': [
        # 选项选中态：青色 → 主题色
        ("el.style.borderColor = on ? 'rgba(34,211,238,.55)' : 'var(--line)';",
         "el.style.borderColor = on ? 'var(--accent)' : 'var(--border)';"),
        ("el.style.background = on ? 'rgba(34,211,238,.10)' : 'var(--panel)';",
         "el.style.background = on ? 'var(--accent-light)' : 'var(--card)';"),
        ("el.style.borderColor = on ? 'var(--accent)' : 'var(--line2)';",
         "el.style.borderColor = on ? 'var(--accent)' : 'var(--border2)';"),
        ("mk.style.borderColor = on ? 'var(--accent)' : 'var(--line2)';",
         "mk.style.borderColor = on ? 'var(--accent)' : 'var(--border2)';"),
        ("rgba(52,211,153,.08)", "rgba(5,150,105,.07)"),
        ("rgba(251,113,133,.07)", "rgba(220,38,38,.06)"),
        ("rgba(251,191,36,.06)", "rgba(217,119,6,.07)"),
        ("rgba(34,211,238,.07)", "var(--accent-light)"),
    ],
    'js/radar-module.js': [
        # SVG 填充/描边 → 主题变量 + fill-opacity
        ('fill="rgba(167,139,250,.10)" stroke="var(--purple)" stroke-width="1.5" stroke-dasharray="4 3"',
         'fill="var(--purple)" fill-opacity="0.10" stroke="var(--purple)" stroke-width="1.5" stroke-dasharray="4 3"'),
        ('fill="rgba(34,211,238,.18)" stroke="var(--accent)" stroke-width="2"',
         'fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="2"'),
        ("stroke=\"rgba(255,255,255,' + (lv === 5 ? '.18' : '.08') + ')\"",
         "stroke=\"var(--border)\""),
    ],
    'js/case-module.js': [
        ("#10b981", "var(--green)"),
        ("rgba(251,191,36,.08)", "rgba(217,119,6,.07)"),
        ("rgba(251,113,133,.06)", "rgba(220,38,38,.06)"),
        ("rgba(34,211,238,.07)", "var(--accent-light)"),
    ],
    'js/lab-module.js': [
        ("#10b981", "var(--green)"),
        ("rgba(251,191,36,.06)", "rgba(217,119,6,.07)"),
    ],
}

for rel, reps in PATCH.items():
    p = BASE + '\\' + rel.replace('/', '\\')
    c = open(p, 'r', encoding='utf-8').read()
    n = 0
    for a, b in reps:
        if a in c:
            n += c.count(a)
            c = c.replace(a, b)
        else:
            print(f'  ⚠ {rel}: 未找到 -> {a[:60]}')
    open(p, 'w', encoding='utf-8').write(c)
    print(f'{rel}: 替换 {n} 处')
