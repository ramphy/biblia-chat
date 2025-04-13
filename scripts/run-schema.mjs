import pkg from 'pg';
const { Pool } = pkg; // Use default import and destructure Pool
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sqlFilePath = path.resolve(process.cwd(), 'schema.sql');

async function runSchema() {
  console.log('Attempting to connect to database...');
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    // Add SSL config if your remote DB requires it
    // ssl: {
    //   rejectUnauthorized: false, // Adjust as needed for your cert setup
    // },
    connectionTimeoutMillis: 5000, // Increase timeout for potentially slower remote connections
  });

  try {
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sql = await fs.readFile(sqlFilePath, 'utf-8');

    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully.');

    try {
      console.log('Executing SQL script...');
      await client.query(sql);
      console.log('SQL script executed successfully.');
    } finally {
      console.log('Releasing database client.');
      client.release();
    }
  } catch (error) {
    console.error('Error running schema script:', error);
    process.exitCode = 1; // Indicate failure
  } finally {
    console.log('Ending database pool.');
    await pool.end();
  }
}

runSchema();
