import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

// Verifica se o usuário autenticado tem role admin.
// Aceita tanto tokens novos (com role no JWT) quanto sessões existentes (fallback por email).
export async function verificarAdmin(): Promise<boolean> {
  const jar = cookies();
  const tokenValue =
    jar.get('next-auth.session-token')?.value ??
    jar.get('__Secure-next-auth.session-token')?.value;
  if (!tokenValue) return false;
  const payload = await decode({ token: tokenValue, secret: process.env.NEXTAUTH_SECRET ?? '' });
  if (!payload) return false;
  return (
    (payload.role as string | undefined) === 'admin' ||
    payload.email === process.env.ADMIN_EMAIL
  );
}
