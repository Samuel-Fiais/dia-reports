# Editor de relatórios (CRUD via JSON)

**Depende de:** `00-overview.md` (auth) e `02-report-groups.md` (API de atribuição
de grupos ao relatório). **Não depende de** `01`/`03`/`04` além do que já é comum
(hook de tema, guardas de rota) — pode ser feito em paralelo assim que `02` estiver
pronto.

## O que é

Tela `/admin/reports` para criar/editar/excluir relatórios via **upload/download do
JSON** (não um formulário campo-a-campo — o app já tem um schema JSON rico e bem
documentado em `REPORT-SCHEMA.md`; reformular isso como formulário seria um projeto à
parte). Permissão: `reports.manage`.

**Atenção a uma inconsistência da documentação existente:** `REPORT-SCHEMA.md` diz
"Todo relatório é um arquivo `.json` salvo na pasta `src/reports/`... o dashboard
descobre os arquivos automaticamente" — isso está **desatualizado**. Por `CLAUDE.md`
(fonte de verdade): os arquivos em `src/reports/*.json` são só referência/exemplo, o
app de verdade lê e grava na tabela Postgres `reports` via `api/reports.js`. Este
plano segue `CLAUDE.md`, não a frase desatualizada do schema doc — o upload de JSON
grava direto no banco, não em arquivo.

## API — estender `api/reports.js`

Hoje só tem `GET`. Adicionar, todos exigindo `getSessionUser` (401 se ausente) e os
de escrita exigindo `requirePermission(user, 'reports.manage')` (403 se faltar):

- `GET /api/reports?admin=1` → variante da listagem que **ignora** o filtro de
  visibilidade por grupo (ver regra em `00-overview.md`) e devolve todos os
  relatórios com seus `groupIds` inclusos, **só se** o requisitante tiver
  `reports.manage` (senão, tratar `admin=1` como se não tivesse sido passado —
  não devolver 403 aqui, só ignorar o parâmetro silenciosamente, pra não quebrar
  quem chama sem saber desse detalhe). Usada exclusivamente pela tela deste plano.
- `POST /api/reports` → body `{ slug, title, date, content }` (o JSON completo de
  `content`, no formato de `REPORT-SCHEMA.md`; `slug` vem do campo `id` do JSON
  enviado, ou de um campo separado no formulário de upload se o JSON não tiver
  `id`). Valida: `slug` bate no padrão kebab-case (`/^[a-z0-9-]+$/`), `title` e
  `content` presentes, `content` é um objeto JSON válido (já garantido pelo
  `JSON.parse` do client, mas revalidar no servidor — nunca confiar só no client).
  `slug` é a chave primária de `reports` — conflito vira `409` com mensagem clara
  ("Já existe um relatório com esse slug").
- `PUT /api/reports/:slug` → substitui `title`/`date`/`content` de um relatório
  existente (mesmo corpo do `POST`, sem mexer no slug — trocar o slug de um
  relatório existente não é um caso suportado neste escopo; se precisar, é
  excluir+recriar).
- `DELETE /api/reports/:slug` → exclusão direta (`ON DELETE CASCADE` em
  `report_group_members` já cuida da limpeza, de `00`).

Nenhuma dessas rotas mexe em `report_group_members` diretamente — isso é feito à
parte via `PUT /api/report-groups/by-report/:slug` (API já definida em `02`,
consumida pelo front deste plano).

## Front-end — `src/pages/admin/ReportsAdmin.jsx`

Rota `/admin/reports`, guarda `RequirePermission module="reports.manage"`.
`useAppChromeTheme('Relatórios (admin)')` no mount.

**Lista**: reusa a mesma UI de card do dashboard (`Home.jsx` — mesmo
`.report-card-grid`, mesma busca/ordenação já implementadas lá, ver
`dashboard-controls`/`dashboard-search`/`dashboard-sort` em `dia.css`) mas chamando
`GET /api/reports?admin=1` em vez de `GET /api/reports`, e cada card ganha ações
extras: **Baixar JSON**, **Editar**, **Excluir** (em vez de simplesmente linkar pro
relatório). Não recriar a busca/ordenação do zero — extrair a lógica de filtro de
`Home.jsx` para um hook `src/lib/useReportFilters.js` se for reaproveitar de verdade,
ou aceitar duplicação pequena se o escopo não justificar a extração (decisão de quem
implementar, mas preferir extrair já que o padrão de busca+ordenação é idêntico).

**Baixar JSON**: botão que gera um `Blob` com `JSON.stringify(report.content, null,
2)` e dispara download via link temporário (`URL.createObjectURL` +
`a.click()` + `URL.revokeObjectURL`) — tudo client-side, sem chamada de API além do
`GET` que já trouxe o `content` (se a listagem admin não incluir `content` completo
por peso, buscar sob demanda em `GET /api/reports/:slug` antes de gerar o blob).

**Criar/Editar**: um único modal/tela com:

```
[+ Novo relatório]  ou  [Editar "Nome do relatório"]

Enviar arquivo JSON     [input type="file" accept=".json"]
                         ou colar JSON diretamente [textarea, alternativa]

Grupos de relatório     [ ] Financeiro  [ ] Marketing  [ ] ...
                         (multi-select vindo de GET /api/report-groups, de 02)

[Cancelar]  [Salvar]
```

Fluxo do upload: `file.text()` → `JSON.parse` (envolver em `try/catch`, mostrar erro
inline "JSON inválido" sem quebrar a tela se falhar) → preencher um preview simples
(título, headline, quantas seções — reusar `countSections`-like helper de
`Home.jsx`) para o usuário confirmar antes de salvar → no "Salvar", `POST` (criar) ou
`PUT` (editar) para `api/reports.js`, seguido de `PUT
/api/report-groups/by-report/:slug` com os grupos marcados (duas chamadas
sequenciais — se a segunda falhar, avisar mas não desfazer a primeira, é aceitável
para este escopo não ter transação cross-API).

Ao editar um relatório existente, pré-carregar o formulário com: `GET
/api/reports/:slug` (para o JSON atual, usado tanto para exibir o preview quanto como
ponto de partida se o usuário clicar "Baixar JSON" antes de reenviar editado) e `GET
/api/report-groups/by-report/:slug` (para os checkboxes de grupo já virem marcados).

**Excluir**: `window.confirm` avisando que é irreversível, então `DELETE
/api/reports/:slug`.

Adicionar item ao menu flutuante: `{ key: 'reports-admin', label: 'Editor de
relatórios', icon: FileEdit, to: '/admin/reports', permission: 'reports.manage' }`.

## Verificação

1. `npm run build` sem erros.
2. Baixar o JSON de um relatório existente (ex. `exemplo-completo`), editar um campo
   nele localmente, subir de volta via "Editar" e confirmar que o relatório público
   (`/report/exemplo-completo`) reflete a mudança.
3. Criar um relatório novo via upload de um JSON válido (usar
   `src/reports/exemplo-completo.json` como base, mudando o `id`), confirmar que
   aparece no dashboard normal (`/`) só se o usuário logado tiver acesso ao(s)
   grupo(s) atribuído(s) (ou nenhum grupo = todo mundo vê, regra de `00`).
4. Subir um JSON malformado e confirmar que dá erro claro sem quebrar a tela.
5. Excluir o relatório de teste e confirmar 404 ao tentar abri-lo depois.
