// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import pool from '../../../lib/db'; // Ensure the path is correct

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        // Fetch user from the database to get permissions_level
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [session.user.email]);
        if (rows.length > 0) {
          session.user.id = rows[0].user_id; // Ensure your users table has a `user_id` column
          session.user.permissions_level = rows[0].permissions_level;
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        // Optionally, handle the error (e.g., invalidate the session)
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        const email = user.email;
        const name = user.name;

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length === 0) {
          // Insert new user with default permissions_level 'user'
          await pool.query(
            'INSERT INTO users (email, name, permissions_level) VALUES (?, ?, ?)',
            [email, name, 'user']
          );
        } else {
          // Update last_logged_in
          await pool.query('UPDATE users SET last_logged_in = NOW() WHERE email = ?', [email]);
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
  },
};

export default NextAuth(authOptions);
