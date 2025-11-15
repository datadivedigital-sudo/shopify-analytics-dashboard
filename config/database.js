/**
 * Database Configuration
 *
 * Sets up PostgreSQL connection pool using node-postgres (pg)
 * A connection pool maintains multiple database connections for efficiency
 */

// Load environment variables from .env file
require('dotenv').config();

const { Pool } = require('pg');

/**
 * Create PostgreSQL Connection Pool
 *
 * The pool automatically manages connections:
 * - Opens connections when needed
 * - Reuses connections for multiple queries
 * - Closes idle connections
 * - Handles connection errors
 *
 * Configuration comes from DATABASE_URL environment variable
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  /**
   * SSL Configuration
   * - Development (local PostgreSQL): SSL not needed
   * - Production (Render, Railway, AWS RDS): SSL required
   * - rejectUnauthorized: false allows self-signed certificates
   */
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  /**
   * Connection Pool Settings
   * - max: Maximum number of connections in the pool (default: 10)
   * - idleTimeoutMillis: Close idle connections after this time (default: 30000ms)
   * - connectionTimeoutMillis: Timeout when waiting for a connection (default: 0 = no timeout)
   */
  max: 20, // Maximum 20 concurrent connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Wait up to 2 seconds for a connection
});

/**
 * Event Listeners for Connection Pool
 * These help with debugging database connection issues
 */

// Fired when a new client is connected
pool.on('connect', (client) => {
  console.log('✓ Database client connected');
});

// Fired when a client encounters an error
pool.on('error', (err, client) => {
  console.error('✗ Unexpected database error:', err);
  // Don't exit the process - let it handle the error gracefully
});

// Fired when a client is removed from the pool
pool.on('remove', (client) => {
  console.log('✓ Database client removed from pool');
});

/**
 * Test Database Connection
 * This runs when the module is first loaded
 * Verifies the database is reachable and credentials are valid
 */
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('✗ Failed to connect to database:', err.message);
    console.error('  Check your DATABASE_URL in .env file');
  } else {
    console.log('✓ Database connected successfully');
    console.log(`  Server time: ${res.rows[0].now}`);
  }
});

/**
 * Helper Function: Execute a Query
 * Convenience wrapper for running queries
 *
 * @param {string} text - SQL query
 * @param {array} params - Query parameters (for parameterized queries)
 * @returns {Promise} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (over 1 second)
    if (duration > 1000) {
      console.warn(`⚠ Slow query (${duration}ms):`, text);
    }

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Helper Function: Get a Client from Pool
 * Use this when you need to run multiple queries in a transaction
 *
 * Example:
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT...');
 *   await client.query('UPDATE...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Export the pool and helper functions
 */
module.exports = {
  pool,
  query,
  getClient
};

