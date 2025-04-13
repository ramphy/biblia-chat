import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';
import PostgresAdapter from '@auth/pg-adapter';
import bcrypt from 'bcrypt';

// Ensure environment variables are set
if (
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD ||
  !process.env.POSTGRES_DB ||
  !process.env.NEXTAUTH_SECRET
) {
  throw new Error('Required environment variables for Auth.js are not set.');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const authOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          console.error('Credentials missing');
          return null;
        }

        let user = null;
        try {
          // Fetch user from the database
          const result = await pool.query('SELECT * FROM users WHERE email = $1', [
            credentials.email,
          ]);

          if (result.rows.length === 0) {
            console.log('No user found with email:', credentials.email);
            return null; // User not found
          }

          const dbUser = result.rows[0];

          // Check if user has a password (might not if signed up via OAuth)
          if (!dbUser.password) {
             console.log('User found but has no password set (maybe OAuth user?)');
             return null;
          }

          // Compare provided password with the hashed password in the database
          const passwordsMatch = await bcrypt.compare(
            credentials.password,
            dbUser.password // Assumes 'password' column exists in 'users' table
          );

          if (passwordsMatch) {
            // Return user object (without password)
            user = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              image: dbUser.image,
              // Add any other user properties you want in the session/token
            };
            console.log('Credentials match for user:', user.email);
          } else {
             console.log('Password mismatch for user:', credentials.email);
          }
        } catch (error) {
          console.error('Error during authorization:', error);
          return null; // Return null on error
        }

        // Return user object if authentication successful, otherwise null
        return user;
      },
    }),
    // Add other providers like Google, GitHub etc. here if needed
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
  ],
  session: {
    strategy: 'jwt', // Use JWT strategy (required for Credentials provider)
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Add any other NextAuth options here, like callbacks, pages etc.
  // pages: {
  //   signIn: '/auth/signin', // Example: Custom sign-in page
  // }
};

const handler = NextAuth(authOptions as NextAuthOptions);

export { handler as GET, handler as POST };
