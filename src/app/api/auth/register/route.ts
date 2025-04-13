import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Basic validation (consider using a library like Zod for more robust validation)
function validateInput(email?: string, password?: string): string | null {
  if (!email || !password) {
    return 'Email and password are required.';
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return 'Invalid email format.';
  }
  if (password.length < 6) {
    // Example: Enforce minimum password length
    return 'Password must be at least 6 characters long.';
  }
  return null;
}

export async function POST(request: Request) {
  let pool: Pool | null = null;
  try {
    const { email, password, name } = await request.json();

    // Validate input
    const validationError = validateInput(email, password);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    // Ensure DB connection details are available
    if (
      !process.env.POSTGRES_HOST ||
      !process.env.POSTGRES_USER ||
      !process.env.POSTGRES_PASSWORD ||
      !process.env.POSTGRES_DB
    ) {
      throw new Error('Database configuration environment variables are not set.');
    }

    pool = new Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 10, // Smaller pool for a single operation script
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 }); // Conflict
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

      // Insert new user
      await client.query(
        'INSERT INTO users (email, password, name, email_verified) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, name || null, null] // email_verified is null initially
      );

      return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
