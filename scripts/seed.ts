import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  await db.post.create({
    data: {
      channel: 'instagram', format: 'carrossel', stage: 'educar',
      title: 'Temporada de furacões começou. Seu seguro está pronto?',
      caption: '3 coberturas que muitos vizinhos em Orlando descobrem que não têm só depois da tempestade. Salva esse post e me chama na DM — leva 15 min. 🌀',
      hashtags: '#OrlandoFL #SeguroResidencial #Furacao2026',
      whyNow: 'NOAA elevou a previsão — buscas por hurricane insurance Orlando subiram. [verificar]',
      status: 'pending'
    }
  });
  console.log('Seed ok: 1 post na fila de aprovação.');
}
main().finally(() => db.$disconnect());
