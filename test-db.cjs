const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'Winston',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sidebar_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Test uuid extension
    const uuidResult = await client.query('SELECT uuid_generate_v4() as test_uuid');
    console.log('✅ UUID extension working:', uuidResult.rows[0].test_uuid);
    
    // Check all tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('✅ Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test insert and select on users table
    console.log('\n🧪 Testing basic CRUD operations...');
    
    // Insert test user
    const insertResult = await client.query(`
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email, created_at
    `, ['testuser', 'test@example.com', 'hashed_password_placeholder']);
    
    console.log('✅ Inserted test user:', insertResult.rows[0]);
    
    // Select test user
    const selectResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    console.log('✅ Retrieved test user:', selectResult.rows[0]);
    
    // Clean up test user
    await client.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    console.log('✅ Cleaned up test data');
    
    client.release();
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabase();
