@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 能力训练平台 · 本地预览 (端口 8924)

netstat -ano | findstr ":8924 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
  echo.
  echo  服务已经在运行了，直接打开浏览器...
  echo  地址: http://127.0.0.1:8924/
  echo.
  start "" http://127.0.0.1:8924/
  timeout /t 3 >nul
  exit /b
)

echo.
echo  ================================================
echo    能力训练平台 · 本地预览
echo  ================================================
echo.
echo    地址: http://127.0.0.1:8924/
echo.
echo    关闭这个窗口 = 停止服务
echo.
echo  ================================================
echo.

start "" http://127.0.0.1:8924/
python -m http.server 8924 --bind 127.0.0.1

echo.
echo  服务已停止。按任意键关闭窗口。
pause >nul
