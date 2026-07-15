import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:  { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const usuario = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });
          if (!usuario) {
            console.warn('[auth] usuário não encontrado:', credentials.email);
            return null;
          }
          if (!usuario.passwordHash) {
            console.error('[auth] usuário sem passwordHash:', credentials.email);
            return null;
          }
          const senhaValida = await bcrypt.compare(credentials.password, usuario.passwordHash);
          if (!senhaValida) {
            console.warn('[auth] senha incorreta para:', credentials.email);
            return null;
          }
          return { id: usuario.id, email: usuario.email, name: usuario.name ?? '' };
        } catch (err) {
          console.error('[auth] erro no authorize:', err instanceof Error ? err.message : err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email; }
      return token;
    },
    async session({ session, token }) {
      if (token?.email) session.user = { ...session.user, email: token.email as string };
      return session;
    },
  },
});

export { handler as GET, handler as POST };
