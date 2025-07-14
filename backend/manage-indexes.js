#!/usr/bin/env node

/**
 * @fileoverview Database index management CLI tool
 * @description Command-line utility for managing database indexes
 */

const mongoose = require('mongoose');
const { createIndexes, getIndexInfo, recreateIndexes } = require('./src/utils/indexMigration');
const config = require('./src/config/index');

const commands = {
  create: createIndexes,
  info: getIndexInfo,
  recreate: recreateIndexes
};

async function main() {
  const command = process.argv[2];

  if (!command || !commands[command]) {
    console.log(`
🔧 Database Index Management Tool

Usage: node manage-indexes.js <command>

Commands:
  create    - Create all indexes (safe, won't drop existing)
  info      - Show current index information
  recreate  - Drop and recreate all indexes (⚠️  USE WITH CAUTION)

Examples:
  node manage-indexes.js create
  node manage-indexes.js info
  node manage-indexes.js recreate
    `);
    process.exit(1);
  }

  try {
    console.log(`🚀 Connecting to database...`);
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Connected to MongoDB`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔧 Running command: ${command}\n`);

    const result = await commands[command]();

    if (command === 'info') {
      console.log('\n📊 Current Database Indexes:');
      console.log('================================');
      
      Object.entries(result).forEach(([collection, indexes]) => {
        console.log(`\n${collection.toUpperCase()}:`);
        Object.entries(indexes).forEach(([name, index]) => {
          const keys = Object.keys(index.key || {}).join(', ');
          console.log(`  • ${name}: {${keys}}`);
        });
      });
    }

    console.log('\n✅ Operation completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

main();
