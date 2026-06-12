# Meu CMO — contexto para o Claude Code

## O que é este projeto
App que substitui uma agência de marketing: um "CMO de bolso" que cria posts com IA,
monta campanhas a partir de um brief, monitora notícias/concorrentes, publica em
IG/FB/LinkedIn via Ayrshare e controla verba de Meta Ads. O dono aprova tudo com 1 toque.

Usuário-cobaia: Francisco Dabus (corretor de seguros 2-15 em Orlando, ZYON Group).
Idioma do produto: PT-BR. Design de referência: design/prototipo-v3.html (abrir no navegador).

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (migrar p/ Postgres na produção)
- IA: @anthropic-ai/sdk (lib/claude.ts tem o prompt do CMO)
- Publicação: Ayrshare (lib/ayrshare.ts) — IG, FB e LinkedIn com uma chave
- Radar: rss-parser (lib/rss.ts)

## Comandos
npm install && npx prisma db push && npm run db:seed && npm run dev

## Convenções
- Telas mobile-first, max-w-[430px], cores e fontes já no tailwind.config.ts
- Toda escrita gerada por IA passa por status "pending" -> aprovação humana -> publica
- Nunca publicar sem post.status === "approved" | "scheduled"
- Respostas da IA sempre em JSON validado; nunca inventar estatística (usar [verificar])

## Regras de qualidade
- Ao final de qualquer mudança, SEMPRE verificar que http://localhost:3000 carrega sem erro (HTTP 200, sem crash no terminal) antes de declarar a tarefa concluída.

## Backlog e planejamento
Consulte sempre o BACKLOG.md antes de planejar ou implementar qualquer fase nova — ele é a fonte de verdade sobre prioridades, fases e regras permanentes do produto.

## Roadmap (6 semanas)
- [x] S1: esqueleto, fila de aprovação, brief -> IA gera posts (este código)
- [ ] S1: prévia real do post (mockup IG/LinkedIn como no protótipo)
- [ ] S2: conectar Ayrshare de verdade + botão "Publicar agora" / agendar
- [ ] S2: upload de mídia + banco de mídia (MediaAsset)
- [ ] S3: radar de notícias na UI + "gerar minha versão" a partir de RadarItem
- [ ] S3: aba Agenda (calendário + jornada da campanha)
- [ ] S4: Meta Marketing API — teto de verba + CPC máximo + freio automático
- [ ] S5: painel de indicadores (custo/lead, ROAS) + "pergunte ao CMO"
- [ ] S6: arquivo/reciclagem de posts + integração Canva Connect
