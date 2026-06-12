import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 });

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: 'post não encontrado' }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 });

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: `Você é um editor de conteúdo de marketing. Sua única função nesta chamada é reescrever a legenda removendo marcações "[verificar]". Substitua cada dado marcado com [verificar] por uma afirmação qualitativa segura — sem número específico, sem inventar estatística. Mantenha o tom, o CTA e o estilo original. Responda APENAS com o texto corrigido, sem explicação, sem marcação.`,
    messages: [{
      role: 'user',
      content: `Reescreva esta legenda removendo todos os [verificar]:\n\n${post.caption}`
    }]
  });

  const text = msg.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') return NextResponse.json({ error: 'Sem resposta da IA' }, { status: 500 });

  const captionCorrigida = text.text.trim();
  await db.post.update({ where: { id: postId }, data: { caption: captionCorrigida } });

  return NextResponse.json({ caption: captionCorrigida });
}
