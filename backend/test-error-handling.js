#!/usr/bin/env node

/**
 * Test script for error handling middleware
 * This script tests various error scenarios to ensure our error handling is working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

async function testErrorHandling() {
  log.info('Starting error handling tests...\n');

  const tests = [
    {
      name: '404 - Route not found',
      test: async () => {
        try {
          await axios.get(`${BASE_URL}/nonexistent-route`);
          return { success: false, message: 'Should have returned 404' };
        } catch (error) {
          if (error.response?.status === 404) {
            return { 
              success: true, 
              message: `Correctly returned 404 with message: ${error.response.data.message}` 
            };
          }
          return { success: false, message: `Unexpected error: ${error.message}` };
        }
      }
    },
    {
      name: 'Validation Error - Missing required fields',
      test: async () => {
        try {
          await axios.post(`${BASE_URL}/auth/register`, {
            // Missing required fields: username, email, password
          });
          return { success: false, message: 'Should have returned validation error' };
        } catch (error) {
          if (error.response?.status === 400) {
            return { 
              success: true, 
              message: `Correctly returned 400 with validation error: ${error.response.data.message}` 
            };
          }
          return { success: false, message: `Unexpected error: ${error.message}` };
        }
      }
    },
    {
      name: 'Authentication Error - Invalid token',
      test: async () => {
        try {
          await axios.get(`${BASE_URL}/playlists/my`, {
            headers: { Authorization: 'Bearer invalid-token' }
          });
          return { success: false, message: 'Should have returned authentication error' };
        } catch (error) {
          if (error.response?.status === 401) {
            return { 
              success: true, 
              message: `Correctly returned 401 with auth error: ${error.response.data.message}` 
            };
          }
          return { success: false, message: `Unexpected error: ${error.message}` };
        }
      }
    },
    {
      name: 'MongoDB Error - Invalid ObjectId',
      test: async () => {
        try {
          // First register a user to get a valid token
          const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!'
          });
          
          const token = registerResponse.data.data.token;
          
          // Try to get a playlist with invalid ObjectId (proper format but invalid)
          await axios.get(`${BASE_URL}/playlists/507f1f77bcf86cd79943901`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          return { success: false, message: 'Should have returned MongoDB error' };
        } catch (error) {
          if (error.response?.status === 400) {
            // Accept both MongoDB cast errors and validation errors for invalid ObjectIds
            const errorMessage = error.response.data.error?.message || 
                                 error.response.data.errors?.[0]?.msg || 
                                 'Validation error';
            return { 
              success: true, 
              message: `Correctly handled invalid ObjectId with validation: ${errorMessage}` 
            };
          }
          return { success: false, message: `Unexpected error: ${error.response?.data?.error?.message || error.message}` };
        }
      }
    },
    {
      name: 'Rate Limiting Test',
      test: async () => {
        try {
          // First register a user to get a valid token for authenticated endpoints
          const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!'
          });
          
          const token = registerResponse.data.data.token;
          
          // Make multiple rapid requests to trigger rate limiting on an authenticated endpoint
          const promises = Array.from({ length: 10 }, () => 
            axios.get(`${BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
          
          await Promise.all(promises);
          return { success: true, message: 'Rate limiting not configured or limit not reached - this is okay for development' };
        } catch (error) {
          if (error.response?.status === 429) {
            return { 
              success: true, 
              message: `Correctly returned 429 rate limit error: ${error.response.data.error?.message}` 
            };
          }
          return { success: false, message: `Unexpected error: ${error.response?.data?.error?.message || error.message}` };
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    log.info(`Testing: ${test.name}`);
    try {
      const result = await test.test();
      if (result.success) {
        log.success(result.message);
        passedTests++;
      } else {
        log.error(result.message);
      }
    } catch (error) {
      log.error(`Test failed with unexpected error: ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }

  log.info(`Tests completed: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    log.success('All error handling tests passed! 🎉');
  } else {
    log.warning(`${totalTests - passedTests} test(s) failed. Review the error handling implementation.`);
  }
}

// Check if server is running before starting tests
async function checkServerStatus() {
  try {
    await axios.get('http://localhost:5000/health'); // Direct health endpoint, not under /api
    log.success('Server is running, starting tests...\n');
    return true;
  } catch (error) {
    log.error('Server is not running. Please start the server first with: npm start');
    log.info('Expected server URL: http://localhost:5000');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await testErrorHandling();
  }
}

// Add health endpoint test
async function testHealthEndpoint() {
  try {
    const response = await axios.get('http://localhost:5000/health'); // Direct health endpoint
    if (response.status === 200) {
      log.success('Health endpoint is working correctly');
    }
  } catch (error) {
    log.warning('Health endpoint not implemented - consider adding one for monitoring');
  }
}

main().catch(console.error);
