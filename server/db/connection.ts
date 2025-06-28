import { Pool } from 'pg';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || os.userInfo().username,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sidebar_db',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool; 