# Database Schema Documentation
## AI Image Generator Platform - Supabase/PostgreSQL

### Visão Geral

Este documento descreve o schema completo do banco de dados PostgreSQL gerenciado pelo Supabase, incluindo tabelas, relacionamentos, índices, triggers, funções e políticas RLS (Row-Level Security).

---

## 1. Diagrama de Relacionamentos (ERD)

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
user_roles (1:N)

profiles
    ↓
api_keys (1:N)
    ↓
generation_sessions (1:N)
    ↓
prompt_batches (1:N)
    ↓
generation_results (1:N)

user_roles → admin_activity_logs (1:N)
```

---

## 2. Tabelas

### 2.1 `profiles`

**Descrição:** Armazena informações básicas dos usuários e status da conta.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | - | PK, referência ao auth.users |
| `email` | text | YES | - | Email do usuário |
| `full_name` | text | YES | - | Nome completo |
| `avatar_url` | text | YES | - | URL do avatar |
| `status` | text | NO | 'active' | Status: active, pending, suspended |
| `created_at` | timestamptz | NO | now() | Data de criação |
| `updated_at` | timestamptz | NO | now() | Última atualização |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `id` → `auth.users(id)` ON DELETE CASCADE
- CHECK: `status IN ('active', 'pending', 'suspended')`

**Índices:**
```sql
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);
```

**RLS Policies:**

```sql
-- Users can view their own profile
CREATE POLICY "Authenticated users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Authenticated admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Users can update their own profile
CREATE POLICY "Authenticated users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Authenticated admins can update all profiles"
  ON profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Users can insert their own profile
CREATE POLICY "Authenticated users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Triggers:**
```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

### 2.2 `user_roles`

**Descrição:** Sistema de roles separado por segurança (evita escalação de privilégios).

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `user_id` | uuid | NO | - | FK para auth.users |
| `role` | app_role | NO | - | Enum: 'admin' ou 'user' |
| `created_at` | timestamptz | NO | now() | Data de criação |

**Custom Types:**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'user');
```

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `auth.users(id)` ON DELETE CASCADE
- UNIQUE: `(user_id, role)` - Usuário não pode ter role duplicado

**Índices:**
```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**RLS Policies:**

```sql
-- Users can view their own roles
CREATE POLICY "Authenticated users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Authenticated admins can view all roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can insert roles
CREATE POLICY "Authenticated admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update roles
CREATE POLICY "Authenticated admins can update roles"
  ON user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete roles (but not their own admin role)
CREATE POLICY "Authenticated admins can delete roles"
  ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins cannot remove their own admin role"
  ON user_roles FOR DELETE
  USING (NOT (auth.uid() = user_id AND role = 'admin'));
```

---

### 2.3 `api_keys`

**Descrição:** Armazena API keys do Google AI Studio de forma criptografada.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `user_id` | uuid | NO | - | FK para auth.users |
| `key_name` | text | NO | - | Nome amigável da key |
| `encrypted_key` | text | NO | - | Key criptografada |
| `is_valid` | boolean | YES | false | Status de validação |
| `usage_count` | integer | YES | 0 | Contador de uso |
| `last_validated_at` | timestamptz | YES | - | Última validação |
| `created_at` | timestamptz | NO | now() | Data de criação |
| `updated_at` | timestamptz | NO | now() | Última atualização |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `auth.users(id)` ON DELETE CASCADE

**Índices:**
```sql
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_is_valid ON api_keys(is_valid);
```

**RLS Policies:**

```sql
-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
```

**Triggers:**
```sql
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

### 2.4 `generation_sessions`

**Descrição:** Agrupa gerações em lote, tracking de progresso.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `user_id` | uuid | NO | - | FK para auth.users |
| `status` | text | NO | 'pending' | Status: pending, processing, completed, failed |
| `total_prompts` | integer | NO | 0 | Total de prompts na sessão |
| `completed_prompts` | integer | YES | 0 | Prompts processados |
| `failed_prompts` | integer | YES | 0 | Prompts que falharam |
| `created_at` | timestamptz | NO | now() | Data de criação |
| `updated_at` | timestamptz | NO | now() | Última atualização |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `auth.users(id)` ON DELETE CASCADE
- CHECK: `status IN ('pending', 'processing', 'completed', 'failed')`

**Índices:**
```sql
CREATE INDEX idx_generation_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX idx_generation_sessions_status ON generation_sessions(status);
CREATE INDEX idx_generation_sessions_created_at ON generation_sessions(created_at DESC);
```

**RLS Policies:**

```sql
-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON generation_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON generation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON generation_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

**Triggers:**
```sql
CREATE TRIGGER update_generation_sessions_updated_at
  BEFORE UPDATE ON generation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

### 2.5 `prompt_batches`

**Descrição:** Individual prompt dentro de uma sessão de geração.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `session_id` | uuid | NO | - | FK para generation_sessions |
| `prompt_text` | text | NO | - | Texto do prompt |
| `reference_image_url` | text | YES | - | URL da imagem de referência |
| `variations_count` | integer | YES | 3 | Número de variações |
| `status` | text | NO | 'pending' | Status do processamento |
| `created_at` | timestamptz | NO | now() | Data de criação |
| `updated_at` | timestamptz | NO | now() | Última atualização |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `session_id` → `generation_sessions(id)` ON DELETE CASCADE
- CHECK: `variations_count BETWEEN 1 AND 10`
- CHECK: `status IN ('pending', 'processing', 'completed', 'failed')`

**Índices:**
```sql
CREATE INDEX idx_prompt_batches_session_id ON prompt_batches(session_id);
CREATE INDEX idx_prompt_batches_status ON prompt_batches(status);
```

**RLS Policies:**

```sql
-- Users can view their own prompt batches
CREATE POLICY "Users can view their own prompt batches"
  ON prompt_batches FOR SELECT
  USING (auth.uid() = (
    SELECT user_id FROM generation_sessions 
    WHERE id = session_id
  ));

-- Users can insert their own prompt batches
CREATE POLICY "Users can insert their own prompt batches"
  ON prompt_batches FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT user_id FROM generation_sessions 
    WHERE id = session_id
  ));

-- Users can update their own prompt batches
CREATE POLICY "Users can update their own prompt batches"
  ON prompt_batches FOR UPDATE
  USING (auth.uid() = (
    SELECT user_id FROM generation_sessions 
    WHERE id = session_id
  ));
```

**Triggers:**
```sql
CREATE TRIGGER update_prompt_batches_updated_at
  BEFORE UPDATE ON prompt_batches
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

### 2.6 `generation_results`

**Descrição:** Imagens geradas individuais.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `batch_id` | uuid | NO | - | FK para prompt_batches |
| `variation_number` | integer | NO | - | Número da variação (1-N) |
| `image_url` | text | NO | - | URL da imagem no Storage |
| `is_selected` | boolean | YES | false | Marcado como favorito |
| `metadata` | jsonb | YES | - | Metadados adicionais |
| `created_at` | timestamptz | NO | now() | Data de criação |

**Constraints:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `batch_id` → `prompt_batches(id)` ON DELETE CASCADE

**Índices:**
```sql
CREATE INDEX idx_generation_results_batch_id ON generation_results(batch_id);
CREATE INDEX idx_generation_results_is_selected ON generation_results(is_selected);
CREATE INDEX idx_generation_results_created_at ON generation_results(created_at DESC);
```

**RLS Policies:**

```sql
-- Users can view their own results
CREATE POLICY "Users can view their own results"
  ON generation_results FOR SELECT
  USING (auth.uid() = (
    SELECT gs.user_id 
    FROM generation_sessions gs
    JOIN prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));

-- Users can insert their own results
CREATE POLICY "Users can insert their own results"
  ON generation_results FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT gs.user_id 
    FROM generation_sessions gs
    JOIN prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));

-- Users can update their own results
CREATE POLICY "Users can update their own results"
  ON generation_results FOR UPDATE
  USING (auth.uid() = (
    SELECT gs.user_id 
    FROM generation_sessions gs
    JOIN prompt_batches pb ON pb.session_id = gs.id
    WHERE pb.id = batch_id
  ));
```

---

### 2.7 `admin_activity_logs`

**Descrição:** Auditoria de ações administrativas.

**Colunas:**

| Nome | Tipo | Nullable | Default | Descrição |
|------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `admin_user_id` | uuid | YES | - | ID do admin que executou |
| `target_user_id` | uuid | YES | - | ID do usuário afetado |
| `action` | text | NO | - | Tipo de ação |
| `details` | jsonb | YES | - | Detalhes adicionais |
| `created_at` | timestamptz | NO | now() | Data da ação |

**Constraints:**
- PRIMARY KEY: `id`

**Índices:**
```sql
CREATE INDEX idx_admin_activity_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_activity_logs_target_user_id ON admin_activity_logs(target_user_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
```

**RLS Policies:**

```sql
-- Only admins can view activity logs
CREATE POLICY "Only admins can view activity logs"
  ON admin_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert activity logs
CREATE POLICY "Only admins can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

---

## 3. Storage Buckets

### 3.1 `generated-images`

**Descrição:** Bucket público para imagens geradas.

**Configuração:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);
```

**RLS Policies:**

```sql
-- Anyone can view images
CREATE POLICY "Public images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images' 
    AND auth.role() = 'authenticated'
  );

-- Users can update their own images
CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'generated-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 4. Funções do Banco

### 4.1 `handle_updated_at()`

**Descrição:** Atualiza automaticamente o campo `updated_at`.

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

### 4.2 `handle_new_user()`

**Descrição:** Cria perfil automaticamente quando usuário se cadastra.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user with 'pending' status
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### 4.3 `handle_new_user_role()`

**Descrição:** Atribui role "user" automaticamente para novos usuários.

```sql
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_role();
```

---

### 4.4 `has_role()`

**Descrição:** Função de segurança para verificar roles sem recursão RLS.

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

**CRÍTICO:** Esta função usa `SECURITY DEFINER` para evitar recursão infinita em RLS policies.

---

## 5. Queries Úteis

### 5.1 Listar todos os usuários com roles e status

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.status,
  array_agg(ur.role) as roles,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### 5.2 Estatísticas de geração por usuário

```sql
SELECT 
  p.email,
  COUNT(DISTINCT gs.id) as total_sessions,
  SUM(gs.total_prompts) as total_prompts,
  COUNT(gr.id) as total_images_generated
FROM profiles p
LEFT JOIN generation_sessions gs ON gs.user_id = p.id
LEFT JOIN prompt_batches pb ON pb.session_id = gs.id
LEFT JOIN generation_results gr ON gr.batch_id = pb.id
GROUP BY p.id, p.email
ORDER BY total_images_generated DESC;
```

### 5.3 Sessões ativas

```sql
SELECT 
  gs.id,
  p.email,
  gs.status,
  gs.total_prompts,
  gs.completed_prompts,
  gs.created_at
FROM generation_sessions gs
JOIN profiles p ON p.id = gs.user_id
WHERE gs.status IN ('pending', 'processing')
ORDER BY gs.created_at DESC;
```

### 5.4 Logs de atividade admin

```sql
SELECT 
  aal.id,
  admin.email as admin_email,
  target.email as target_email,
  aal.action,
  aal.details,
  aal.created_at
FROM admin_activity_logs aal
LEFT JOIN profiles admin ON admin.id = aal.admin_user_id
LEFT JOIN profiles target ON target.id = aal.target_user_id
ORDER BY aal.created_at DESC
LIMIT 100;
```

---

## 6. Migrações

Todas as alterações de schema devem ser feitas através de migrações SQL versionadas em `supabase/migrations/`.

**Estrutura de arquivo de migração:**
```
YYYYMMDDHHMMSS_description.sql
```

**Exemplo:**
```sql
-- Migration: Add aspect_ratio to prompt_batches
-- Created at: 2025-01-15

ALTER TABLE prompt_batches
ADD COLUMN aspect_ratio text DEFAULT '1:1'
CHECK (aspect_ratio IN ('1:1', '16:9', '9:16', '4:3', '3:4'));
```

---

## 7. Backup e Manutenção

### 7.1 Backup Automático

O Supabase realiza backups automáticos diários. Para projetos de produção:
- Ativar Point-in-Time Recovery (PITR)
- Reter backups por 30+ dias

### 7.2 Limpeza de Dados Antigos

```sql
-- Deletar sessões antigas (>90 dias) com status completed
DELETE FROM generation_sessions
WHERE status = 'completed'
AND created_at < NOW() - INTERVAL '90 days';

-- Deletar imagens órfãs do storage
-- (Executar via script administrativo)
```

---

## 8. Segurança

### 8.1 Checklist de Segurança

- [x] RLS ativado em todas as tabelas
- [x] Funções SECURITY DEFINER auditadas
- [x] API keys criptografadas
- [x] Triggers de auditoria para ações admin
- [x] Roles separados em tabela própria
- [x] Validação de inputs via CHECK constraints
- [x] Storage buckets com políticas adequadas

### 8.2 Princípios de Segurança

1. **Principle of Least Privilege:** Usuários só acessam seus próprios dados
2. **Defense in Depth:** Múltiplas camadas (RLS, funções, aplicação)
3. **Audit Trail:** Todas ações administrativas logadas
4. **Encryption at Rest:** Dados sensíveis criptografados

---

## 9. Monitoramento

### 9.1 Métricas Importantes

- Taxa de crescimento de `generation_results`
- Tamanho do bucket `generated-images`
- Queries lentas (>1s)
- Falhas em `generation_sessions`

### 9.2 Alertas Recomendados

- Storage > 80% da capacidade
- CPU do banco > 70% por 5+ minutos
- Taxa de erro em edge functions > 5%
- Crescimento anormal de tabelas

---

## 10. Schema Evolution

### Próximas Iterações Planejadas

1. **Sistema de Créditos**
   - Tabela `user_credits`
   - Histórico de transações
   
2. **Compartilhamento**
   - Tabela `shared_generations`
   - URLs públicas customizadas

3. **Templates**
   - Tabela `prompt_templates`
   - Sistema de marketplace

4. **Workspaces**
   - Tabela `workspaces`
   - Membros e permissões
