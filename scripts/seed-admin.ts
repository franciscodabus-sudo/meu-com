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

  const passwordHash = await bcrypt.hash(senha, 12);

  const usuario = await db.user.upsert({
    where:  { email: email.toLowerCase() },
    update: { passwordHash, role: 'admin' },
    create: {
      email: email.toLowerCase(),
      name: 'Francisco Dabus',
      passwordHash,
      role: 'admin',
    },
  });

  console.log(`Usuário admin pronto: ${usuario.email} (id: ${usuario.id})`);
  console.log('Você pode fazer login com o email e senha do .env.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
