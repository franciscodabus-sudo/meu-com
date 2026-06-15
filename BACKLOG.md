# Backlog — Meu CMO

## STATUS DE FUNCIONALIDADES (auditado 2026-06-15)

### ✓ Funcionando de ponta a ponta
- Login: NextAuth credentials (ADMIN_EMAIL + ADMIN_PASSWORD), sessão JWT, logout
- Brief → IA gera posts (Opus) → fila de aprovação
- Aprovar / Pular / Publicar agora / Agendar post (PreviewModal + /api/publish → Ayrshare)
- Radar: coleta RSS → filtra lixo (emprego, navegação, CAPTCHA, Google Alerts) → avalia relevância (Haiku) → DB
- Radar: "Gerar post de pauta" → Sonnet → post pending na fila
- Radar: deletar item → marca deletedAt permanente
- Radar: Google Alerts detectados automaticamente → banner de aviso → botão "Converter para Google News"
- Cenários: criar/editar (wizard 4 passos), pausar, duplicar, trocar ativo
- Cenários: botão "—" → modal confirmação → DELETE → fade-out
- Studio: busca Pexels, upload de arquivos, banco de mídia salvos
- Configurações: fontes RSS (CRUD + teste + auto-convert Google Alerts/bloqueados para Google News)
- Configurações: canais, frequência, horários, contexto IA, WhatsApp CTA, status das chaves
- Painel /painel: KPIs reais, sparkline 14 dias, distribuição canal, chat CMO
- ColumnC Painel: posts reais (publicados, na fila), barras de canal reais
- ColumnC Agenda: mini-calendário 7 dias com posts reais (scheduledAt/publishedAt) por dia ✓ (2026-06-15)
- ColumnC Verba: sliders Teto/CPC com debounce 800ms, toggles (autoBrake, boostWinners) persistidos
- ColumnC Verba: status Meta Ads baseado em META_ACCESS_TOKEN no env
- TopBar: pill de cenário ativo com popover para trocar
- Seleção de modelo IA: getModel(task) — Haiku/Sonnet/Opus por tipo de tarefa
- WhatsApp CTA: wa.me injetado no prompt da IA quando configurado
- Agenda /agenda: calendário semanal navegável + jornada de campanha com posts reais
- Vercel Cron: /api/cron/radar dispara automaticamente a cada 6h em produção ✓ (2026-06-15)

### ⚠️ Parcialmente funcional (UI existe, integração pendente)
- ColumnC KPIs ROAS/Custo/Verba: mostra aviso honesto "Requer Meta Ads"
- Publicação via Ayrshare: API pronta mas requer AYRSHARE_API_KEY no .env
- Radar auto (intervalo): lógica existe; em produção usa Vercel Cron; localmente executa via botão "Sincronizar"
- "Impulsionar vencedores": toggle salva no DB, mas a lógica de boosting automático requer Meta Marketing API

### ✗ Não implementado (requer integrações externas)
- ROAS, Custo/lead, Verba usada real: requer Meta Marketing API
- Pixel da Meta (verificação de eventos): requer META_ACCESS_TOKEN
- Freio automático real de anúncios: requer META_ACCESS_TOKEN + META_AD_ACCOUNT_ID
- Notificações push de aprovação pendente

---

## FASE 2 — Operação completa (conta própria) [ATUAL]
- [x] Radar automático: RSS → filtro → relevância IA → fila de aprovação
- [x] Frequência configurável + horários de publicação
- [x] Agendamento com data/hora na aprovação (PreviewModal → /api/publish)
- [x] ColumnC Agenda com posts reais — mini-calendário 7 dias com posts vinculados
- [x] Cron real para radar automático — vercel.json + /api/cron/radar (a cada 6h)
- [x] WhatsApp CTA — wa.me injetado no prompt quando número configurado
- [ ] **PRÓXIMO**: Lógica "Impulsionar vencedores" — detectar 2× engajamento e criar anúncio via Meta API (bloqueado: requer META_ACCESS_TOKEN)
- [ ] Instagram Stories (Ayrshare suporta, precisa endpoint separado + formato 'story' no schema)
- [ ] Posts de vídeo (Reels/MP4): requer upload de vídeo + Ayrshare video endpoint
- [ ] Canal TikTok (ícone e cor já no código; requer conta TikTok no Ayrshare)
- [ ] Múltiplas contas por usuário (seletor de conta ao aprovar)

## FASE 3 — Virar SaaS (multi-cliente)
- [ ] Cadastro/multiusuário + login com Google (OAuth real)
- [ ] Arquitetura multi-tenant: workspaces isolados, Postgres, autenticação
- [ ] Modo agência: gerencia N clientes, cada um com filas e contas próprias
- [ ] CONTAS POR CENÁRIO — cada cenário com suas próprias contas de redes sociais independentes. Hoje todos os cenários compartilham as mesmas contas conectadas no Ayrshare. Solução: migrar para Ayrshare Business (User Profiles, ~$300/mês) OU APIs nativas Meta/LinkedIn onde cada cenário tem seu próprio token de acesso. Caso de uso: Francisco tem suas contas pessoais, Giselle tem as dela, Vip Insurance tem as da empresa — tudo gerenciado na mesma plataforma sem conflito. Pré-requisito para venda do produto como SaaS multi-cliente.
- [ ] White-label OAuth de conexão de contas (Ayrshare Business user profiles)
- [ ] Avaliar migração para APIs nativas Meta/LinkedIn para independência total
- [ ] Planos e cobrança (Stripe): Free / Pro $20 / Business $50
- [ ] Site institucional com página de preços
- [ ] Chat de suporte dentro da plataforma

## FASE 4 — Plataforma e ecossistema
- [ ] Controle de verba Meta Ads real: freio automático + impulsionar vencedores (Meta Marketing API)
- [ ] Módulo Agente de Atendimento: DM/comentários/WhatsApp com IA (sinergia Robbu)
- [ ] Painel de indicadores avançado por cliente + relatórios automáticos
- [ ] Integração Canva Connect para design de posts dentro do app

Regra permanente em todas as fases: nada é publicado sem aprovação humana.
