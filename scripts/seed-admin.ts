import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const senha = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !senha) {
    console.error('ADMIN_EMAIL e ADMIN_PASSWORD precisam estar no .env');
    process.exit(1);
  }

  const existente = await db.user.findUnique({ where: { email: email.toLowerCase() } });

  if (existente) {
    console.log(`Usuário já existe: ${email}`);
    console.log('Nenhuma alteração feita.');
    return;
  }

  const passwordHash = await bcrypt.hash(senha, 12);
  const usuario = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Francisco Dabus',
      passwordHash,
    },
  });

  console.log(`Usuário admin criado com sucesso: ${usuario.email} (id: ${usuario.id})`);
  console.log('Você já pode fazer login com o email e senha do .env.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
