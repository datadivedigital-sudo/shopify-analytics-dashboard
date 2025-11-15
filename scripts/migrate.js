/**
 * Database Migration Script
 *
 * Runs the SQL schema file to create database tables
 * Run with: npm run db:migrate
 *
 * Pre-configured in the boilerplate
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
  console.log('========================================');
  console.log('Database Migration');
  console.log('========================================\n');

  try {
    // Read schema.sql file
    console.log('📖 Reading schema file...');
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('✓ Schema file loaded\n');

    // Execute schema SQL
    console.log('🔄 Executing migration...');
    await pool.query(schema);

    console.log('✓ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('✓ Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n========================================');
    console.log('Migration Complete!');
    console.log('========================================');

    process.exit(0);

  } catch (error) {
    console.error('\n========================================');
    console.error('Migration Failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Check DATABASE_URL in .env file');
    console.error('  2. Make sure PostgreSQL is running');
    console.error('  3. Verify database exists');
    console.error('  4. Check database user permissions');
    process.exit(1);
  }
}

// Run migration
runMigration();

