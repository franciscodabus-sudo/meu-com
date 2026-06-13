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
    produtos?: string;
    frequencia?: string;
    objetivo?: string;
    notasLivres?: string;
    radarAtivo?: boolean;
  };
  if (!body.name || !body.displayName)
    return NextResponse.json({ error: 'name e displayName obrigatórios' }, { status: 400 });

  const data = {
    displayName:  body.displayName,
    descricao:    body.descricao    ?? '',
    publicoAlvo:  body.publicoAlvo  ?? '',
    tomDeVoz:     body.tomDeVoz     ?? '',
    idioma:       body.idioma       ?? 'pt-BR',
    contato:      body.contato      ?? '',
    produtos:     body.produtos     ?? '',
    frequencia:   body.frequencia   ?? '',
    objetivo:     body.objetivo     ?? '',
    notasLivres:  body.notasLivres  ?? '',
    radarAtivo:   body.radarAtivo   ?? false,
  };

  const perfil = body.id
    ? await db.brandProfile.update({ where: { id: body.id }, data })
    : await db.brandProfile.upsert({
        where:  { name: body.name },
        create: { name: body.name, ...data },
        update: data,
      });

  return NextResponse.json(perfil);
}

// PATCH /api/perfis — troca perfil ativo (seletor)
export async function PATCH(req: Request) {
  const body = await req.json() as { id?: string; radarAtivo?: boolean; perfilId?: string };

  // Troca perfil ativo principal
  if (body.id) {
    await db.brandProfile.updateMany({ data: { ativo: false } });
    const perfil = await db.brandProfile.update({ where: { id: body.id }, data: { ativo: true } });
    return NextResponse.json(perfil);
  }

  // Toggle radarAtivo de um perfil específico
  if (body.perfilId !== undefined && body.radarAtivo !== undefined) {
    const perfil = await db.brandProfile.update({
      where: { id: body.perfilId },
      data:  { radarAtivo: body.radarAtivo },
    });
    return NextResponse.json(perfil);
  }

  return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 });
}

// DELETE /api/perfis — exclui perfil (não pode excluir o único ativo)
export async function DELETE(req: Request) {
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const perfil = await db.brandProfile.findUnique({ where: { id } });
  if (!perfil) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
  if (perfil.ativo) {
    const total = await db.brandProfile.count();
    if (total <= 1) return NextResponse.json({ error: 'Não é possível excluir o único perfil.' }, { status: 400 });
    // Ativa o próximo perfil antes de excluir
    const proximo = await db.brandProfile.findFirst({ where: { id: { not: id } } });
    if (proximo) await db.brandProfile.update({ where: { id: proximo.id }, data: { ativo: true } });
  }

  await db.brandProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
