# Visão geral — sistema de usuários, permissões e administração

## Contexto

O dia-reports hoje é um app 100% público (React SPA + Vercel serverless + Neon
Postgres, ver `CLAUDE.md`): qualquer pessoa acessa o dashboard e qualquer relatório
sem login. Vamos introduzir um sistema completo de usuários/perfis/permissões e um
conjunto de telas administrativas (grupos de relatórios, perfis, usuários, editor de
relatórios), além de um menu flutuante com configuração de tema do app.

**Decisão confirmada com o usuário:** a partir desta mudança, o app inteiro passa a
exigir login — dashboard e páginas de relatório incluídos. Os grupos de relatórios
controlam o que cada perfil consegue ver. O link de compartilhamento público
(`?shared=1`, hoje só cosmético) **não é tocado por este conjunto de planos** — é um
tema pausado à parte (ver "Fora de escopo" abaixo).

Este arquivo define o contrato compartilhado (schema, autenticação, permissões,
convenções) que os outros 5 planos (`01`–`05`) assumem como já existente. Ele deve
ser implementado **primeiro**, ou pelo menos sua interface deve ser respeitada por
quem começar os outros planos em paralelo.

## Ordem de implementação recomendada

1. **Este arquivo (fundação)**: schema de `report_groups`, `profiles`, `users` +
   sessão/login (`api/auth.js`, `api/_lib/*`). Sem isso nada mais funciona.
2. `02-report-groups.md` — depende só da fundação.
3. `03-profiles-permissions.md` — depende de `report_groups` existir (perfil
   referencia grupos permitidos).
4. `04-users-auth.md` — depende de `profiles` existir (usuário referencia perfil).
   **Atenção**: a fundação de login (schema + `api/auth.js`) é construída aqui em
   `00`, mas a *tela* de CRUD de usuários é detalhada em `04`.
5. `01-app-theme-settings.md` — só depende do menu flutuante existir; permissão dos
   itens do menu depende de `04` estar pronto (pode ser feito em paralelo e ligado
   depois).
6. `05-report-editor-crud.md` — depende de `02` (atribuir grupos a um relatório) e da
   fundação de auth.

Se múltiplos agentes forem trabalhar em paralelo: um agente faz a fundação (`00`)
primeiro e sozinho; depois disso, `01`, `02` podem rodar em paralelo; `03` espera
`02`; `04` espera `03`; `05` espera `02` e `04`. Alternativa mais paralela: todos
implementam contra os contratos descritos abaixo (que não mudam) usando dados mockados
até a fundação real ser mergeada.

## Fora de escopo (não implementar aqui)

- Link de compartilhamento público tokenizado ("à prova de fraude") — tema pausado
  a pedido do usuário antes deste plano. Não alterar `ShareButton.jsx` nem o
  comportamento de `?shared=1`.
- Recuperação de senha / envio de e-mail — não pedido, deixar de fora.
- Auditoria/log de ações — não pedido.

## Módulos do sistema (chaves de permissão)

Permissões de perfil são baseadas em módulos fixos. Cada perfil tem um objeto
`permissions` (jsonb) mapeando chave → boolean:

| Chave                 | Controla                                                    |
|------------------------|-------------------------------------------------------------|
| `report_groups.manage` | Ver/criar/editar/excluir grupos de relatórios (tela `02`)   |
| `profiles.manage`      | Ver/criar/editar/excluir perfis (tela `03`)                 |
| `users.manage`         | Ver/criar/editar/excluir usuários (tela `04`)                |
| `reports.manage`       | Ver/criar/editar/excluir relatórios via editor (tela `05`)  |

A configuração de tema (`01`) **não** é permissionada — qualquer usuário logado pode
mudar o tema do app.

Visibilidade de relatórios no dashboard/relatório individual **não** é uma permissão
de módulo — é resolvida via grupos de relatórios (ver abaixo), não pela tabela acima.

## Modelo de dados (Postgres/Neon)

**⚠️ Descoberta durante a implementação:** o `DATABASE_URL` deste projeto aponta para
um banco Neon **compartilhado com outro sistema** não relacionado (tabelas `tenants`,
`zettels`, `conversations`, `agent_memories`, `contatos`, `familiares`, `providers`,
e um `users` daquele outro app com colunas `tenant_id`/`name`/`role`/
`model_override_provider_id` — nada a ver com dia-reports). Por isso **todas as
tabelas novas deste plano vivem num schema Postgres dedicado, `dia_reports`**, para
não colidir nunca com as tabelas do outro sistema. A tabela `reports` existente
**continua em `public`** (não foi movida — é a que a app já usa em produção, mover
teria mais risco que benefício agora). Toda query nova deve qualificar o schema
explicitamente (`dia_reports.users`, não só `users`) — não confiar em
`search_path`, é mais seguro e explícito com dois schemas em jogo.

Migrações continuam aditivas e aplicadas com um script Node pontual usando
`@neondatabase/serverless` + `DATABASE_URL` do `.env` (rodar, conferir resultado,
apagar o script) — mesmo padrão da migração de `updated_at` já feita neste projeto.
**Estado atual: já aplicado** (schema `dia_reports` criado, as 4 tabelas abaixo
existem e têm os triggers de `updated_at`; ver seed abaixo, também já rodado).

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- garante gen_random_uuid()
CREATE SCHEMA IF NOT EXISTS dia_reports;

CREATE TABLE dia_reports.report_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- relatório <-> grupo, muitos-para-muitos. Um relatório sem nenhuma linha aqui
-- é considerado "público para qualquer usuário logado" (ver regra de visibilidade).
-- Referencia public.reports(slug) explicitamente por estar em schema diferente.
CREATE TABLE dia_reports.report_group_members (
  report_slug text NOT NULL REFERENCES public.reports(slug) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES dia_reports.report_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (report_slug, group_id)
);

CREATE TABLE dia_reports.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}', -- { "users.manage": true, ... } chaves da tabela acima, ou { "*": true } pra permissão suprema (ver seed)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- quais grupos de relatório um perfil enxerga
CREATE TABLE dia_reports.profile_report_groups (
  profile_id uuid NOT NULL REFERENCES dia_reports.profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES dia_reports.report_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, group_id)
);

CREATE TABLE dia_reports.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  profile_id uuid REFERENCES dia_reports.profiles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- triggers de updated_at reusam a função public.set_updated_at() já criada
-- para a tabela reports (mesma function, um trigger novo por tabela).
```

**Permissão suprema:** em vez de listar as 4 chaves de módulo uma a uma, um perfil
pode ter `permissions = {"*": true}` — significa acesso irrestrito a todos os
módulos **e** a todos os grupos de relatório (bypass total, não precisa de linhas em
`profile_report_groups`). `requirePermission`/`canViewReport` em `api/_lib/auth.js`
checam esse curinga primeiro antes de olhar a chave específica.

**Seed já aplicado:** perfil `Admin` (`dia_reports.profiles`, `permissions: {"*":
true}`) e usuário `admin@dia.com.br` (`dia_reports.users`, senha gerada
aleatoriamente e entregue ao usuário fora deste repo, hash bcrypt salvo). Se for
recriar do zero em outro ambiente, gerar uma senha nova — nunca reusar a mesma.

## Regra de visibilidade de relatórios

Um relatório é visível para um usuário autenticado se:
- o perfil do usuário tem a permissão suprema (`permissions["*"] === true`, ex.: o
  perfil `Admin` seedado), **ou**
- o relatório **não tem nenhum grupo associado** em `report_group_members` (público
  para qualquer logado — mantém os 3 relatórios de exemplo já existentes visíveis sem
  precisar migrar dados manualmente), **ou**
- pelo menos um dos grupos do relatório está entre os grupos permitidos do perfil do
  usuário (`profile_report_groups`).

Isso vale tanto para a listagem (`GET /api/reports`) quanto para o acesso direto
(`GET /api/reports/:slug` deve devolver 404 — não 403, para não vazar existência —
se o usuário não tiver acesso).

## Autenticação e sessão

Sem dependências novas de JWT/sessão — usar cookie assinado com `crypto` nativo do
Node (já disponível no runtime `nodejs` das functions) + `bcryptjs` só para hash de
senha (única dependência nova, pura JS, sem binário nativo — segura pra serverless).

```bash
npm install bcryptjs
```

Variável de ambiente `SESSION_SECRET`: **já gerada e adicionada em `.env` e
`.env.local`** (junto com a correção de uma corrupção pré-existente nesses arquivos —
`DATABASE_URL` tinha um prompt de shell colado no final da string sem quebra de
linha; foi corrigido). Falta só o usuário adicionar a mesma variável nas env vars do
projeto na Vercel para produção — nenhum agente tem acesso ao dashboard da Vercel.

Formato do cookie `dia_session` (httpOnly, `SameSite=Lax`, `Secure` em produção,
`Path=/`, `Max-Age` 30 dias):

```
base64url(JSON.stringify({ uid, exp })) + "." + hmacSha256Hex(SESSION_SECRET, payload)
```

Helpers compartilhados a criar em `api/_lib/` (prefixo `_` faz a Vercel **não**
tratar esses arquivos como rotas):

- `api/_lib/db.js` — exporta `getPool()` idêntico ao padrão já usado em
  `api/reports.js` (extrair de lá para reuso, sem duplicar).
- `api/_lib/auth.js` — exporta:
  - `hashPassword(plain)` / `verifyPassword(plain, hash)` (bcryptjs).
  - `createSessionCookie(userId)` → string pronta para header `Set-Cookie`.
  - `clearSessionCookie()` → string para logout.
  - `getSessionUser(req)` → lê `req.headers.cookie`, valida assinatura/expiração,
    busca o usuário + perfil + `permissions` + `allowedGroupIds` no banco (um único
    JOIN em `dia_reports.users`/`dia_reports.profiles`/
    `dia_reports.profile_report_groups`, todos schema-qualificados), retorna
    `{ id, email, profileId, profileName, permissions, allowedGroupIds }` ou `null`
    (também `null` se `active = false`). **Toda rota protegida chama isso primeiro.**
  - `requirePermission(user, key)` → boolean
    (`user?.permissions?.['*'] === true || user?.permissions?.[key] === true`).
  - `canViewReport(user, reportGroupIds)` → boolean, implementa a regra de
    visibilidade acima: `user.permissions['*'] === true || reportGroupIds.length ===
    0 || reportGroupIds.some(id => user.allowedGroupIds.includes(id))`.
- `api/_lib/http.js` — extrai `sendJson`/`corsHeaders` de `api/reports.js` para reuso
  (hoje duplicaria em todo endpoint novo).

`api/auth.js` (rota pública, é o único endpoint que não chama `getSessionUser` como
guarda de entrada):
- `POST { email, password }` → busca usuário por email, `verifyPassword`, se ok seta
  cookie e devolve `{ id, email, profileName, permissions }`; se não, `401`.
- `GET` → devolve o usuário da sessão atual (ou `401` se não logado) — usado pelo
  front no boot do app para saber se mostra `/login` ou o app.
- `DELETE` → limpa o cookie, `204`.

## Front-end: guarda de rota e contexto de sessão

Novo `src/context/AuthContext.jsx` (mesmo padrão de `ThemeContext.jsx`): no mount,
chama `GET /api/auth`; expõe `{ user, loading, login(email,pw), logout() }` via
`useAuth()`. Envolve todo `<App>` (dentro de `ThemeProvider`, fora de `BrowserRouter`
ou dentro, tanto faz — mas precisa envolver as `Routes`).

Novo `src/components/RequireAuth.jsx`: componente wrapper de rota — se `loading`,
mostra um estado simples de carregamento; se `!user`, `<Navigate to="/login" />`;
senão renderiza `children`. Usado em `App.jsx` envolvendo `/` e `/report/:id` (rotas
já existentes) e todas as rotas novas.

Novo `src/components/RequirePermission.jsx`: como `RequireAuth`, mas também confere
`user.permissions[module] === true`; se faltar, redireciona para `/` com uma mensagem
(pode reusar um pattern simples de `?denied=1` lido pela Home, ou uma página própria
`403` — decisão livre de quem implementar, mantendo simples).

Nova página `src/pages/Login.jsx`: formulário e-mail/senha, chama `useAuth().login`,
erro inline se falhar. Visual consistente com o resto do app (Fraunces para o título,
mesma paleta de `--bg`/`--surface`/`--hairline`, botão no estilo pill já usado em
`.report-share-btn`). **Sem rodar o navegador para desenvolver isso** — o usuário
pediu para só abrirmos o Browser quando ele pedir explicitamente; valide via
`npm run build`/leitura de código, e só rode o preview se for pedido.

`src/App.jsx` fica assim (rotas novas descritas nos planos `01`–`05` se encaixam
aqui):

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
  <Route path="/report/:id" element={<RequireAuth><ReportPage /></RequireAuth>} />
  {/* rotas administrativas adicionadas por 02/03/04/05, cada uma com RequireAuth + RequirePermission */}
</Routes>
```

## Convenções que todos os planos devem seguir

- **CRUD sempre com o mesmo padrão de tela**: lista (tabela simples, sem paginação
  por enquanto — poucos registros esperados) + botão "+ Novo" + modal de
  criação/edição reusando o visual de `SettingsModal` (definido em `01`) + confirmação
  simples antes de excluir (`window.confirm` está OK para este escopo, sem exagerar).
- **Toda tela administrativa nova** deve, no mount, aplicar o tema do app (não o de
  relatório) — ver hook `useAppChromeTheme()` definido em `01-app-theme-settings.md`.
  Não hardcodar `colorIndex: 0` como `Home.jsx` faz hoje.
- **Toda rota de API nova** segue o padrão de `api/reports.js`: `export const config
  = { runtime: 'nodejs' }`, CORS igual, `sendJson` do `api/_lib/http.js`, um arquivo
  por recurso (`api/report-groups.js`, `api/profiles.js`, `api/users.js`), parsing de
  slug/id via `req.url` do mesmo jeito que `getSlug` já faz.
- **Todas as tabelas novas** ganham `updated_at` com o mesmo trigger `set_updated_at`
  já criado para `reports` (reusar a função, só criar o trigger novo por tabela).
- **Sem novas dependências** além de `bcryptjs`, salvo se um plano específico
  justificar (ex.: uma lib de formulário) — preferir HTML/React puro, o app inteiro
  hoje não usa nenhuma lib de formulário/estado externo.

## Verificação de ponta a ponta (fundação)

1. Rodar a migração, criar o perfil Admin + usuário inicial (com credenciais
   combinadas com o usuário, não inventadas).
2. `npx vercel dev` e testar: `POST /api/auth` com credenciais certas → cookie
   setado, `GET /api/auth` autenticado devolve o usuário; com credenciais erradas →
   `401`.
3. Confirmar que `GET /api/reports` sem cookie → `401`; com cookie do Admin → lista
   completa (todos os 3 relatórios de exemplo, já que nenhum tem grupo ainda).
4. `npm run build` sem erros.
