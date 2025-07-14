#!/bin/bash

# Redis Setup Script for Development
# This script installs and configures Redis for the Collaborative Playlist Manager

echo "🚀 Setting up Redis for Collaborative Playlist Manager"
echo "=================================================="

# Check if Redis is already installed
if command -v redis-server &> /dev/null; then
    echo "✅ Redis is already installed"
    redis-server --version
else
    echo "📦 Installing Redis..."
    
    # Detect OS and install Redis
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y redis-server
        # CentOS/RHEL
        elif command -v yum &> /dev/null; then
            sudo yum install -y redis
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install redis
        else
            echo "❌ Homebrew not found. Please install Homebrew first."
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install Redis manually."
        exit 1
    fi
fi

# Start Redis service
echo "🔄 Starting Redis service..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start redis
fi

# Wait for Redis to start
sleep 2

# Test Redis connection
echo "🧪 Testing Redis connection..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is running and accessible"
else
    echo "❌ Redis connection failed"
    exit 1
fi

# Configure Redis for development
echo "⚙️  Configuring Redis for development..."

# Create Redis configuration directory if it doesn't exist
sudo mkdir -p /etc/redis

# Basic Redis configuration for development
cat << 'EOF' | sudo tee /etc/redis/redis-dev.conf
# Redis Development Configuration
port 6379
bind 127.0.0.1
timeout 0
tcp-keepalive 300
daemonize yes
supervised no
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly no
EOF

echo "✅ Redis configuration created at /etc/redis/redis-dev.conf"

# Set up Redis log directory
sudo mkdir -p /var/log/redis
sudo chown redis:redis /var/log/redis 2>/dev/null || true

# Create environment variables template
cat << 'EOF' > .env.redis
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TEST_DB=1
EOF

echo "✅ Redis environment template created (.env.redis)"

# Test basic Redis operations
echo "🧪 Testing Redis operations..."

redis-cli FLUSHDB > /dev/null
redis-cli SET test:key "Hello Redis" > /dev/null
TEST_VALUE=$(redis-cli GET test:key)

if [ "$TEST_VALUE" = "Hello Redis" ]; then
    echo "✅ Redis read/write operations working"
    redis-cli DEL test:key > /dev/null
else
    echo "❌ Redis operations failed"
fi

# Show Redis info
echo ""
echo "📊 Redis Information:"
echo "===================="
redis-cli INFO server | grep redis_version
redis-cli INFO memory | grep used_memory_human
redis-cli INFO stats | grep keyspace_hits

echo ""
echo "🎉 Redis setup completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Copy Redis environment variables:"
echo "   cat .env.redis >> .env"
echo ""
echo "2. Restart your application:"
echo "   npm start"
echo ""
echo "3. Test cache endpoints:"
echo "   curl http://localhost:5000/api/cache/health"
echo ""
echo "4. Monitor Redis:"
echo "   redis-cli MONITOR"
echo ""
echo "🔧 Redis Management Commands:"
echo "• Start Redis: redis-server"
echo "• Stop Redis: redis-cli SHUTDOWN"
echo "• Redis CLI: redis-cli"
echo "• Flush cache: redis-cli FLUSHDB"
echo "• Monitor operations: redis-cli MONITOR"
