#!/usr/bin/env node

/**
 * Cache Testing Script
 * Demonstrates and tests the Redis caching functionality
 */

const axios = require("axios");
const colors = require("colors");

const BASE_URL = "http://localhost:5000";
let authToken = null;

// Test user credentials (you may need to adjust these)
const testUser = {
  email: "test@example.com",
  password: "testpassword123",
  username: "testuser",
};

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data,
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `${error.response.status}: ${
          error.response.data.message || error.response.statusText
        }`
      );
    }
    throw error;
  }
}

/**
 * Authenticate user and get token
 */
async function authenticate() {
  console.log("🔐 Authenticating user...".blue);

  try {
    // Try to login first
    const loginResponse = await apiRequest("POST", "/api/auth/login", {
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginResponse.data.token;
    console.log("✅ Login successful".green);
    return loginResponse.data.user;
  } catch (error) {
    if (error.message.includes("400") || error.message.includes("401")) {
      console.log("📝 User not found, creating new user...".yellow);

      // Register new user
      const registerResponse = await apiRequest(
        "POST",
        "/api/auth/register",
        testUser
      );
      authToken = registerResponse.data.token;
      console.log("✅ Registration successful".green);
      return registerResponse.data.user;
    }
    throw error;
  }
}

/**
 * Test cache health and statistics
 */
async function testCacheHealth() {
  console.log("\n🏥 Testing cache health...".blue);

  try {
    const health = await apiRequest("GET", "/api/cache/health");
    console.log("✅ Cache health check:".green);
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Connected: ${health.data.connected}`);

    if (health.data.connected) {
      const stats = await apiRequest("GET", "/api/cache/stats");
      console.log("📊 Cache statistics:".cyan);
      if (stats.data.stats) {
        console.log(`   Keyspace hits: ${stats.data.stats.keyspace_hits || 0}`);
        console.log(
          `   Keyspace misses: ${stats.data.stats.keyspace_misses || 0}`
        );
        console.log(
          `   Connected clients: ${stats.data.stats.connected_clients || 0}`
        );
      }
    }
  } catch (error) {
    console.log(`❌ Cache health check failed: ${error.message}`.red);
  }
}

/**
 * Test playlist caching
 */
async function testPlaylistCaching(user) {
  console.log("\n📝 Testing playlist caching...".blue);

  try {
    // Create a test playlist
    console.log("Creating test playlist...".yellow);
    const playlist = await apiRequest("POST", "/api/playlists", {
      name: "Cache Test Playlist",
      description: "Testing cache functionality",
      isPublic: true,
    });

    const playlistId = playlist.data.playlist._id;
    console.log(`✅ Created playlist: ${playlistId}`.green);

    // First request (cache miss)
    console.log("🔍 First request (should be cache MISS)...".yellow);
    const start1 = Date.now();
    const response1 = await apiRequest("GET", `/api/playlists/${playlistId}`);
    const duration1 = Date.now() - start1;

    console.log(`   Response time: ${duration1}ms`);
    console.log(`   Cached: ${response1.cached ? "YES" : "NO"}`);

    // Second request (cache hit)
    console.log("🚀 Second request (should be cache HIT)...".yellow);
    const start2 = Date.now();
    const response2 = await apiRequest("GET", `/api/playlists/${playlistId}`);
    const duration2 = Date.now() - start2;

    console.log(`   Response time: ${duration2}ms`);
    console.log(`   Cached: ${response2.cached ? "YES" : "NO"}`);
    console.log(
      `   Performance improvement: ${
        Math.round((duration1 / duration2) * 100) / 100
      }x faster`.green
    );

    // Test cache invalidation
    console.log("🗑️  Testing cache invalidation...".yellow);
    await apiRequest("PUT", `/api/playlists/${playlistId}`, {
      name: "Updated Cache Test Playlist",
      description: "Updated description",
    });

    // Request after invalidation (cache miss again)
    console.log("🔄 Request after update (should be cache MISS)...".yellow);
    const start3 = Date.now();
    const response3 = await apiRequest("GET", `/api/playlists/${playlistId}`);
    const duration3 = Date.now() - start3;

    console.log(`   Response time: ${duration3}ms`);
    console.log(`   Cached: ${response3.cached ? "YES" : "NO"}`);
    console.log(
      `   Name updated: ${
        response3.data.playlist.name === "Updated Cache Test Playlist"
          ? "YES"
          : "NO"
      }`.green
    );

    // Cleanup
    await apiRequest("DELETE", `/api/playlists/${playlistId}`);
    console.log("🧹 Test playlist cleaned up".gray);
  } catch (error) {
    console.log(`❌ Playlist caching test failed: ${error.message}`.red);
  }
}

/**
 * Test user playlists caching
 */
async function testUserPlaylistsCaching() {
  console.log("\n👤 Testing user playlists caching...".blue);

  try {
    // First request (cache miss)
    console.log("🔍 First request for user playlists...".yellow);
    const start1 = Date.now();
    const response1 = await apiRequest("GET", "/api/playlists");
    const duration1 = Date.now() - start1;

    console.log(`   Response time: ${duration1}ms`);
    console.log(`   Cached: ${response1.cached ? "YES" : "NO"}`);
    console.log(`   Playlists count: ${response1.data.playlists.length}`);

    // Second request (cache hit)
    console.log("🚀 Second request for user playlists...".yellow);
    const start2 = Date.now();
    const response2 = await apiRequest("GET", "/api/playlists");
    const duration2 = Date.now() - start2;

    console.log(`   Response time: ${duration2}ms`);
    console.log(`   Cached: ${response2.cached ? "YES" : "NO"}`);
    console.log(
      `   Performance improvement: ${
        Math.round((duration1 / duration2) * 100) / 100
      }x faster`.green
    );
  } catch (error) {
    console.log(`❌ User playlists caching test failed: ${error.message}`.red);
  }
}

/**
 * Test manual cache operations
 */
async function testManualCacheOperations() {
  console.log("\n🔧 Testing manual cache operations...".blue);

  try {
    // Test cache invalidation
    console.log("🗑️  Testing cache invalidation...".yellow);
    const invalidateResponse = await apiRequest(
      "POST",
      "/api/cache/invalidate",
      {
        pattern: "user:*",
      }
    );

    console.log(
      `✅ Invalidated ${invalidateResponse.data.keysDeleted} cache keys`.green
    );

    // Test cache flush (development only)
    if (process.env.NODE_ENV !== "production") {
      console.log("🧹 Testing cache flush...".yellow);
      const flushResponse = await apiRequest("DELETE", "/api/cache/flush");
      console.log(`✅ ${flushResponse.message}`.green);
    }
  } catch (error) {
    console.log(`❌ Manual cache operations test failed: ${error.message}`.red);
  }
}

/**
 * Performance benchmark
 */
async function performanceBenchmark() {
  console.log("\n⚡ Running performance benchmark...".blue);

  try {
    const iterations = 5;
    const endpoint = "/api/playlists";

    console.log(`Running ${iterations} requests to ${endpoint}...`.yellow);

    let totalTime = 0;
    let cachedRequests = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const response = await apiRequest("GET", endpoint);
      const duration = Date.now() - start;

      totalTime += duration;
      if (response.cached) cachedRequests++;

      console.log(
        `   Request ${i + 1}: ${duration}ms ${
          response.cached ? "(cached)" : "(db)"
        }`
      );
    }

    const avgTime = Math.round(totalTime / iterations);
    const cacheHitRate = Math.round((cachedRequests / iterations) * 100);

    console.log(`📊 Benchmark Results:`.cyan);
    console.log(`   Average response time: ${avgTime}ms`);
    console.log(`   Cache hit rate: ${cacheHitRate}%`);
    console.log(`   Total requests: ${iterations}`);
    console.log(`   Cached requests: ${cachedRequests}`);
  } catch (error) {
    console.log(`❌ Performance benchmark failed: ${error.message}`.red);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🧪 Redis Cache Testing Suite".rainbow);
  console.log("============================\n");

  try {
    // Check if server is running
    await apiRequest("GET", "/health");
    console.log("✅ Server is running".green);

    // Authenticate user
    const user = await authenticate();

    // Run tests
    await testCacheHealth();
    await testUserPlaylistsCaching();
    await testPlaylistCaching(user);
    await testManualCacheOperations();
    await performanceBenchmark();

    console.log("\n🎉 All cache tests completed!".green.bold);
  } catch (error) {
    console.log(`\n💥 Test suite failed: ${error.message}`.red.bold);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

// Run the tests
runTests();
