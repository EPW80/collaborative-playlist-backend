// Test the actual CacheService class
const path = require('path');

async function testCacheService() {
  try {
    console.log('📁 Loading CacheService...');
    
    // Load the cache service
    const cacheService = require('./src/services/cacheService');
    console.log('✅ CacheService loaded');
    console.log('🔍 Initial connection status:', cacheService.isConnected);
    
    // Test connection
    console.log('🔌 Connecting to Redis...');
    await cacheService.connect();
    console.log('✅ Connection attempt completed');
    console.log('🔍 Connection status:', cacheService.isConnected);
    
    if (cacheService.isConnected) {
      console.log('🧪 Testing cache operations...');
      
      // Test set
      console.log('Testing SET...');
      const setResult = await cacheService.set('test:service', { message: 'Hello from CacheService!' }, 30);
      console.log('SET result:', setResult);
      
      // Test get
      console.log('Testing GET...');
      const getResult = await cacheService.get('test:service');
      console.log('GET result:', getResult);
      
      // Test exists
      console.log('Testing EXISTS...');
      const existsResult = await cacheService.exists('test:service');
      console.log('EXISTS result:', existsResult);
      
      // Test delete
      console.log('Testing DELETE...');
      const delResult = await cacheService.del('test:service');
      console.log('DELETE result:', delResult);
      
      // Get metrics
      console.log('📊 Metrics:', cacheService.getMetrics());
      
      // Disconnect
      await cacheService.disconnect();
      console.log('✅ All tests completed successfully!');
    } else {
      console.log('❌ Failed to connect to Redis');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCacheService();
