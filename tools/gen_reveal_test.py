# -*- coding: utf-8 -*-
"""生成测试页：进入指标设计页后自动点「直接看答案」，用于验证解析是否显示"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE = r'C:\Users\ZR\Desktop\钟锐的训练场'
h = open(BASE + r'\index.html', 'r', encoding='utf-8').read()
i = h.rfind('</body>')
inj = ('<script>window.addEventListener("load",function(){setTimeout(function(){'
       'try{var b=document.getElementById("qkReveal"); if(b){b.click(); document.title="REVEALED";} else {document.title="NO-BUTTON";}'
       '}catch(e){document.title="ERR:"+e.message;}},2500);});</script>')
open(BASE + r'\_t_reveal.html', 'w', encoding='utf-8').write(h[:i] + inj + h[i:])
print('OK 已生成 _t_reveal.html')
