import { Pool } from 'pg';
import { config } from './index';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.url,
  // Fallback to individual config if URL not provided
  host: config.database.url ? undefined : config.database.host,
  port: config.database.url ? undefined : config.database.port,
  database: config.database.url ? undefined : config.database.name,
  user: config.database.url ? undefined : config.database.user,
  password: config.database.url ? undefined : config.database.password,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Query helper with error handling
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Query error:', { text, error });
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

export default pool;
