# Editor visual de relatórios (blocos)

## Contexto

Hoje o único jeito de criar/editar o conteúdo de um relatório é escrever o JSON à mão (schema
documentado em `REPORT-SCHEMA.md`, exemplo vivo em `src/reports/exemplo-completo.json`) e colar
esse JSON num textarea simples dentro do admin (`src/components/admin/JsonEditor.jsx`, usado por
`src/pages/admin/ReportsAdmin.jsx`). Isso funciona, mas exige conhecer de cor os ~250 tipos de
bloco existentes (`src/components/blocks/index.jsx` + `advanced.jsx`) e não dá nenhum feedback
visual até salvar e abrir o relatório publicado.

O pedido é substituir essa edição "só JSON" por um **editor por blocos, totalmente visual**: o
usuário monta o relatório adicionando seções, escolhendo o tipo de bloco e preenchendo os dados
através de formulários/UI, sem tocar em JSON diretamente. Duas restrições guiam o design:

1. **Arquitetura limpa e extensível** — adicionar um novo tipo de bloco ao editor deve ser barato
   (hoje adicionar um bloco novo já significa criar um componente de render; o editor não pode
   multiplicar esse custo por 250 tipos).
2. **UI limpa e consistente** com o visual já existente (mesma tipografia, paleta, ícones
   `lucide-react`, convenção de CSS global em `src/styles/dia.css`), reaproveitando peças já
   prontas como as paletas/fontes do `src/lib/theme.js` e o painel de settings.

O backend já suporta tudo que é necessário (CRUD completo em `api/reports.js`: `POST`, `PUT`,
`DELETE` em `/api/reports[/:slug]`, jsonb `content`) — o trabalho é quase inteiramente front-end.

## Decisão chave de arquitetura: registry de blocos separado do renderer

`src/components/blocks/index.jsx` (`ItemBlock`) continua sendo a única fonte de verdade para
**renderizar** um bloco (não mexer nele exceto se um novo tipo precisar de componente de render
novo). Para **editar**, criamos um registry paralelo, orientado a metadados:

`src/lib/blockRegistry.js`
```js
export const BLOCK_TYPES = {
  paragraph: {
    label: 'Parágrafo', category: 'Conteúdo',
    fields: [{ key: 'text', type: 'textarea', label: 'Texto' }],
    defaultValue: () => ({ type: 'paragraph', text: '' }),
  },
  chart: {
    label: 'Gráfico', category: 'Análise',
    fields: [
      { key: 'variant', type: 'select', label: 'Tipo', options: ['line','bar','doughnut','pie'] },
      { key: 'labels', type: 'array-string', label: 'Rótulos' },
      { key: 'datasets', type: 'array-object', label: 'Séries',
        itemFields: [{key:'label',type:'text'}, {key:'data',type:'array-number'}] },
    ],
    defaultValue: () => ({ type: 'chart', variant: 'bar', labels: [], datasets: [] }),
  },
  // ...
}
```
- Cada entrada = **label + categoria + lista de campos genéricos** (não um formulário
  hand-rolled por tipo). Um punhado de tipos de campo genéricos (`text`, `textarea`, `number`,
  `select`, `toggle`, `array-string`, `array-number`, `array-object`, `image`, `date`) cobre a
  vasta maioria dos ~250 tipos, porque a maior parte já segue o padrão
  título/texto/status/lista-de-itens (isso é visível em `advanced.jsx`'s `AdvancedBlock`, que já
  lê genericamente `title|label`, `summary|text|description`, `status/severity/confidence`, e
  `rows|items|evidence|details`).
- **Adicionar um bloco novo ao editor = 1 entrada nesse objeto**, não um componente de formulário
  novo — isso resolve o requisito de "fácil adicionar novos componentes".
- Categorias espelham os grupos já existentes: `Conteúdo`, `Estrutura`, `Comparação`, `Plano`,
  `Análise`, e os 16 grupos de `ADVANCED_GROUPS` (`advanced.jsx`) para a cauda longa.
- **Preservação de dados desconhecidos**: o editor nunca deve remover chaves de um bloco que não
  estão descritas no registry (spread do objeto original + merge apenas dos campos editados) —
  crítico porque no início nem todo tipo terá um formulário rico. Cada bloco também ganha um botão
  "Editar como JSON" (fallback per-block reaproveitando o padrão de `JsonEditor.jsx`) para o que
  ainda não tiver campos modelados.

## Estrutura de arquivos novos

```
src/lib/blockRegistry.js            # metadados por tipo (fields, categoria, defaultValue)
src/lib/registry.js                 # + createReport(), updateReport() [hoje só tem fetch/get]
src/components/editor/
  ReportEditorPage.jsx              # página, rota /admin/reports/:slug/edit (e .../new/edit)
  EditorLayout.jsx                  # shell 3 colunas: outline | canvas/preview | inspector
  OutlineTree.jsx                   # árvore seções > itens > blocos, add/remover/duplicar
  Inspector.jsx                     # formulário do nó selecionado, lido a partir do registry
  BlockPicker.jsx                   # modal de escolha de tipo, busca + categorias
  PreviewPane.jsx                   # reaproveita ReportView/ItemBlock para preview fiel
  fields/                           # TextField, TextareaField, ArrayObjectField, etc. (genéricos)
  reportEditorReducer.js            # estado + ações (updateField, addSection/Item/Block, move, remove)
```

## Fluxo / integração

- **Rota nova**: `/admin/reports/:slug/edit` (edição) e `/admin/reports/new/edit` (criação),
  ambas atrás de `RequirePermission module="reports.manage"` (mesmo guard de `/admin/reports`),
  registradas em `src/App.jsx`.
- **Entrada**: em `src/pages/admin/ReportsAdmin.jsx`, a ação "Editar" abre o novo editor visual
  em vez do modal `Dialog`+`JsonEditor` atual; mantemos o modal antigo como "Editar JSON"
  (import/export bruto), útil para colar relatórios prontos ou depurar.
- **Carregar dados**: `getReport(slug)` (já existe em `src/lib/registry.js`) traz `content`
  completo — vira o estado inicial do editor.
- **Salvar**: novas `createReport(payload)` / `updateReport(slug, payload)` em `registry.js`,
  usando os helpers `fetchJson`/`jsonBody` de `src/lib/api.js` já usados por `ReportsAdmin.jsx`,
  batendo em `POST /api/reports` / `PUT /api/reports/:slug` (endpoints já existem, sem mudança de
  backend).
- **Metadados do relatório** (não são "blocos"): `title`, `from`, `date`, `headline[]`, `intro[]`,
  `metrics[]`, `cover{}` — formulário próprio no topo/aba do editor, fora da árvore de
  seções/blocos.
- **Aparência** (`settings.colorIndex/fontIndex/chartStyleIndex/widthMode/fontScale`): reaproveitar
  diretamente as tabelas `COLORS/FONTS/CHART_STYLES/FONT_SCALES` e a lógica de `applyTheme` de
  `src/lib/theme.js` — mesmos swatches/preview que já existem em `SettingsPanel.jsx`, não recriar.

## Fases de implementação

**Fase 1 — Fundação + tipos essenciais**
- `blockRegistry.js` com os ~15–20 tipos mais comuns (`paragraph`, `bullets`, `table`, `chart`,
  `image`, `gallery`, `blockquote`/`quote`, `callout`, `todo`, `timeline`, `kpi-grid`, `progress`,
  `divider`, `code`).
- Componentes de campo genéricos (`fields/`) suficientes para esses tipos.
- Editor de metadados do relatório (título, intro, headline, métricas, cover, tema).
- `EditorLayout` com 3 colunas, sem drag-and-drop ainda (mover por botões ↑/↓ é suficiente nesta
  fase).
- Wiring de save/create completo e funcional ponta a ponta para esse subconjunto de tipos.

**Fase 2 — Árvore completa + reordenação**
- CRUD completo de seções/itens/blocos (adicionar, remover, duplicar).
- Drag-and-drop com `@dnd-kit/core` + `@dnd-kit/sortable` (nova dependência — nada de D&D existe
  hoje no projeto) nos três níveis: seções, itens dentro de seção, blocos dentro de item.
- `BlockPicker` com busca e categorias, cobrindo todo o catálogo "core" (structure/compare/plan/
  analytics, ~50 tipos).

**Fase 3 — Cauda longa (blocos "advanced")**
- Entradas de registry genéricas para as ~250 famílias de `advanced.jsx`, usando o padrão
  title/summary/status/entries que `AdvancedBlock` já lê — um template de campos cobre a maioria
  das famílias sem trabalho por tipo.
- Fallback "Editar como JSON" por bloco para o que sobrar sem modelo.

**Fase 4 (opcional/polish)**
- Preview ao vivo fiel usando `ReportView`/`ItemBlock` reais (não uma reconstrução aproximada).
- Undo/redo, rascunho em localStorage, validação antes de publicar.

## Por que essa ordem

Fase 1 já entrega o editor "totalmente visual" para o caminho mais usado (relatórios comuns) e
prova a arquitetura (registry + campos genéricos + save real) antes de escalar para os 250 tipos.
Fases 2–3 são expansão de cobertura sem mudar a arquitetura. Isso evita construir 250 formulários
à mão — o ganho de "fácil adicionar novo componente" vem exatamente de nunca precisarmos disso.

## Verificação

- `vercel dev` (necessário para `/api/*` responder — `npm run dev` sozinho não serve a API).
- Criar um relatório novo do zero pelo editor visual, adicionar 1 seção com 3-4 tipos de bloco
  diferentes da Fase 1, salvar, abrir `/report/:slug` e conferir que renderiza igual ao que
  seria escrito manualmente em JSON.
- Editar um relatório existente com tipos "advanced"/desconhecidos (ex.: usar
  `exemplo-completo.json` como base) e confirmar que os campos não modelados sobrevivem ao
  round-trip (abrir → salvar sem alterar → JSON idêntico, exceto o que foi intencionalmente
  editado).
- Testar reordenação (Fase 2) e conferir que a ordem persiste após salvar/recarregar.
