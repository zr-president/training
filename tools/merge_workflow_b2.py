# -*- coding: utf-8 -*-
"""把第二批 12 题合并进 data/workflow.js，并校验"""
import io, sys, os, re, subprocess, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
MAIN = os.path.join(T, 'data', 'workflow.js')
B2 = os.path.join(T, 'data', '_workflow_batch2.js')

main = open(MAIN, encoding='utf-8').read()
b2 = open(B2, encoding='utf-8').read()

# 从 b2 里取出数组内容（第一个 '[' 之后到最后一个 '];' 之前）
i = b2.find('[')
j = b2.rfind('];')
if i < 0 or j < 0:
    print('❌ 无法解析 batch2')
    raise SystemExit(1)
body = b2[i + 1:j].strip()

# 主文件里最后一个 '];' 前插入
k = main.rfind('];')
if k < 0:
    print('❌ 主文件结构异常')
    raise SystemExit(1)
new = main[:k].rstrip()
# 原本以 '}' 结尾（最后一个对象），补逗号
if not new.endswith(','):
    new = new + ','
new = new + '\n\n/* ============ 第二批：高错误成本 / 团队规范 / 选型 / 版本化 / 效果评估 / 本地化 ============ */\n' + body + '\n\n' + main[k:]

open(MAIN, 'w', encoding='utf-8').write(new)
print('✅ 已合并，workflow.js: %d → %d 字节' % (len(main), len(new)))

# 删掉临时文件
os.remove(B2)
print('已删除临时文件')

# 语法检查
r = subprocess.run(['node', '--check', MAIN], capture_output=True, text=True)
print('语法：', 'OK' if r.returncode == 0 else 'FAIL ' + r.stderr[:400])

# 结构校验
CHECK = r'''
const fs=require('fs'),vm=require('vm');
const c={};vm.createContext(c);
vm.runInContext(fs.readFileSync('data/workflow.js','utf8'),c);
const Q=c.WORKFLOW_QUESTIONS;
console.log('题数:', Q.length);
const ids=Q.map(q=>q.id);
const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
console.log('重复 id:', dup.length?dup.join(','):'无');
const tracks={},tags={};
Q.forEach(q=>{tracks[q.track]=(tracks[q.track]||0)+1;tags[q.tag]=(tags[q.tag]||0)+1;});
console.log('track 分布:', JSON.stringify(tracks));
console.log('tag 分布:', JSON.stringify(tags));
// 必填字段
const REQ=['id','icon','tag','track','title','scenario','constraints','deliverable','rubric','reference','pitfalls'];
let bad=[];
Q.forEach(q=>{
  REQ.forEach(f=>{ if(q[f]===undefined||q[f]===null) bad.push(q.id+'.'+f); });
  if(q.rubric&&q.rubric.length!==3) bad.push(q.id+'.rubric长度='+q.rubric.length);
  if(q.constraints&&q.constraints.length<3) bad.push(q.id+'.constraints<3');
  const r=q.reference||{};
  ['steps','gates','accept'].forEach(f=>{ if(!r[f]||!r[f].length) bad.push(q.id+'.reference.'+f); });
  if(!r.why||!r.why.length) bad.push(q.id+'.reference.why');
});
console.log('字段缺失/异常:', bad.length?bad.join(', '):'无');
console.log('每题 info 总字数平均:', Math.round(Q.reduce((s,q)=>s+JSON.stringify(q).length,0)/Q.length));
'''
tmp = os.path.join(T, 'tools', '_wf_check.js')
open(tmp, 'w', encoding='utf-8').write(CHECK)
r2 = subprocess.run(['node', 'tools/_wf_check.js'], capture_output=True, text=True,
                    encoding='utf-8', errors='replace', cwd=T)
print()
print(r2.stdout or r2.stderr[:800])
os.remove(tmp)
