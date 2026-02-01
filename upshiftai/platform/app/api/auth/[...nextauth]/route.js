import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // MVP: Check "demo" password, but fetch REAL user ID from Supabase
        if (credentials?.email && credentials?.password === 'demo') {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          
          if (!url || !key) {
            // Fallback if env vars missing (shouldn't happen in prod)
            return { id: '1', email: credentials.email, name: credentials.email };
          }

          const supabase = createClient(url, key);
          
          // 1. Try to find existing user
          let { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          // 2. If not found, create one on the fly (Auto-signup)
          if (!user) {
            const { data: newUser, error } = await supabase
              .from('users')
              .insert([{ email: credentials.email, name: credentials.email }])
              .select()
              .single();
            
            if (!error && newUser) {
              user = newUser;
            }
          }

          if (user) {
            return { id: user.id, email: user.email, name: user.name };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
