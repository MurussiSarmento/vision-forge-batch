# Product Requirements Document (PRD)
## Plataforma de Geração de Imagens por IA

### 1. Visão Geral do Produto

**Nome do Produto:** AI Image Generator Platform

**Descrição:** Plataforma web para geração de imagens usando inteligência artificial, permitindo que usuários criem múltiplas variações de imagens a partir de prompts de texto e imagens de referência.

**Público-Alvo:**
- Designers e artistas digitais
- Profissionais de marketing e conteúdo
- Criadores de conteúdo digital
- Empresas que necessitam de geração de assets visuais em escala

---

### 2. Objetivos do Produto

#### Objetivos de Negócio
- Fornecer uma plataforma escalável para geração de imagens por IA
- Criar um sistema multi-usuário com diferentes níveis de permissão
- Monetizar através de créditos de API e planos de assinatura

#### Objetivos dos Usuários
- Gerar múltiplas variações de imagens rapidamente
- Gerenciar e organizar histórico de gerações
- Controlar custos através de validação de API keys
- Colaborar em projetos de geração de imagens

---

### 3. Funcionalidades Principais

#### 3.1 Autenticação e Autorização

**Funcionalidades:**
- Login/Cadastro com email e senha
- Login social com Google OAuth
- Sistema de roles (Admin, User)
- Gerenciamento de perfil de usuário

**Regras de Negócio:**
- Novos usuários começam com status "pending" até aprovação de admin
- Admins podem gerenciar status de usuários (active, suspended, pending)
- Usuários suspensos não podem acessar a plataforma

#### 3.2 Gerenciamento de API Keys

**Funcionalidades:**
- Cadastro de múltiplas API keys do Google AI Studio
- Validação automática de keys antes do uso
- Monitoramento de uso por key
- Histórico de validações

**Regras de Negócio:**
- Keys são armazenadas criptografadas no banco
- Validação obrigatória antes de primeira geração
- Keys inválidas não podem ser usadas para geração
- Contador de uso é incrementado a cada geração

#### 3.3 Geração de Imagens em Lote

**Funcionalidades:**
- Input de múltiplos prompts de texto
- Upload de imagem de referência (opcional)
- Seleção de aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
- Definição de número de variações por prompt (1-10)
- Processamento em background via Edge Functions

**Regras de Negócio:**
- Máximo de 50 prompts por sessão
- Imagens de referência limitadas a 5MB
- Suporte a formatos: JPG, PNG, WebP
- Geração assíncrona com feedback de progresso
- Armazenamento automático no Supabase Storage

#### 3.4 Visualização de Resultados

**Funcionalidades:**
- Grid responsivo de imagens geradas
- Preview em tamanho completo
- Seleção de imagens favoritas
- Filtros por prompt, data, status
- Download individual ou em lote

**Regras de Negócio:**
- Apenas o usuário criador pode ver suas gerações
- Imagens são servidas via CDN do Supabase
- URLs públicas para compartilhamento
- Metadados preservados (prompt, parâmetros, timestamp)

#### 3.5 Histórico de Gerações

**Funcionalidades:**
- Lista cronológica de todas as sessões
- Detalhes de cada sessão (total de prompts, variações, status)
- Acesso rápido aos resultados de cada sessão
- Estatísticas de uso

**Regras de Negócio:**
- Histórico ordenado por data (mais recente primeiro)
- Status: pending, processing, completed, failed
- Sessões podem ser reprocessadas em caso de falha parcial

#### 3.6 Painel Administrativo

**Funcionalidades:**
- Dashboard com métricas gerais
- Gerenciamento de usuários (listar, aprovar, suspender, deletar)
- Visualização de logs de atividade
- Monitoramento de uso de API

**Regras de Negócio:**
- Apenas usuários com role "admin" têm acesso
- Admins não podem remover sua própria role de admin
- Todas as ações administrativas são logadas
- Deleção de usuário é permanente e cascateia para dados relacionados

---

### 4. Fluxos de Usuário

#### 4.1 Primeiro Acesso
1. Usuário acessa página de login
2. Cria conta com email/senha ou Google
3. Status inicial é "pending"
4. Admin aprova o usuário
5. Usuário recebe acesso completo

#### 4.2 Configuração de API Key
1. Usuário acessa "Configurar API"
2. Insere API key do Google AI Studio
3. Sistema valida a key
4. Key é armazenada criptografada
5. Usuário pode começar a gerar imagens

#### 4.3 Geração de Imagens
1. Usuário acessa "Nova Geração"
2. Insere prompts (um por linha)
3. (Opcional) Faz upload de imagem de referência
4. Seleciona aspect ratio e número de variações
5. Clica em "Iniciar Geração"
6. Sistema valida inputs e API key
7. Processa imagens em background
8. Usuário é redirecionado para página de resultados
9. Imagens aparecem conforme são geradas

---

### 5. Requisitos Técnicos

#### 5.1 Frontend
- **Framework:** React 18 com TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS com sistema de design customizado
- **UI Components:** shadcn/ui
- **State Management:** React Query para cache e sincronização
- **Routing:** React Router v6

#### 5.2 Backend (Lovable Cloud / Supabase)
- **Database:** PostgreSQL com Row-Level Security (RLS)
- **Authentication:** Supabase Auth com Google OAuth
- **Storage:** Supabase Storage para imagens
- **Edge Functions:** Deno para processamento assíncrono
- **API Integration:** Google Generative AI (Gemini)

#### 5.3 Segurança
- Row-Level Security (RLS) em todas as tabelas
- Criptografia de API keys no banco
- Validação de inputs no frontend e backend
- CORS configurado corretamente
- Rate limiting nas Edge Functions
- Logs de auditoria para ações administrativas

---

### 6. Modelo de Dados

#### 6.1 Entidades Principais

**profiles**
- Informações básicas do usuário
- Status da conta (active, pending, suspended)

**user_roles**
- Sistema de roles separado por segurança
- Roles: admin, user

**api_keys**
- Armazenamento criptografado de keys
- Metadados de validação e uso

**generation_sessions**
- Agrupamento de gerações em lote
- Tracking de progresso e status

**prompt_batches**
- Individual prompt dentro de uma sessão
- Link para imagem de referência

**generation_results**
- Imagens geradas individuais
- Metadados e URLs

**admin_activity_logs**
- Auditoria de ações administrativas

---

### 7. Métricas de Sucesso

#### KPIs Primários
- Número de usuários ativos mensais
- Taxa de conversão de cadastro para primeira geração
- Número médio de gerações por usuário
- Taxa de sucesso de gerações (vs. falhas)

#### KPIs Secundários
- Tempo médio de geração por imagem
- Taxa de retenção de usuários (D7, D30)
- NPS (Net Promoter Score)
- Uptime da plataforma (target: 99.5%)

---

### 8. Roadmap Futuro

#### Fase 2 (Curto Prazo)
- Sistema de créditos e planos de assinatura
- Compartilhamento público de gerações
- Galeria comunitária
- Filtros e edição básica de imagens

#### Fase 3 (Médio Prazo)
- Integração com mais provedores de IA (DALL-E, Midjourney)
- API pública para desenvolvedores
- Webhooks para notificações
- Workspaces para equipes

#### Fase 4 (Longo Prazo)
- Editor de imagens integrado
- Sistema de templates
- Marketplace de prompts
- Treinamento de modelos customizados

---

### 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Falha na API do Google | Média | Alto | Sistema de retry, fallback para outras APIs |
| Abuso de geração em massa | Alta | Médio | Rate limiting, sistema de créditos |
| Vazamento de API keys | Baixa | Crítico | Criptografia, RLS, auditoria |
| Custos de armazenamento | Média | Médio | Compressão de imagens, limpeza automática |

---

### 10. Critérios de Aceitação

#### Para Lançamento MVP
- [ ] Autenticação funcional (email + Google)
- [ ] Sistema de roles implementado
- [ ] CRUD de API keys com validação
- [ ] Geração de imagens em lote funcional
- [ ] Visualização de resultados responsiva
- [ ] Histórico de gerações completo
- [ ] Painel administrativo básico
- [ ] RLS configurado em todas as tabelas
- [ ] Documentação completa

#### Para Produção
- [ ] Testes end-to-end completos
- [ ] Performance otimizada (< 3s carregamento)
- [ ] Monitoramento e alertas configurados
- [ ] Backup automatizado do banco
- [ ] Suporte a 100+ usuários simultâneos
- [ ] Conformidade com LGPD/GDPR
