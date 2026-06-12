# Meu CMO 🧠

Seu diretor de marketing pessoal, movido a IA. Cria, programa e publica posts
em Instagram, Facebook e LinkedIn a partir de um brief — você só aprova com 1 toque.

## Rodando em 5 minutos

1. **Pré-requisito:** Node.js 20+ (https://nodejs.org)

2. **Instalar e preparar o banco:**
   ```bash
   npm install
   cp .env.example .env
   npx prisma db push
   npm run db:seed
   ```

3. **Chaves (cole no arquivo .env):**
   - `ANTHROPIC_API_KEY` → console.anthropic.com (a IA que escreve os posts)
   - `AYRSHARE_API_KEY` → app.ayrshare.com (conecte lá suas contas IG/FB/LinkedIn; plano free para testar)

4. **Rodar:**
   ```bash
   npm run dev
   ```
   Abra http://localhost:3000 no celular ou navegador.

## O que já funciona nesta Semana 1
- Campo de brief: escreva o que precisa e a IA gera os posts (jornada atrair→educar→conectar→converter)
- Fila de aprovação com 1 toque (aprovar / pular)
- API de publicação via Ayrshare pronta (`POST /api/publish`)
- Radar de notícias por RSS (`GET /api/radar`)

## Próximos passos
Abra este projeto no **Claude Code** — o arquivo `CLAUDE.md` já contém todo o
contexto e o roadmap das 6 semanas. Peça, por exemplo:
"implemente a prévia real do post como no protótipo em design/prototipo-v3.html".
