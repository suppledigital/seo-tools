// pages/api/auth/[...nextauth].js

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import pool from '../../../lib/db'; // Ensure the path is correct

async function refreshAccessToken(token) {
  try {
    const url =
      'https://oauth2.googleapis.com/token?' +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Add the required scopes
          scope:
            'openid email profile https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file',
        },
      },
      profile(profile) {
        // Map the profile data to the expected fields
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      //console.log('JWT callback', { token, account, user });

      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at * 1000,
          refreshToken: account.refresh_token,
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
      }
  
      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }
  
      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.accessTokenExpires = token.accessTokenExpires;
    
      // Fetch user permissions_level from the database
      try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [session.user.email]);
        if (rows.length > 0) {
          session.user.permissions_level = rows[0].permissions_level;
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    
     // console.log(session);
    
      return session;
    },
    
    async signIn({ user, account, profile }) {
      try {
        //console.log('signIn callback', { user, account, profile });
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
