# Meu CMO — contexto para o Claude Code

## O que é este projeto
App que substitui uma agência de marketing: um "CMO de bolso" que cria posts com IA,
monta campanhas a partir de um brief, monitora notícias/concorrentes, publica em
IG/FB/LinkedIn via Ayrshare e controla verba de Meta Ads. O dono aprova tudo com 1 toque.

Usuário-cobaia: Francisco Dabus (corretor de seguros 2-15 em Orlando, FL). Empresa: Vip Insurance.
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

## Seleção de modelo de IA (produto)
Usar sempre `getModel(task)` exportada de `lib/claude.ts`. **Nunca hardcodar nome de modelo em outros arquivos.**
- `radar_filter` → Haiku (triagem, muitas chamadas, decisão simples)
- `quality_check` → Haiku (remover [verificar], edição leve)
- `radar_post`   → Sonnet (gerar post de notícia, equilíbrio custo/qualidade)
- `chat_cmo`     → Sonnet (responder pergunta no painel)
- `brief_post`   → Opus (gerar posts do brief do usuário, máxima qualidade)
- `campaign_plan`→ Opus (plano de campanha completo)
- Para qualquer nova chamada de IA, adicionar o tipo em `ModelTask` e usar `getModel()`.
- `FORCE_MODEL` no `.env` sobrescreve tudo (útil para testes de custo).

## Modelo do Claude Code por tipo de tarefa
Regra de trabalho aprovada por Francisco — diz respeito a qual modelo usar *nesta sessão de desenvolvimento*, não ao produto.

- **Fable 5** (`/model fable`): diagnósticos profundos, decisões de arquitetura, investigação de bugs difíceis, refatorações grandes, QA completo, análises de sistema. Consome cota ~2× mais rápido — usar com intenção, não como padrão.
- **Opus** (padrão da sessão): implementação depois que o plano foi aprovado, correções pontuais, ajustes de código já mapeados.
- **Sonnet**: ajustes pequenos e pontuais onde Opus seria excessivo.

**Instrução para o Claude Code:** no início de qualquer tarefa nova, avalie rapidamente se ela se encaixa no critério de Fable (diagnóstico profundo, arquitetura, bug difícil, QA/análise grande). Se sim — e a sessão não estiver no Fable — avise sugerindo a troca antes de começar (ex.: "Essa tarefa parece se beneficiar do Fable — quer que eu continue no modelo atual ou prefere trocar com /model fable antes?"), em vez de prosseguir no modelo atual sem avisar.

## Regras de qualidade
- Ao final de qualquer mudança, SEMPRE verificar que http://localhost:3000 carrega sem erro (HTTP 200, sem crash no terminal) antes de declarar a tarefa concluída.
- Todo container com scroll deve ter padding-bottom suficiente para compensar menus fixos. Mobile: min 80px. Desktop: min 24px. Usar sempre calc() e env(safe-area-inset-bottom) para iPhones. O globals.css já tem a regra global para `main` e `[data-main]`; páginas sem `<main>` devem adicionar `pb-28 lg:pb-0` ao wrapper mais externo.

## Princípio de produto — tela única
A plataforma é o ÚNICO front do usuário. Serviços de terceiros (Ayrshare, Pexels,
Anthropic, etc.) são infraestrutura invisível: nenhum fluxo pode exigir sair do app,
nenhuma marca de terceiro aparece na interface, e toda capacidade deles que o usuário
precise deve ser trazida para dentro como funcionalidade nativa.
Conceito de tela única: o usuário pilota tudo daqui.
- Erros de APIs externas sempre traduzidos para PT-BR sem mencionar o nome do serviço.
- OAuth/popups de terceiros são a única exceção temporária (ver BACKLOG Fase 3 white-label).

## Marca e perfis
A marca do usuário é **Vip Insurance** (além do perfil pessoal Francisco Dabus). **ZYON não existe** e nunca existiu — remova qualquer ocorrência se encontrar. A IA nunca inventa fatos sobre a empresa (slogan, anos de mercado, equipe etc.) — usa somente o que está no BrandProfile preenchido pelo usuário. Campos em branco do perfil simplesmente não entram no prompt.

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
