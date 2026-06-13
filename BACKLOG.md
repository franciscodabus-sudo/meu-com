# Backlog — Meu CMO

## FASE 2 — Operação completa (conta própria) [ATUAL]
- [ ] Radar automático: monitorar sites/RSS e gerar campanhas e posts sozinho, sempre caindo na fila de aprovação
- [ ] Frequência configurável: quantos posts por dia e em quais horários (cadência definida pelo usuário OU sugerida pela IA)
- [ ] Agendamento com data/hora na aprovação
- [ ] Instagram: publicar no Feed E nos Stories
- [ ] Posts de vídeo (Reels/MP4) e áudio
- [ ] CTA com botão de WhatsApp (click-to-WhatsApp nos anúncios Meta e link wa.me nos posts orgânicos)
- [ ] Canal TikTok (Ayrshare suporta)
- [ ] Múltiplas contas por usuário (ex: perfil pessoal + página da empresa + gelateria), com seletor de conta ao aprovar

## FASE 3 — Virar SaaS (multi-cliente)
- [ ] Cadastro/multiusuário + login com Google (OAuth real)
- [ ] Arquitetura multi-tenant: workspaces isolados por cliente, Postgres, autenticação (login/cadastro)
- [ ] Modo agência: uma empresa de marketing gerencia N clientes, cada um com suas contas e filas de aprovação
- [ ] Conectores plug-and-play dentro da plataforma: usuário final conecta as próprias redes sem sair do app (Ayrshare Business com perfis de usuário; avaliar migração para APIs nativas)
- [ ] Upgrade Ayrshare Business para embutir fluxo OAuth de conexão dentro do app sem sair
- [ ] White-label completo da conexão de contas (Ayrshare Business com user profiles) — cliente final conecta redes com a NOSSA marca
- [ ] Avaliar migração para APIs nativas Meta/LinkedIn para independência total
- [ ] Planos e cobrança integrada (Stripe): Free (2 posts/mês), Pro $20 (10 posts/mês), Business $50 (até 60 posts/mês — "ilimitado com fair use")
- [ ] Site institucional com página de preços
- [ ] Chat de suporte ao cliente dentro da plataforma

## FASE 4 — Plataforma e ecossistema
- [ ] Módulo Agente de Atendimento: quem interage com os posts conversa com um agente IA no próprio canal (DM/comentários/WhatsApp) — sinergia direta com Robbu
- [ ] Painel de indicadores avançado por cliente + relatórios automáticos
- [ ] Controle de verba Meta Ads multi-cliente com freio automático

Regra permanente em todas as fases: nada é publicado sem aprovação humana.
