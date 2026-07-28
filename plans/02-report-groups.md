# Grupos de relatórios (CRUD)

**Depende de:** `00-overview.md` (tabelas `report_groups`, `report_group_members`,
helpers `getSessionUser`/`requirePermission` em `api/_lib/auth.js`, guardas
`RequireAuth`/`RequirePermission`). **Não depende de** `01`/`03`/`04`/`05`, mas usa o
hook `useAppChromeTheme` definido em `01` — se `01` ainda não estiver mergeado,
implementar a tela chamando `applyTheme({colorIndex: appColorIndex ?? 0, fontIndex:
0}, appTheme)` direto e trocar pelo hook depois (não bloquear por isso).

## O que é

CRUD simples de "grupos de relatórios" (nome + descrição) e a atribuição de um
relatório a zero ou mais grupos. Permissão: só usuários com
`permissions['report_groups.manage'] === true` acessam a tela e a API de escrita.

## API — `api/report-groups.js`

Mesmo padrão de `api/reports.js` (CORS, `export const config = { runtime: 'nodejs'
}`, parsing de id via `req.url`). Usar `getPool()` de `api/_lib/db.js` e
`sendJson`/`corsHeaders` de `api/_lib/http.js` (não duplicar).

Todas as rotas abaixo: `const user = await getSessionUser(req); if (!user) return
sendJson(res, 401, ...)`. Para escrita (`POST`/`PUT`/`DELETE`), além disso:
`if (!requirePermission(user, 'report_groups.manage')) return sendJson(res, 403,
...)`. Leitura (`GET`) só exige estar logado (qualquer perfil pode ver a lista de
grupos existentes — necessário para o combobox de filtro por categoria no dashboard e
para o formulário de perfil em `03`).

- `GET /api/report-groups` → lista `{ id, name, description, reportCount }` (contar
  via `LEFT JOIN report_group_members` + `count(*)` agrupado).
- `POST /api/report-groups` → body `{ name, description }`, cria, devolve o registro.
  `name` é `UNIQUE` no banco — capturar erro de constraint e devolver `409` com
  mensagem clara ("Já existe um grupo com esse nome"), não deixar vazar o erro cru do
  Postgres.
- `PUT /api/report-groups/:id` → atualiza `name`/`description`.
- `DELETE /api/report-groups/:id` → `ON DELETE CASCADE` já limpa
  `report_group_members` e `profile_report_groups` sozinho (definido no schema de
  `00`); só confirmar que não quebra nada, sem lógica extra necessária.

### Atribuir grupos a um relatório

Isso é consumido também pelo editor de relatórios (`05`), então a forma de
ler/gravar a relação vive aqui, não lá:

- `GET /api/report-groups/by-report/:slug` → array de `group_id`s do relatório
  (usado pelo formulário de edição em `05`).
- `PUT /api/report-groups/by-report/:slug` → body `{ groupIds: [...] }`, substitui
  todas as associações daquele relatório (`DELETE FROM report_group_members WHERE
  report_slug = $1` seguido de `INSERT` em lote dentro de uma transação). Exige
  `reports.manage` (não `report_groups.manage`!) já que quem atribui grupo a um
  relatório é quem edita relatórios (plano `05`) — mas só pode escolher **entre os
  grupos existentes**, não criar grupo novo daquela tela (isso é exclusivo da tela
  `02`). Se `requirePermission(user, 'reports.manage')` falhar, `403`.

## Front-end — `src/pages/admin/ReportGroups.jsx`

Rota `/admin/report-groups`, adicionada em `App.jsx`:

```jsx
<Route path="/admin/report-groups" element={
  <RequireAuth><RequirePermission module="report_groups.manage"><ReportGroups /></RequirePermission></RequireAuth>
} />
```

Tela: `useAppChromeTheme('Grupos de relatórios')` no mount. Layout consistente com
`Home.jsx` (mesmo `.report-header`/`.report-headline`/`.report-wrap`, é literalmente
outra "página" do mesmo app, não um design diferente) — cabeçalho "Grupos de
relatórios", botão "+ Novo grupo" alinhado à direita do heading, e uma tabela/lista
simples abaixo:

| Nome | Descrição | Relatórios | |
|---|---|---|---|
| Financeiro | ... | 3 | Editar · Excluir |

"+ Novo grupo" e "Editar" abrem o mesmo modal de formulário (nome + descrição,
textarea pequena), reusando o visual de `SettingsModal` (`.dia-modal-backdrop`/
`.dia-modal`, definido em `01` — se `01` não estiver pronto ainda, usar as mesmas
classes CSS diretamente, elas já existem em `dia.css` hoje via `Modal.jsx`).
"Excluir" pede confirmação (`window.confirm`) mencionando quantos relatórios ficarão
sem esse grupo, já que a exclusão é `CASCADE`.

Adicionar item ao menu flutuante (`AppMenu.jsx`, de `01`):
`{ key: 'report-groups', label: 'Grupos de relatórios', icon: FolderKanban, to:
'/admin/report-groups', permission: 'report_groups.manage' }`.

## Consumo em `05` (referência, não implementar aqui)

O editor de relatórios usa `GET /api/report-groups` para popular um multi-select de
checkboxes no formulário de relatório, e `GET`/`PUT
/api/report-groups/by-report/:slug` para ler/gravar a atribuição. Não duplicar essa
lógica em `05` — é a mesma API definida aqui.

## Verificação

1. `npm run build` sem erros.
2. Migração aplicada (parte de `00`), criar 2-3 grupos de teste via `POST`, listar,
   editar nome, excluir um e confirmar que reports/perfis associados perdem a
   referência sem erro (graças ao `CASCADE`).
3. Confirmar que um usuário sem `report_groups.manage` recebe `403` da API e a tela
   correspondente não aparece no menu nem é acessível por URL direta (redireciona).
