import pg from 'pg';
import { DATABASE_URL } from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on('error', (err) => {
  logger.error(`Unexpected DB error: ${err.message}`);
  process.exit(1);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    logger.error(`DB connection failed: ${err.message}`);
    process.exit(1);
  }
  release();
  logger.info('DB connected');
});

export const query = (text, params) => pool.query(text, params);
export { pool };
