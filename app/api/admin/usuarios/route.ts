import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const usuarios = await db.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  try {
    const { nome, email, senha } = await req.json();
    if (!email?.trim() || !senha?.trim()) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    const existente = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existente) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(senha, 12);
    const usuario = await db.user.create({
      data: { email: email.toLowerCase(), name: nome?.trim() || null, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
