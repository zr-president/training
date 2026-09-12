# -*- coding: utf-8 -*-
"""给数据集加入「注册但从未登录」的用户（约 4%），让流失诊断类题目有数据可查"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
FP = r'C:\Users\ZR\Desktop\钟锐的训练场\tools\gen_dataset.py'
c = open(FP, 'r', encoding='utf-8').read()

old = """    retain = ch_meta[ch][3]
    # 注册当天必有 login
    events.append((eid, u_id, reg_s, "login")); eid += 1"""
new = """    retain = ch_meta[ch][3]
    # 约 4% 用户「注册但从未登录」——真实产品普遍存在，供"流失诊断"类题目使用
    if random.random() < 0.04:
        continue
    # 注册当天必有 login
    events.append((eid, u_id, reg_s, "login")); eid += 1"""

if old in c:
    c = c.replace(old, new, 1)
    open(FP, 'w', encoding='utf-8').write(c)
    print('OK 生成器已更新')
else:
    print('MISS')
