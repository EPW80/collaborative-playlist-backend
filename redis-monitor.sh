#!/bin/bash

# Redis Cloud Connection Details
REDIS_HOST="redis-13928.c323.us-east-1-2.ec2.redns.redis-cloud.com"
REDIS_PORT="13928"
REDIS_PASS="DWG8GWqxBa6HWIUWAfTj5BDn7XtNKjsp"

echo "🔍 Redis Monitoring Dashboard"
echo "=================================="

# Connection test
echo "🔗 Testing connection..."
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS ping

echo ""
echo "📊 Memory Usage:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS info memory | grep "used_memory_human\|maxmemory_policy"

echo ""
echo "📈 Performance Stats:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS info stats | grep -E "keyspace_hits|keyspace_misses|total_commands_processed|instantaneous_ops_per_sec"

echo ""
echo "🗝️  Current Cache Keys:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS keys "*"

echo ""
echo "📊 Key Count:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS dbsize

echo ""
echo "🔄 Cache Hit Rate:"
HITS=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS info stats | grep "keyspace_hits" | cut -d: -f2 | tr -d '\r')
MISSES=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS info stats | grep "keyspace_misses" | cut -d: -f2 | tr -d '\r')
TOTAL=$((HITS + MISSES))
if [ $TOTAL -gt 0 ]; then
    HIT_RATE=$(echo "scale=2; $HITS * 100 / $TOTAL" | bc)
    echo "Hits: $HITS, Misses: $MISSES, Hit Rate: ${HIT_RATE}%"
else
    echo "No cache operations yet"
fi
