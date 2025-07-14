const redis = require('redis');

async function testRedis() {
  console.log('🔌 Creating Redis client...');
  
  try {
    const client = redis.createClient({
      socket: {
        host: 'localhost',
        port: 6379,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      }
    });

    console.log('📡 Connecting to Redis...');
    await client.connect();
    
    console.log('✅ Connected! Testing operations...');
    
    // Test set
    await client.setEx('test:simple', 10, JSON.stringify({ message: 'Hello Redis v4!' }));
    console.log('✅ SET operation successful');
    
    // Test get
    const result = await client.get('test:simple');
    console.log('✅ GET operation successful:', JSON.parse(result));
    
    // Test delete
    await client.del('test:simple');
    console.log('✅ DELETE operation successful');
    
    await client.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRedis();
