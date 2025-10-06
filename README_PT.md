# AI Image Generator Platform 🎨

Plataforma web completa para geração de imagens usando inteligência artificial, permitindo que usuários criem múltiplas variações de imagens a partir de prompts de texto e imagens de referência.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Documentação](#documentação)
- [Arquitetura](#arquitetura)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Visão Geral

Esta plataforma oferece uma solução completa para geração de imagens por IA com:

- **Sistema Multi-usuário** com autenticação robusta (email/senha + Google OAuth)
- **Controle de Acesso** baseado em roles (Admin/User)
- **Geração em Lote** de múltiplas variações por prompt
- **Histórico Completo** de todas as gerações
- **Painel Administrativo** para gestão de usuários
- **API Keys Seguras** com criptografia e validação

## ✨ Funcionalidades

### Para Usuários

- 🔐 **Autenticação Segura**
  - Login com email/senha
  - Login social com Google
  - Recuperação de senha
  - Perfil personalizável

- 🎨 **Geração de Imagens**
  - Múltiplos prompts simultaneamente (até 50)
  - Upload de imagem de referência (opcional)
  - Seleção de aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
  - Variações configuráveis (1-10 por prompt)
  - Processamento em background

- 📊 **Gestão de Resultados**
  - Visualização em grid responsivo
  - Preview em tamanho completo
  - Marcar favoritos
  - Download individual ou em lote
  - Filtros por data, status, prompt

- 📜 **Histórico**
  - Lista cronológica de sessões
  - Estatísticas de uso
  - Reprocessamento de falhas

### Para Administradores

- 👥 **Gestão de Usuários**
  - Listar todos os usuários
  - Aprovar novos cadastros
  - Suspender/reativar contas
  - Deletar usuários
  - Atribuir roles

- 📈 **Dashboard**
  - Métricas gerais da plataforma
  - Monitoramento de uso
  - Logs de atividade administrativa

## 🛠 Tecnologias

### Frontend

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado servidor
- **React Router v6** - Roteamento
- **Lucide React** - Ícones

### Backend (Lovable Cloud / Supabase)

- **PostgreSQL** - Banco de dados
- **Supabase Auth** - Autenticação
- **Supabase Storage** - Armazenamento de imagens
- **Edge Functions (Deno)** - Processamento serverless
- **Row-Level Security (RLS)** - Segurança de dados

### Integrações

- **Google Generative AI** - Geração de imagens (Gemini)
- **Google OAuth** - Login social

## 📦 Pré-requisitos

- Node.js 18+ e npm/yarn/pnpm
- Conta no Lovable (para deploy e backend)
- API Key do Google AI Studio ([Obter aqui](https://aistudio.google.com/app/apikey))
- (Opcional) Credenciais do Google OAuth para login social

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd ai-image-generator
```

### 2. Instale as Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as Variáveis de Ambiente

As variáveis de ambiente são gerenciadas automaticamente pelo Lovable Cloud. Ao executar localmente, elas são carregadas do arquivo `.env` (gerado automaticamente).

**Variáveis importantes:**
- `VITE_SUPABASE_URL` - URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave pública do Supabase
- `VITE_SUPABASE_PROJECT_ID` - ID do projeto

### 4. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

A aplicação estará disponível em `http://localhost:8080`.

## ⚙️ Configuração

### Primeiro Acesso

1. **Acesse a Aplicação**
   - Vá para a página de login
   - Crie uma nova conta

2. **Aprovação de Admin**
   - Novos usuários começam com status "pending"
   - Um admin deve aprovar sua conta
   - **Primeiro usuário:** Execute o seguinte SQL no Supabase para tornar-se admin:

   ```sql
   -- Substitua <user_id> pelo seu ID de usuário
   INSERT INTO user_roles (user_id, role)
   VALUES ('<user_id>', 'admin');
   
   -- Ative seu perfil
   UPDATE profiles
   SET status = 'active'
   WHERE id = '<user_id>';
   ```

3. **Configure sua API Key**
   - Acesse "Configurar API"
   - Insira sua API Key do Google AI Studio
   - Clique em "Validar e Salvar"

4. **Comece a Gerar**
   - Vá para "Nova Geração"
   - Insira seus prompts
   - Configure parâmetros
   - Clique em "Iniciar Geração"

### Google OAuth (Opcional)

Para habilitar login com Google:

1. Acesse o backend da aplicação
2. Vá para "Users" → "Auth Settings" → "Google"
3. Insira seu Client ID e Client Secret do Google Cloud Console
4. Configure a URL de redirecionamento

## 📖 Uso

### Geração Básica

```
1. Nova Geração → Inserir Prompts
2. (Opcional) Upload de Imagem de Referência
3. Selecionar Aspect Ratio
4. Definir Número de Variações
5. Iniciar Geração
6. Visualizar Resultados
```

### Exemplo de Prompts

```text
A serene mountain landscape at sunset
A futuristic cityscape with flying cars
A cute cartoon cat wearing sunglasses
```

### Dicas para Melhores Resultados

- **Seja Específico:** Inclua detalhes como estilo, iluminação, cores
- **Use Referências:** Upload de imagem ajuda a manter consistência
- **Experimente:** Gere múltiplas variações e escolha a melhor
- **Itere:** Use resultados como referência para refinar

## 📚 Documentação

A documentação completa está organizada nos seguintes arquivos:

- **[PRD.md](./PRD.md)** - Product Requirements Document
  - Visão do produto
  - Funcionalidades detalhadas
  - Fluxos de usuário
  - Requisitos técnicos
  - Roadmap

- **[DESIGN.md](./DESIGN.md)** - Design System
  - Sistema de cores
  - Tipografia
  - Componentes UI
  - Padrões de layout
  - Responsividade
  - Acessibilidade

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Schema do Banco
  - Estrutura de tabelas
  - Relacionamentos
  - RLS Policies
  - Funções e triggers
  - Queries úteis
  - Segurança

## 🏗 Arquitetura

### Estrutura de Diretórios

```
├── src/
│   ├── components/          # Componentes React
│   │   ├── layout/         # Layouts (Header, Sidebar, AppLayout)
│   │   └── ui/             # Componentes UI do shadcn
│   ├── contexts/           # Context API (Auth)
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # Integrações externas
│   │   └── supabase/      # Cliente Supabase
│   ├── lib/                # Utilitários
│   ├── pages/              # Páginas da aplicação
│   └── main.tsx            # Entry point
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── create-users/  # Criação em lote
│   │   ├── delete-user/   # Deleção de usuário
│   │   ├── generate-images/ # Geração de imagens
│   │   └── validate-api-keys/ # Validação de keys
│   ├── migrations/         # Migrações SQL
│   └── config.toml         # Configuração
├── PRD.md                  # Product Requirements
├── DESIGN.md               # Design System
└── DATABASE_SCHEMA.md      # Schema do Banco
```

### Fluxo de Dados

```
User Action
    ↓
React Component
    ↓
React Query (Cache)
    ↓
Supabase Client
    ↓
RLS Policies (Validação)
    ↓
PostgreSQL Database
    ↓
Edge Functions (Background Jobs)
    ↓
External APIs (Google AI)
    ↓
Supabase Storage
    ↓
Results Back to User
```

### Segurança

- **Row-Level Security (RLS)** em todas as tabelas
- **API Keys criptografadas** no banco
- **CORS configurado** corretamente
- **Validação de inputs** frontend + backend
- **Auditoria de ações** administrativas
- **Rate limiting** nas Edge Functions

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Siga o estilo de código existente (ESLint + Prettier)
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Use commits semânticos (feat, fix, docs, etc.)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- **Lovable** - Plataforma de desenvolvimento
- **Supabase** - Backend as a Service
- **Google AI** - Modelos de geração de imagens
- **shadcn** - Componentes UI
- Comunidade open-source

## 📞 Suporte

Para suporte e dúvidas:

- 📧 Email: support@example.com
- 💬 Discord: [Link do Discord]
- 📖 Documentação: [Link da Documentação]
- 🐛 Issues: [GitHub Issues]

---

Feito com ❤️ usando [Lovable](https://lovable.dev)
