# -*- coding: utf-8 -*-
"""一键部署：把当前 main 内容同步到 gh-pages 分支（GitHub Pages 从这里发布）
用法：python tools/deploy.py
"""
import io, sys, subprocess, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run(cmd, quiet=True):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if not quiet and r.stdout:
        print(r.stdout.strip())
    return r.returncode, (r.stdout or '') + (r.stderr or '')

print('=== 部署到 GitHub Pages ===')

# 1) 确认工作区干净（避免漏提交）
code, out = run('git status --porcelain')
if out.strip():
    print('⚠️ 工作区有未提交的改动，请先 git commit：')
    print(out.strip()[:800])
    sys.exit(1)
print('✅ 工作区干净')

# 2) 取当前提交
code, head = run('git rev-parse HEAD')
head = head.strip()
print('当前 main HEAD:', head[:12])

# 3) 推送到 gh-pages（Pages 从该分支发布）
ok = False
for i in range(1, 9):
    code, out = run('git push origin main:gh-pages --force')
    if code == 0:
        ok = True
        print(f'✅ 已同步到 gh-pages（第 {i} 次尝试）')
        break
    print(f'⚠️ 第 {i} 次推送失败，重试…')
    time.sleep(8)

if not ok:
    print('❌ 推送失败，请检查网络后重试')
    sys.exit(1)

print()
print('线上地址: https://zr-president.github.io/training/')
print('（Pages 构建通常需要 30-90 秒生效）')
