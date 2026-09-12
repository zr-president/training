# -*- coding: utf-8 -*-
"""生成测试页：进入 AI 产品经理页后自动切到「④ 面试题库」Tab"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'
h = open(BASE + r'\index.html', 'r', encoding='utf-8').read()
i = h.rfind('</body>')
inj = ('<script>window.addEventListener("load",function(){setTimeout(function(){'
       'try{var b=document.querySelector(\'[data-tab="iv"]\'); if(b) b.click();}catch(e){document.title="ERR:"+e.message;}'
       '},2200);});</script>')
out = h[:i] + inj + h[i:]
open(BASE + r'\_t_iv.html', 'w', encoding='utf-8').write(out)
print('OK 已生成 _t_iv.html')
