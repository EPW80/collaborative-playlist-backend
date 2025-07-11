#!/bin/bash

# Collaborative Playlist Manager API Test Script
# Make sure your server is running on http://localhost:5000

BASE_URL="http://localhost:5000/api"
TOKEN=""

echo "🎵 Testing Collaborative Playlist Manager API"
echo "=============================================="

# Test 1: Register a user
echo "📝 1. Registering a new user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Response: $REGISTER_RESPONSE"
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed. Trying to login instead..."
  
  # Test 2: Login
  echo "🔐 2. Logging in..."
  LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }')
  
  echo "Response: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token. Exiting."
  exit 1
fi

echo "✅ Got authentication token"

# Test 3: Create a playlist
echo "📚 3. Creating a playlist..."
PLAYLIST_RESPONSE=$(curl -s -X POST $BASE_URL/playlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Test Playlist",
    "description": "A playlist created by API test",
    "isPublic": true
  }')

echo "Response: $PLAYLIST_RESPONSE"
PLAYLIST_ID=$(echo $PLAYLIST_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PLAYLIST_ID" ]; then
  echo "❌ Failed to create playlist"
  exit 1
fi

echo "✅ Created playlist with ID: $PLAYLIST_ID"

# Test 4: Get all playlists
echo "📋 4. Getting all playlists..."
curl -s -X GET $BASE_URL/playlists \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 5: Add a song to playlist
echo "🎵 5. Adding a song to playlist..."
SONG_RESPONSE=$(curl -s -X POST $BASE_URL/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"playlistId\": \"$PLAYLIST_ID\",
    \"name\": \"Bohemian Rhapsody\",
    \"artist\": \"Queen\",
    \"album\": \"A Night at the Opera\",
    \"duration\": 355
  }")

echo "Response: $SONG_RESPONSE"

# Test 6: Get songs from playlist
echo "🎼 6. Getting songs from playlist..."
curl -s -X GET "$BASE_URL/songs?playlistId=$PLAYLIST_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 7: Search for tracks (requires Spotify API key)
echo "🔍 7. Searching for tracks..."
curl -s -X GET "$BASE_URL/search/tracks?q=bohemian%20rhapsody&service=all&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 8: Get playlist by ID
echo "📖 8. Getting playlist by ID..."
curl -s -X GET $BASE_URL/playlists/$PLAYLIST_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 9: Update playlist
echo "✏️ 9. Updating playlist..."
curl -s -X PUT $BASE_URL/playlists/$PLAYLIST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Updated Test Playlist",
    "description": "Updated description"
  }' | jq '.'

echo ""
echo "🎉 API testing completed!"
echo "Note: Some tests may fail if external API keys (Spotify, Last.fm) are not configured."
