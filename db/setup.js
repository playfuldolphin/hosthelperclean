// Database Setup Script
// Run this to initialize the database schema

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function setupDatabase() {
  console.log('\n🚀 Setting up Host Helper Clean database...\n');

  try {
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema migration...');
    await pool.query(schema);
    console.log('✅ Schema created successfully');

    // Test the connection
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log('✅ Database connection verified');
    console.log(`   Users table: ${result.rows[0].count} records`);

    // List all created tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✅ Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Create a booking to test the integration');
    console.log('  3. Check the database to verify data is being saved\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure PostgreSQL is installed and running');
    console.error('  2. Verify DATABASE_URL in .env is correct');
    console.error('  3. Check that the database exists');
    console.error('  4. Verify user has permissions to create tables\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
