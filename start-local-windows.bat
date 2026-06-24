@echo off
title Com Tam Lang CEO Report Dashboard
cd /d %~dp0
if not exist node_modules (
  echo Dang cai dependencies. Lan dau co the mat vai phut...
  npm install
)
echo.
echo Mo trinh duyet: http://localhost:3000
echo Mat khau test: CEO=ceo123 | Ke toan=ketoan123 | Admin=admin123
echo.
npm run dev
pause
