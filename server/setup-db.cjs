#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function setupDatabase() {
  console.log('Setting up PostgreSQL database for Sidebar application...');
  
  // Get the current system user
  const currentUser = os.userInfo().username;
  console.log(`Using PostgreSQL user: ${currentUser}`);
  
  // First, connect to default postgres database to create our database
  const defaultClient = new Client({
    user: currentUser,
    host: 'localhost',
    database: 'postgres',
    password: '', // No password for local development
    port: 5432,
  });

  try {
    await defaultClient.connect();
    console.log('Connected to PostgreSQL server');
    
    // Check if our database exists
    const dbExists = await defaultClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'sidebar_db'"
    );
    
    if (dbExists.rows.length === 0) {
      console.log('Creating sidebar_db database...');
      await defaultClient.query('CREATE DATABASE sidebar_db');
      console.log('Database created successfully');
    } else {
      console.log('Database sidebar_db already exists');
    }
    
    await defaultClient.end();
    
    // Now connect to our database and create tables
    const client = new Client({
      user: currentUser,
      host: 'localhost',
      database: 'sidebar_db',
      password: '', // No password for local development
      port: 5432,
    });
    
    await client.connect();
    console.log('Connected to sidebar_db database');
    
    // Check if tables already exist
    const tablesExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tablesExist.rows[0].exists) {
      console.log('Database schema already exists, skipping table creation');
    } else {
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('Creating database schema...');
      await client.query(schema);
      console.log('Schema created successfully');
    }
    
    await client.end();
    console.log('Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Make sure PostgreSQL is running on your machine');
    console.log('2. Create a .env file in the server directory with your database credentials');
    console.log('3. Run: npm start in the server directory');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Try: brew services start postgresql (macOS)');
    console.log('3. Check if you can connect manually: psql -l');
    process.exit(1);
  }
}

setupDatabase(); 