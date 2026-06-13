import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/perfis — lista todos os perfis de marca
export async function GET() {
  const perfis = await db.brandProfile.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(perfis);
}

// POST /api/perfis — cria ou atualiza perfil
export async function POST(req: Request) {
  const body = await req.json() as {
    id?: string;
    name: string;
    displayName: string;
    descricao?: string;
    publicoAlvo?: string;
    tomDeVoz?: string;
    idioma?: string;
    contato?: string;
  };
  if (!body.name || !body.displayName)
    return NextResponse.json({ error: 'name e displayName obrigatórios' }, { status: 400 });

  const data = {
    displayName: body.displayName,
    descricao:   body.descricao   ?? '',
    publicoAlvo: body.publicoAlvo ?? '',
    tomDeVoz:    body.tomDeVoz    ?? '',
    idioma:      body.idioma      ?? 'pt-BR',
    contato:     body.contato     ?? '',
  };

  const perfil = body.id
    ? await db.brandProfile.update({ where: { id: body.id }, data })
    : await db.brandProfile.upsert({ where: { name: body.name }, create: { name: body.name, ...data }, update: data });

  return NextResponse.json(perfil);
}

// PATCH /api/perfis — troca perfil ativo (seletor)
export async function PATCH(req: Request) {
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  // Desativa todos e ativa só o selecionado
  await db.brandProfile.updateMany({ data: { ativo: false } });
  const perfil = await db.brandProfile.update({ where: { id }, data: { ativo: true } });
  return NextResponse.json(perfil);
}
