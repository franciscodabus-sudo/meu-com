# Backlog — Meu CMO

## STATUS DE FUNCIONALIDADES (auditado 2026-06-15)

### ✓ Funcionando de ponta a ponta
- Login: NextAuth credentials (ADMIN_EMAIL + ADMIN_PASSWORD), sessão JWT, logout
- Brief → IA gera posts (Opus) → fila de aprovação
- Aprovar / Pular / Publicar agora / Agendar post (PreviewModal + /api/publish → Ayrshare)
- Radar: coleta RSS → filtra lixo (emprego, navegação, CAPTCHA) → avalia relevância (Haiku) → DB
- Radar: "Gerar post de pauta" → Sonnet → post pending na fila
- Radar: deletar item → marca deletedAt permanente
- Cenários: criar/editar (wizard 4 passos), pausar, duplicar, trocar ativo
- Cenários: botão "—" → modal confirmação → DELETE → fade-out (corrigido 2026-06-15)
- Studio: busca Pexels, upload de arquivos, banco de mídia salvos
- Configurações: fontes RSS (CRUD + teste + auto-convert para Google News se bloqueado)
- Configurações: canais, frequência, horários, contexto IA, WhatsApp, status das chaves
- Painel /painel: KPIs reais, sparkline 14 dias, distribuição canal, chat CMO
- ColumnC Painel: posts reais (publicados, na fila), barras de canal reais
- ColumnC Verba: sliders Teto/CPC com debounce 800ms, toggles (autoBrake, boostWinners) persistidos (corrigido 2026-06-15)
- ColumnC Verba: status Meta Ads baseado em META_ACCESS_TOKEN no env (corrigido 2026-06-15)
- TopBar: pill de cenário ativo com popover para trocar
- Seleção de modelo IA: getModel(task) — Haiku/Sonnet/Opus por tipo de tarefa

### ⚠️ Parcialmente funcional (UI existe, integração pendente)
- ColumnC Agenda: mostra calendário semanal mas sem posts reais vinculados
- ColumnC KPIs ROAS/Custo/Verba: mostra aviso honesto "Requer Meta Ads"
- Publicação via Ayrshare: API pronta mas requer AYRSHARE_API_KEY no .env
- Radar auto (intervalo): lógica existe, mas cron real depende de serviço externo ou cron job (não Next.js nativo)
- "Impulsionar vencedores": toggle salva no DB, mas a lógica de boosting automático não está implementada

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
- [ ] **PRÓXIMO**: Aba Agenda com posts reais — mostrar posts scheduled na mini-agenda da ColumnC
- [ ] **PRÓXIMO**: Cron real para radar automático (vercel-cron ou serviço externo)
- [ ] **PRÓXIMO**: Lógica de "Impulsionar vencedores" — detectar 2× engajamento médio e criar anúncio via Meta API
- [ ] Instagram Stories (Ayrshare suporta, precisa endpoint separado)
- [ ] Posts de vídeo (Reels/MP4) e áudio
- [ ] CTA com botão de WhatsApp (wa.me nos posts orgânicos)
- [ ] Canal TikTok (Ayrshare suporta)
- [ ] Múltiplas contas por usuário (seletor de conta ao aprovar)

## FASE 3 — Virar SaaS (multi-cliente)
- [ ] Cadastro/multiusuário + login com Google (OAuth real)
- [ ] Arquitetura multi-tenant: workspaces isolados, Postgres, autenticação
- [ ] Modo agência: gerencia N clientes, cada um com filas e contas próprias
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
