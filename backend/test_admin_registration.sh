#!/bin/bash

echo "🧪 Testing Enhanced Admin Registration System"
echo "=============================================="

BASE_URL="http://localhost:5000/api/auth/register"
ADMIN_SECRET="super_secret_admin_key_2025_playlist_manager"

echo ""
echo "📝 Test 1: Regular User Registration"
echo "-----------------------------------"
response1=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","email":"test_user@example.com","password":"password123"}')
echo "$response1" | python3 -m json.tool 2>/dev/null || echo "$response1"

echo ""
echo "📝 Test 2: Admin User Registration (valid secret)"
echo "-----------------------------------------------"
response2=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test_admin\",\"email\":\"test_admin@example.com\",\"password\":\"password123\",\"role\":\"admin\",\"adminSecret\":\"$ADMIN_SECRET\"}")
echo "$response2" | python3 -m json.tool 2>/dev/null || echo "$response2"

echo ""
echo "📝 Test 3: SuperAdmin User Registration"
echo "-------------------------------------"
response3=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test_superadmin\",\"email\":\"test_superadmin@example.com\",\"password\":\"password123\",\"role\":\"superadmin\",\"adminSecret\":\"$ADMIN_SECRET\"}")
echo "$response3" | python3 -m json.tool 2>/dev/null || echo "$response3"

echo ""
echo "📝 Test 4: Admin Registration with Wrong Secret (should fail)"
echo "-----------------------------------------------------------"
response4=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"username":"fail_admin","email":"fail_admin@example.com","password":"password123","role":"admin","adminSecret":"wrong_secret"}')
echo "$response4" | python3 -m json.tool 2>/dev/null || echo "$response4"

echo ""
echo "📝 Test 5: Invalid Role (should fail)"
echo "------------------------------------"
response5=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"invalid_role\",\"email\":\"invalid@example.com\",\"password\":\"password123\",\"role\":\"invalid_role\",\"adminSecret\":\"$ADMIN_SECRET\"}")
echo "$response5" | python3 -m json.tool 2>/dev/null || echo "$response5"

echo ""
echo "✅ All tests completed!"
