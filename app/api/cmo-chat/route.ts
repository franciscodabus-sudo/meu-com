import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getModel } from '@/lib/claude';

export const maxDuration = 30;

export async function POST(req: Request) {
  const anthropic = new Anthropic();
  const { pergunta, stats } = await req.json();
  if (!pergunta) return NextResponse.json({ error: 'pergunta obrigatória' }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ resposta: 'ANTHROPIC_API_KEY não configurada.' });

  const contexto = `
Dados do usuário (Francisco Dabus, Orlando FL):
- Total de posts gerados: ${stats?.totais?.posts ?? 0}
- Publicados: ${stats?.totais?.publicados ?? 0}
- Agendados: ${stats?.totais?.agendados ?? 0}
- Na fila (pendentes + aprovados): ${(stats?.totais?.pendentes ?? 0) + (stats?.totais?.aprovados ?? 0)}
- Publicados nos últimos 7 dias: ${stats?.ultimos7?.publicados ?? 0}
- Publicados nos últimos 30 dias: ${stats?.ultimos30?.publicados ?? 0}
- Campanhas ativas: ${stats?.campanhas ?? 0}
- Por canal: ${JSON.stringify(stats?.porCanal ?? {})}
`.trim();

  const msg = await anthropic.messages.create({
    model: getModel('chat_cmo'),
    max_tokens: 400,
    system: `Você é o CMO pessoal de Francisco Dabus. Responda perguntas sobre os dados de marketing dele de forma direta, consultiva e em PT-BR. Use os dados fornecidos. Seja conciso (máximo 3 parágrafos). Nunca invente dados além dos fornecidos.`,
    messages: [{ role: 'user', content: `${contexto}\n\nPergunta: ${pergunta}` }]
  });

  const text = msg.content.find(b => b.type === 'text');
  return NextResponse.json({ resposta: text?.type === 'text' ? text.text : 'Sem resposta.' });
}
