#!/usr/bin/env node

// Database adapter validation script
const DatabaseFactory = require('../backend/database');

async function testAdapters() {
  console.log('=== Testing Database Adapters ===\n');
  
  // Test MongoDB adapter
  console.log('1. Testing MongoDB Adapter:');
  process.env.DB_TYPE = 'mongodb';
  try {
    const mongoAdapter = await DatabaseFactory.createAdapter();
    console.log('   ✓ MongoDB adapter created successfully');
    console.log('   Type:', mongoAdapter.constructor.name);
  } catch (error) {
    console.log('   ✗ MongoDB adapter failed:', error.message);
  }
  
  console.log('');
  
  // Test Oracle adapter
  console.log('2. Testing Oracle Adapter:');
  process.env.DB_TYPE = 'oracle';
  try {
    const oracleAdapter = await DatabaseFactory.createAdapter();
    console.log('   ✓ Oracle adapter created successfully');
    console.log('   Type:', oracleAdapter.constructor.name);
  } catch (error) {
    console.log('   ✗ Oracle adapter failed:', error.message);
  }
  
  console.log('');
  
  // Test default behavior
  console.log('3. Testing Default Behavior (no DB_TYPE set):');
  delete process.env.DB_TYPE;
  try {
    const defaultAdapter = await DatabaseFactory.createAdapter();
    console.log('   ✓ Default adapter created successfully');
    console.log('   Type:', defaultAdapter.constructor.name);
  } catch (error) {
    console.log('   ✗ Default adapter failed:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testAdapters().catch(console.error);