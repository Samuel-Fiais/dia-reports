# Usuários (CRUD) + contexto de autenticação no front-end

**Depende de:** `00-overview.md` (schema `users`, `api/auth.js`, helpers de sessão —
a MECÂNICA de login/cookie já está especificada lá, este plano não a redefine) e
`03-profiles-permissions.md` (formulário de usuário precisa de `GET /api/profiles`
para o select de perfil). Sem `03` pronto, dá pra desenvolver a tela com um select
mockado e trocar depois — não é bloqueio duro, só de dado.

## O que é

Duas coisas neste plano:
1. O `AuthContext` + `Login.jsx` + guardas de rota (`RequireAuth`/`RequirePermission`)
   que TODOS os outros planos (`01`–`03`, `05`) já assumem existir — construir aqui
   primeiro se for o agente pegando este plano cedo.
2. A tela de CRUD de usuários (`email`, senha, perfil), permissionada por
   `users.manage`.

## Parte 1 — `AuthContext` e guardas (fundação de front-end)

`src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext({ user: null, loading: true, login: async () => {}, logout: async () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth')
    setUser(res.ok ? await res.json() : null)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (email, password) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Falha no login')
    await refresh()
  }

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

Todas as chamadas `fetch` para `/api/*` no projeto (ver `src/lib/registry.js`)
precisam passar `credentials: 'same-origin'` (padrão do browser já cobre isso pra
same-origin, mas deixar explícito não custa) para o cookie de sessão ir junto —
conferir se algum fetch existente usa `mode: 'cors'` ou algo que quebre isso (hoje
não usa, então deve funcionar sem mudança, só confirmar).

`src/components/RequireAuth.jsx`:

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null // ou um spinner simples, sem over-engineering
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
```

`src/components/RequirePermission.jsx`: igual, mas depois de confirmar `user`,
verifica `user.permissions?.[module] === true`; se faltar, `<Navigate to="/"
replace />` (redireciona pro dashboard em vez de tela de erro — mais simples e
consistente pra este escopo).

`src/pages/Login.jsx`: formulário simples, `useAppChromeTheme('Entrar')` (de `01`) no
mount, chama `useAuth().login(email, senha)`, em caso de sucesso navega para
`location.state?.from ?? '/'`. Erro de credencial mostra mensagem inline abaixo do
formulário (sem toast/lib nova). Visual: reusar a estética de card centralizado —
`Fraunces` para o título "Entrar", inputs com o mesmo estilo de borda/raio dos outros
campos do app (ver `.dashboard-search input`/`.settings-swatches` como referência de
tokens, não copiar classes específicas).

`src/App.jsx` final (juntando com o que `00` já define):

```jsx
<AuthProvider>
  <ThemeProvider>
    <BrowserRouter>
      <AppMenu /> {/* de 01, só renderiza itens permitidos */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/report/:id" element={<RequireAuth><ReportPage /></RequireAuth>} />
        <Route path="/admin/report-groups" element={<RequireAuth><RequirePermission module="report_groups.manage"><ReportGroups /></RequirePermission></RequireAuth>} />
        <Route path="/admin/profiles" element={<RequireAuth><RequirePermission module="profiles.manage"><Profiles /></RequirePermission></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><RequirePermission module="users.manage"><Users /></RequirePermission></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><RequirePermission module="reports.manage"><ReportsAdmin /></RequirePermission></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
</AuthProvider>
```

Note a ordem: `AuthProvider` fora de `ThemeProvider` — não depende de tema, e
`AppMenu` (que lê ambos os contextos) precisa estar dentro dos dois.

## Parte 2 — CRUD de usuários

### API — `api/users.js`

Mesmo padrão dos outros. `getSessionUser` obrigatório em tudo; escrita exige
`requirePermission(user, 'users.manage')`.

- `GET /api/users` → lista `{ id, email, profileId, profileName, active,
  createdAt }` (join com `profiles` pro nome; **nunca** devolver `password_hash`).
- `POST /api/users` → body `{ email, password, profileId, active }`. `password` é
  obrigatório na criação, mínimo 8 caracteres (validar no servidor, não só no
  client). `hashPassword` de `api/_lib/auth.js` (de `00`) antes de gravar. `email`
  é `UNIQUE` — mesmo tratamento de conflito que `report_groups` (`409` com mensagem
  clara em vez do erro cru do Postgres).
- `PUT /api/users/:id` → body `{ email, profileId, active, password? }` — `password`
  é **opcional** aqui: se vier vazio/ausente, mantém o hash atual; se vier
  preenchido, re-hasheia.
- `DELETE /api/users/:id` → exclusão direta. Adicionar uma trava simples: não deixar
  o usuário excluir a **própria conta logada no momento** (comparar `user.id` da
  sessão com o `:id` do path, `400` se igual) — evita se autoexcluir sem querer e
  ficar trancado fora.

### Front-end — `src/pages/admin/Users.jsx`

Rota `/admin/users`, guarda `RequirePermission module="users.manage"`.
`useAppChromeTheme('Usuários')` no mount. Lista: e-mail, nome do perfil, status
(ativo/inativo como badge, reusar `.state-badge` de `Badges.jsx`), Editar/Excluir.
"+ Novo usuário" abre modal:

```
E-mail       [input email]
Senha        [input password]           (obrigatório só na criação)
Perfil       [select — vem de GET /api/profiles, de 03]
Ativo        [toggle]
```

No modo edição, o campo senha vem com placeholder "Deixe em branco para manter a
senha atual" e não é obrigatório. Usuário inativo (`active: false`) deve ser
bloqueado no login (`api/auth.js`, de `00` — **atualizar aquele endpoint** para
checar `active` além da senha, devolvendo `401` genérico igual a senha errada, para
não vazar se o e-mail existe mas está desativado).

Adicionar item ao menu flutuante: `{ key: 'users', label: 'Usuários', icon: User, to:
'/admin/users', permission: 'users.manage' }`. Adicionar também, no próprio
`AppMenu`, um item fixo "Sair" (`useAuth().logout()`, sem permissão associada,
sempre visível pra qualquer logado) — não estava listado nos módulos porque logout
não é uma tela, é uma ação; incluir aqui já que é este plano que traz `useAuth`.

## Verificação

1. `npm run build` sem erros.
2. Criar um usuário de teste com perfil "Editor" (de `03`), logar com ele, confirmar
   que só vê os itens de menu permitidos por aquele perfil.
3. Tentar excluir a própria conta logada → deve ser bloqueado.
4. Desativar um usuário e confirmar que o login dele passa a falhar.
5. Confirmar que navegar para `/admin/users` deslogado redireciona para `/login`, e
   logado sem `users.manage` redireciona para `/`.
