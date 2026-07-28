# Perfis e permissões (CRUD)

**Depende de:** `00-overview.md` (tabelas `profiles`, `profile_report_groups`,
helpers de auth) e `02-report-groups.md` (precisa de `GET /api/report-groups` para o
formulário de perfil listar grupos disponíveis). **Bloqueia** `04-users-auth.md`
(usuário referencia perfil, não dá pra montar o formulário de usuário sem a lista de
perfis existir).

## O que é

CRUD de "perfis" (= papéis/roles): nome + um conjunto de permissões por módulo
(booleanos, ver tabela de módulos em `00-overview.md`) + quais grupos de relatório
esse perfil enxerga. Permissão: só quem tem `permissions['profiles.manage'] ===
true` acessa.

## API — `api/profiles.js`

Mesmo padrão dos outros (`api/_lib/db.js`, `api/_lib/http.js`, `getSessionUser` +
`requirePermission(user, 'profiles.manage')` em toda escrita; leitura exige só estar
logado — necessário para o formulário de usuário em `04` popular o select de perfil).

- `GET /api/profiles` → lista `{ id, name, permissions, groupIds: [...], userCount }`
  (`userCount` via `LEFT JOIN users` contando, útil pra tela avisar antes de excluir
  um perfil em uso).
- `POST /api/profiles` → body `{ name, permissions, groupIds }`. Dentro de uma
  transação: insere em `profiles`, depois insere as linhas em
  `profile_report_groups` para cada `groupId`. `permissions` é validado no servidor
  contra a lista fixa de módulos (não aceitar chaves arbitrárias — filtrar só as 4
  chaves conhecidas, ignorar o resto do payload).
- `PUT /api/profiles/:id` → mesma lógica de `POST`, mas fazendo `DELETE FROM
  profile_report_groups WHERE profile_id = $1` antes de reinserir (substituição
  completa, mais simples que diff).
- `DELETE /api/profiles/:id` → `ON DELETE SET NULL` em `users.profile_id` (já
  definido no schema de `00`) — usuários daquele perfil ficam sem perfil, não são
  apagados. A tela deve avisar isso antes de confirmar (usar o `userCount` do `GET`).

## Front-end — `src/pages/admin/Profiles.jsx`

Rota `/admin/profiles`, guardada por `RequireAuth` + `RequirePermission
module="profiles.manage"`, mesmo padrão de `02-report-groups.md`.

`useAppChromeTheme('Perfis')` no mount. Lista: nome, quantidade de usuários, quantos
módulos liberados (ex. "3 de 4 módulos"), ações Editar/Excluir. "+ Novo perfil" abre
modal de formulário com:

```
Nome        [input texto]

Permissões
[ ] Gerenciar grupos de relatórios
[ ] Gerenciar perfis
[ ] Gerenciar usuários
[ ] Gerenciar relatórios (editor)

Grupos de relatório visíveis
[ ] Todos os grupos                    ← checkbox especial, ver nota abaixo
[ ] Financeiro
[ ] Marketing
[ ] ...
```

Os 4 checkboxes de permissão mapeiam 1:1 para as chaves de `00-overview.md` — não
inventar rótulos diferentes das chaves, só traduzir pra português na label visível
(ex. chave `users.manage` → label "Gerenciar usuários").

**Nota sobre "Todos os grupos":** a regra de visibilidade em `00-overview.md` já
trata relatório sem nenhum grupo como público pra qualquer logado, mas um relatório
QUE TEM grupo só aparece pra quem tem aquele grupo liberado. Perfis administrativos
(como o Admin seed) precisam enxergar tudo. Em vez de inventar um valor mágico no
banco, o checkbox "Todos os grupos" no formulário, quando marcado, simplesmente
seleciona todos os `groupIds` existentes no momento do salvamento (comportamento
client-side: ao marcar, marca todos os outros checkboxes; ao desmarcar qualquer um
individualmente, desmarca também o "Todos"). Isso significa que um perfil "vê tudo"
só até o próximo grupo ser criado — é uma limitação aceitável para este escopo (não
implementar um flag `sees_all` separado no banco a menos que o usuário peça).

Buscar a lista de grupos disponíveis via `GET /api/report-groups` (de `02`) para
renderizar os checkboxes — não duplicar dados de grupo aqui.

Adicionar item ao menu flutuante: `{ key: 'profiles', label: 'Perfis', icon: Users2
(ou ShieldCheck), to: '/admin/profiles', permission: 'profiles.manage' }`.

## Verificação

1. `npm run build` sem erros.
2. Criar um perfil "Editor" com só `reports.manage` marcado e 1 grupo específico;
   confirmar via API que `GET /api/profiles` devolve exatamente isso.
3. Excluir um perfil que tem usuário vinculado e confirmar que o usuário não é
   apagado, só fica com `profile_id = null` (o comportamento de um usuário sem perfil
   é definido em `04` — provavelmente "sem permissão nenhuma e não vê relatório
   nenhum com grupo").
4. Confirmar 401/403 nos mesmos moldes de `02`.
