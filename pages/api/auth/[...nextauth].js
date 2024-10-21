// pages/api/auth/[...nextauth].js

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions ={
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Environment Variables:', {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
        DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
        // ...add other variables as needed
      });
      return true;
    },
  },
};
export default NextAuth(authOptions);