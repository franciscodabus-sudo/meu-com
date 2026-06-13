import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    // API routes: retorna 401 sem redirecionar
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    // Páginas: redireciona para /login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protege todas as rotas exceto /login, /api/auth/* e assets estáticos
export const config = {
  matcher: ['/((?!login|api/auth|api/stats|_next|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.webp|.*\\.ico).*)'],
};
