import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const AVATAR_COLORS = [
  '#0E5F66','#7C3AED','#DB2777','#EA580C','#16A34A',
  '#0369A1','#9333EA','#B45309','#0F766E','#DC2626',
];

// GET /api/perfis
export async function GET() {
  const perfis = await db.brandProfile.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(perfis);
}

// POST /api/perfis — cria ou atualiza
export async function POST(req: Request) {
  const body = await req.json() as {
    id?: string; name?: string; displayName: string;
    descricao?: string; publicoAlvo?: string; tomDeVoz?: string; tomEvitar?: string;
    idioma?: string; contato?: string; produtos?: string; frequencia?: string;
    channelsActive?: string; objetivo?: string; notasLivres?: string;
    avatarColor?: string; radarAtivo?: boolean;
  };
  if (!body.displayName)
    return NextResponse.json({ error: 'displayName obrigatório' }, { status: 400 });

  const total = await db.brandProfile.count();
  const data = {
    displayName:    body.displayName,
    descricao:      body.descricao      ?? '',
    publicoAlvo:    body.publicoAlvo    ?? '',
    tomDeVoz:       body.tomDeVoz       ?? '',
    tomEvitar:      body.tomEvitar      ?? '',
    idioma:         body.idioma         ?? 'pt-BR',
    contato:        body.contato        ?? '',
    produtos:       body.produtos       ?? '',
    frequencia:     body.frequencia     ?? '',
    channelsActive: body.channelsActive ?? '',
    objetivo:       body.objetivo       ?? 'engajamento',
    notasLivres:    body.notasLivres    ?? '',
    avatarColor:    body.avatarColor    ?? AVATAR_COLORS[total % AVATAR_COLORS.length],
    radarAtivo:     body.radarAtivo     ?? false,
  };

  if (body.id) {
    const perfil = await db.brandProfile.update({ where: { id: body.id }, data });
    return NextResponse.json(perfil);
  }

  const slug = body.name
    ?? body.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const perfil = await db.brandProfile.upsert({
    where:  { name: slug },
    create: { name: slug, ...data },
    update: data,
  });
  return NextResponse.json(perfil);
}

// PATCH /api/perfis — troca ativo | toggle pausado | toggle radarAtivo
export async function PATCH(req: Request) {
  const body = await req.json() as {
    id?: string;
    perfilId?: string; pausado?: boolean;
    radarAtivo?: boolean;
  };

  if (body.id) {
    // Troca perfil ativo
    await db.brandProfile.updateMany({ data: { ativo: false } });
    const perfil = await db.brandProfile.update({ where: { id: body.id }, data: { ativo: true } });
    return NextResponse.json(perfil);
  }

  if (body.perfilId !== undefined) {
    const data: { pausado?: boolean; radarAtivo?: boolean } = {};
    if (body.pausado !== undefined)     data.pausado     = body.pausado;
    if (body.radarAtivo !== undefined)  data.radarAtivo  = body.radarAtivo;
    const perfil = await db.brandProfile.update({ where: { id: body.perfilId }, data });
    return NextResponse.json(perfil);
  }

  return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 });
}

// DELETE /api/perfis
export async function DELETE(req: Request) {
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const perfil = await db.brandProfile.findUnique({ where: { id } });
  if (!perfil) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });

  if (perfil.ativo) {
    const total = await db.brandProfile.count();
    if (total <= 1)
      return NextResponse.json({ error: 'Não é possível excluir o único perfil.' }, { status: 400 });
    const proximo = await db.brandProfile.findFirst({ where: { id: { not: id } } });
    if (proximo) await db.brandProfile.update({ where: { id: proximo.id }, data: { ativo: true } });
  }

  await db.brandProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
