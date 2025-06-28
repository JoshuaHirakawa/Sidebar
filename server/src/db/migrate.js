import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migration...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if they already exist (like extensions)
          if (error.code === '42710') { // duplicate_object
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('🎉 Database migration completed successfully!');

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify that all tables were created successfully
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration...');

  const expectedTables = [
    'users',
    'projects', 
    'components',
    'connections',
    'chat_sessions',
    'chat_messages',
    'scratch_notes'
  ];

  for (const tableName of expectedTables) {
    try {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);

      if (result.rows[0].exists) {
        console.log(`✅ Table '${tableName}' exists`);
      } else {
        console.error(`❌ Table '${tableName}' missing`);
        throw new Error(`Table ${tableName} was not created`);
      }
    } catch (error) {
      console.error(`❌ Error checking table '${tableName}':`, error.message);
      throw error;
    }
  }

  console.log('🎉 All tables verified successfully!');
}

/**
 * Create logs directory if it doesn't exist
 */
function createLogsDirectory() {
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createLogsDirectory();
  runMigrations()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations, verifyMigration }; 