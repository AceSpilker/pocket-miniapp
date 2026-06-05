#!/bin/bash
# 认证接口测试脚本
# 用法: sh test_auth.sh

BASE="http://localhost:8000/api/v1"

echo "================================================"
echo "  口袋小程序 认证接口测试"
echo "================================================"
echo ""

# 1. 健康检查
echo "▶ [1/6] 健康检查"
curl -s $BASE/../health | python3 -m json.tool
echo ""

# 2. 注册
echo "▶ [2/6] 注册新用户"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"123456","nickname":"演示用户"}')
echo "$REG" | python3 -m json.tool
ACCESS_TOKEN=$(echo "$REG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo ""

# 3. 登录
echo "▶ [3/6] 账号密码登录"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"123456"}')
echo "$LOGIN" | python3 -m json.tool
ACCESS_TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo ""

# 4. 获取用户信息
echo "▶ [4/6] 获取用户信息"
curl -s "$BASE/user/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
echo ""

# 5. 刷新 token
echo "▶ [5/6] 刷新 token"
REFRESH=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
curl -s -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}" | python3 -m json.tool
echo ""

# 6. 登出
echo "▶ [6/6] 退出登录"
curl -s -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
echo ""

echo "================================================"
echo "  ✅ 测试完成"
echo "================================================"