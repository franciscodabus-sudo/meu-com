import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const total = await db.user.count();
    if (total <= 1) {
      return NextResponse.json(
        { error: 'Não é possível excluir o único usuário do sistema' },
        { status: 403 },
      );
    }
    await db.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
