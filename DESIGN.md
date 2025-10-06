# Design System Documentation
## AI Image Generator Platform

### 1. Visão Geral do Design

**Filosofia de Design:**
- **Minimalista e Moderno:** Interface limpa focada em funcionalidade
- **Responsivo:** Design mobile-first que escala para desktop
- **Acessível:** WCAG 2.1 AA compliant
- **Consistente:** Sistema de design tokens para uniformidade

---

### 2. Sistema de Cores

#### 2.1 Paleta Principal (HSL)

O projeto utiliza um sistema de cores baseado em tokens semânticos definidos no `index.css`:

```css
:root {
  /* Background Colors */
  --background: 0 0% 100%;           /* Branco puro */
  --foreground: 222.2 84% 4.9%;      /* Texto principal (quase preto) */

  /* Card Colors */
  --card: 0 0% 100%;                 /* Fundo de cards */
  --card-foreground: 222.2 84% 4.9%; /* Texto em cards */

  /* Primary Brand Colors */
  --primary: 222.2 47.4% 11.2%;      /* Azul escuro principal */
  --primary-foreground: 210 40% 98%; /* Texto sobre primary */

  /* Secondary Colors */
  --secondary: 210 40% 96.1%;        /* Cinza claro */
  --secondary-foreground: 222.2 47.4% 11.2%; /* Texto sobre secondary */

  /* Muted Colors */
  --muted: 210 40% 96.1%;            /* Backgrounds sutis */
  --muted-foreground: 215.4 16.3% 46.9%; /* Texto desabilitado */

  /* Accent Colors */
  --accent: 210 40% 96.1%;           /* Highlights */
  --accent-foreground: 222.2 47.4% 11.2%; /* Texto sobre accent */

  /* Destructive (Erros) */
  --destructive: 0 84.2% 60.2%;      /* Vermelho */
  --destructive-foreground: 210 40% 98%; /* Texto sobre destructive */

  /* Border & Input */
  --border: 214.3 31.8% 91.4%;       /* Bordas gerais */
  --input: 214.3 31.8% 91.4%;        /* Bordas de inputs */
  --ring: 222.2 84% 4.9%;            /* Focus ring */

  /* Radius */
  --radius: 0.5rem;                  /* Border radius padrão */
}

/* Dark Mode */
.dark {
  --background: 222.2 84% 4.9%;      /* Preto azulado */
  --foreground: 210 40% 98%;         /* Texto claro */
  
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  
  --primary: 210 40% 98%;            /* Invertido */
  --primary-foreground: 222.2 47.4% 11.2%;
  
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  
  --destructive: 0 62.8% 30.6%;      /* Vermelho escuro */
  --destructive-foreground: 210 40% 98%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

#### 2.2 Uso de Cores

**CRÍTICO:** Sempre use tokens semânticos, nunca cores diretas:

```tsx
// ✅ CORRETO
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ ERRADO
<div className="bg-white text-black">
<Button className="bg-blue-500 text-white">
```

#### 2.3 Cores Funcionais

| Uso | Token | Hex (Light) | Hex (Dark) |
|-----|-------|-------------|------------|
| Sucesso | `text-green-600` | #16a34a | #22c55e |
| Aviso | `text-yellow-600` | #ca8a04 | #eab308 |
| Erro | `bg-destructive` | #ef4444 | #991b1b |
| Info | `text-blue-600` | #2563eb | #3b82f6 |

---

### 3. Tipografia

#### 3.1 Font Family

```css
:root {
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
}
```

#### 3.2 Escala Tipográfica

| Elemento | Classe Tailwind | Tamanho | Peso | Uso |
|----------|----------------|---------|------|-----|
| H1 | `text-4xl font-bold` | 36px | 700 | Títulos principais |
| H2 | `text-3xl font-semibold` | 30px | 600 | Seções principais |
| H3 | `text-2xl font-semibold` | 24px | 600 | Subsections |
| H4 | `text-xl font-medium` | 20px | 500 | Cards, grupos |
| Body Large | `text-lg` | 18px | 400 | Texto destacado |
| Body | `text-base` | 16px | 400 | Texto padrão |
| Body Small | `text-sm` | 14px | 400 | Legendas |
| Caption | `text-xs` | 12px | 400 | Metadados |

#### 3.3 Line Height

```css
leading-none: 1
leading-tight: 1.25
leading-snug: 1.375
leading-normal: 1.5    /* Padrão para texto */
leading-relaxed: 1.625
leading-loose: 2
```

---

### 4. Espaçamento

#### 4.1 Sistema de Grid

Baseado em múltiplos de 4px (0.25rem):

```
1 = 4px
2 = 8px
3 = 12px
4 = 16px   /* Padrão para padding interno */
6 = 24px
8 = 32px   /* Padrão para margins entre seções */
12 = 48px
16 = 64px
```

#### 4.2 Padrões de Layout

**Container Principal:**
```tsx
<div className="container mx-auto px-4 py-8">
```

**Card Spacing:**
```tsx
<Card className="p-6 space-y-4">
```

**Form Spacing:**
```tsx
<form className="space-y-6">
  <div className="space-y-2"> {/* Label + Input */}
```

---

### 5. Componentes UI

#### 5.1 Botões

**Variantes Disponíveis:**

```tsx
// Primary (padrão)
<Button>Clique Aqui</Button>

// Secondary
<Button variant="secondary">Secundário</Button>

// Outline
<Button variant="outline">Outline</Button>

// Ghost (sem fundo)
<Button variant="ghost">Ghost</Button>

// Destructive (ações perigosas)
<Button variant="destructive">Deletar</Button>

// Link (parece texto)
<Button variant="link">Link</Button>
```

**Tamanhos:**
```tsx
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>
```

**Estados:**
```tsx
<Button disabled>Desabilitado</Button>
<Button>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Carregando
</Button>
```

#### 5.2 Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Conteúdo principal */}
  </CardContent>
  <CardFooter>
    {/* Ações ou info adicional */}
  </CardFooter>
</Card>
```

#### 5.3 Forms

```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="fieldName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input placeholder="Placeholder" {...field} />
        </FormControl>
        <FormDescription>Texto de ajuda</FormDescription>
        <FormMessage /> {/* Erros de validação */}
      </FormItem>
    )}
  />
</Form>
```

#### 5.4 Tabelas

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Coluna 1</TableHead>
      <TableHead>Coluna 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Dado 1</TableCell>
      <TableCell>Dado 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### 5.5 Dialogs e Modals

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descrição</DialogDescription>
    </DialogHeader>
    {/* Conteúdo */}
    <DialogFooter>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 5.6 Toasts (Notificações)

```tsx
const { toast } = useToast();

toast({
  title: "Sucesso!",
  description: "Operação concluída.",
});

toast({
  variant: "destructive",
  title: "Erro",
  description: "Algo deu errado.",
});
```

---

### 6. Layout e Navegação

#### 6.1 Estrutura de Layout

```
AppLayout (Wrapper)
├── Header (Topo fixo)
│   ├── Logo
│   ├── Navigation Links
│   └── User Menu + Notificações
├── Sidebar (Lateral colapsável)
│   └── Menu de navegação
└── Main Content (Área principal)
    └── Conteúdo da página
```

#### 6.2 Header

**Altura:** `h-16` (64px)
**Background:** `bg-background` com `border-b`
**Conteúdo:** Flex justify-between align-center

#### 6.3 Sidebar

**Largura:** 
- Desktop: `w-64` (256px)
- Colapsada: `w-16` (64px)
- Mobile: Full overlay

**Items do Menu:**
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <NavLink to="/path" className={({ isActive }) => 
      isActive ? "bg-accent" : ""
    }>
      <Icon className="h-4 w-4" />
      <span>Label</span>
    </NavLink>
  </SidebarMenuButton>
</SidebarMenuItem>
```

---

### 7. Responsividade

#### 7.1 Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

#### 7.2 Padrões Mobile-First

```tsx
{/* Mobile por padrão, desktop com prefixos */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Esconder no mobile */}
<div className="hidden md:block">

{/* Mostrar apenas no mobile */}
<div className="block md:hidden">
```

#### 7.3 Container Responsivo

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
```

---

### 8. Animações e Transições

#### 8.1 Transições Padrão

```css
transition-all duration-200 ease-in-out  /* Padrão */
transition-colors  /* Apenas cores */
transition-transform  /* Apenas transformações */
```

#### 8.2 Animações do Tailwind

```tsx
animate-spin      /* Loading spinners */
animate-pulse     /* Loading skeletons */
animate-bounce    /* Atenção temporária */
animate-fade-in   /* Entradas suaves (custom) */
```

#### 8.3 Hover States

```tsx
hover:bg-accent
hover:scale-105
hover:shadow-lg
group-hover:opacity-100
```

---

### 9. Iconografia

**Biblioteca:** Lucide React

**Tamanhos Padrão:**
```tsx
<Icon className="h-4 w-4" />  /* 16px - Inline com texto */
<Icon className="h-5 w-5" />  /* 20px - Botões */
<Icon className="h-6 w-6" />  /* 24px - Headers */
<Icon className="h-8 w-8" />  /* 32px - Features */
```

**Ícones Comuns:**
- `Loader2` - Loading states (com animate-spin)
- `AlertCircle` - Erros e avisos
- `CheckCircle2` - Sucessos
- `Info` - Informações
- `X` - Fechar/Cancelar
- `Plus` - Adicionar
- `Trash2` - Deletar
- `Edit` - Editar

---

### 10. Acessibilidade

#### 10.1 Contraste

- Texto regular: Mínimo 4.5:1
- Texto grande (18px+): Mínimo 3:1
- Elementos interativos: Mínimo 3:1

#### 10.2 Focus States

```tsx
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

#### 10.3 ARIA Labels

```tsx
<Button aria-label="Fechar modal">
  <X className="h-4 w-4" />
</Button>

<input aria-describedby="helper-text" />
<p id="helper-text">Texto de ajuda</p>
```

#### 10.4 Navegação por Teclado

- Tab order lógico
- Enter/Space para ativar botões
- Escape para fechar modais
- Arrow keys para navegação em listas

---

### 11. Dark Mode

**Toggle:**
```tsx
import { useTheme } from "next-themes"

const { theme, setTheme } = useTheme()

<Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Toggle Theme
</Button>
```

**Testar Ambos os Temas:**
Todos os componentes devem funcionar perfeitamente em light e dark mode usando os tokens semânticos.

---

### 12. Padrões de Código

#### 12.1 Estrutura de Componente

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setLoading(true)
    try {
      await onAction?.()
      toast({ title: "Sucesso!" })
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Erro",
        description: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Button onClick={handleClick} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ação
      </Button>
    </div>
  )
}
```

#### 12.2 Naming Conventions

- **Componentes:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase com prefixo "use" (`useMyHook.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Types:** PascalCase com sufixo quando necessário (`UserProfile`, `ApiResponse`)

---

### 13. Performance

#### 13.1 Otimizações de Imagem

```tsx
<img 
  src={url} 
  alt={alt}
  loading="lazy"
  className="w-full h-auto object-cover"
/>
```

#### 13.2 Code Splitting

```tsx
import { lazy, Suspense } from "react"

const HeavyComponent = lazy(() => import("./HeavyComponent"))

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

#### 13.3 Memoization

```tsx
import { useMemo, useCallback } from "react"

const expensiveValue = useMemo(() => calculateExpensive(data), [data])
const memoizedCallback = useCallback(() => doSomething(), [dependency])
```

---

### 14. Checklist de Implementação

Ao criar novos componentes/páginas, verificar:

- [ ] Usa tokens de cores semânticas (não cores diretas)
- [ ] Responsivo (mobile-first)
- [ ] Funciona em dark mode
- [ ] Acessível (ARIA labels, keyboard navigation)
- [ ] Loading states implementados
- [ ] Error states implementados
- [ ] Validação de formulários (se aplicável)
- [ ] Toast notifications para feedback
- [ ] Consistente com design system
- [ ] Performance otimizada (lazy loading, memoization)
