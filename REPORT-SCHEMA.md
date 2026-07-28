# Contrato de publicação

O conteúdo vive em `reports.content` no Postgres. O renderizador aceita um único contrato,
independentemente da ocasião de uso. Não existem aliases, componentes ligados a uma ferramenta
ou tipos que embutam linguagem de reunião, incidente, decisão ou qualquer outro caso particular.

`src/lib/blockManifest.js` é a fonte única dos nomes canônicos, campos editáveis, variantes,
posicionamentos, valores iniciais e renderizador de cada bloco.

## Estrutura raiz

```json
{
  "schemaVersion": 2,
  "renderMode": "report",
  "title": "Título interno",
  "from": "Origem opcional",
  "date": "2026-07-28",
  "headline": ["Conclusão principal"],
  "intro": ["Um parágrafo que entrega a síntese."],
  "metrics": [
    { "id": "receita", "label": "Receita", "value": "R$ 120 mil", "note": "+8%" }
  ],
  "body": [],
  "settings": {
    "colorIndex": 0,
    "fontIndex": 0,
    "chartStyleIndex": 2,
    "widthMode": "standard",
    "fontScale": "default",
    "componentStyle": "editorial"
  }
}
```

`renderMode` aceita atualmente apenas `report`. O campo é o ponto de extensão para layouts
futuros, sem fazer o modo atual fingir suporte a dashboard ou documento técnico.
`schemaVersion` deve ser `2`.

Todo bloco e todo item repetível pode receber `id`. IDs devem ser estáveis e únicos dentro do
seu contêiner, pois também identificam estado interativo local. Um bloco desconhecido invalida
a publicação.

## Catálogo canônico

### Conteúdo

- `paragraph`: `{ "text": "..." }`
- `list`: `{ "style": "unordered|ordered", "items": ["..."] }`
- `quote`: conteúdo atribuído. `presentation` aceita `standard`, `featured`, `break`,
  `message` ou `correspondence`; usa os campos genéricos `text`, `author`, `source`, `date`,
  `subject`, `recipient`, `avatar`, `href` e `labels`.
- `message-thread`: `{ "messages": [{ "id", "author", "date", "text" }] }`
- `callout`: `{ "tone": "neutral|info|warning|positive|negative", "label", "text" }`
- `definition-list`: `{ "items": [{ "id", "term", "text" }] }`
- `accordion`: `{ "items": [{ "id", "title", "text", "open" }] }`
- `tabs`: `{ "orientation": "horizontal|vertical", "tabs": [{ "id", "label", "text", "items" }] }`
- `code`: `{ "language", "title", "code", "highlightLines" }`

### Mídia

- `image`: `{ "presentation": "standard|break", "src", "alt", "caption", "credit" }`
- `gallery`: `{ "items": [{ "id", "src", "alt", "caption" }] }`
- `image-comparison`: `{ "items": [{ "id", "src", "alt", "label" }], "caption" }`
- `video`: `{ "src", "poster", "caption" }`
- `embed`: `{ "src", "title", "ratio", "caption" }`
- `attachment`: `{ "href", "name", "format", "size", "download" }`
- `diagram`: `{ "engine": "mermaid", "code", "align", "caption" }`

### Dados

- `table`: `{ "columns": ["..."], "rows": [["..."]] }`
- `chart`: `variant` aceita `line`, `bar`, `doughnut`, `pie`, `waterfall` ou `sparkline`.
  Gráficos comuns usam `labels` e `datasets`; waterfall usa `items`.
- `metric-grid`: `{ "columns", "items": [{ "id", "label", "value", "change", "reference", "note", "spark" }] }`
- `scorecard`: `{ "items": [{ "id", "state", "tone", "label", "value", "note" }] }`
- `progress`: `{ "label", "value", "note" }`
- `gauge`: `{ "label", "value", "display", "reference", "labels" }`
- `funnel`: `{ "steps": [{ "id", "label", "value", "display" }] }`
- `breakdown`: `{ "total", "totalDisplay", "items": [{ "id", "label", "value", "text" }] }`
- `heatmap`: `{ "columns", "rows": [{ "id", "label", "values" }], "max", "showValues" }`
- `quadrant-grid`: `{ "xAxis", "yAxis", "quadrants": [{ "id", "label", "items" }] }`
- `ranking`: `{ "items": [{ "id", "position", "label", "value", "change" }] }`
- `value-comparison`: `variant` aceita `pair` ou `table`.

### Organização

- `section`: `{ "heading", "items": [{ "id", "title", "badge", "description", "blocks" }] }`
- `divider`: `{ "label" }`
- `page-break`: sem campos adicionais
- `table-of-contents`: `{ "heading", "description" }`
- `metadata`: `{ "entries": [{ "id", "label", "value" }] }`
- `references`: `{ "items": [{ "id", "title", "href", "source", "note" }] }`
- `related-content`: `{ "items": [{ "id", "title", "href", "meta", "newTab" }] }`
- `trigger`: `{ "label", "details": { "title", "blocks" } }`

### Planejamento

- `timeline`: `{ "presentation": "standard|compact", "items": [{ "id", "date", "state", "title", "text" }] }`
- `schedule-list`: `{ "items": [{ "id", "time", "title", "text", "fields" }] }`
- `calendar`: `{ "view": "month|week|year", "date", "items" }`
- `board`: `{ "columns": [{ "id", "title", "items" }] }`
- `checklist`: `{ "persist", "items": [{ "id", "text", "checked" }] }`
- `task-table`: `{ "columns": [{ "key", "label", "kind" }], "items" }`
- `relations`: `{ "relationLabel", "items": [{ "id", "from", "to", "note" }] }`
- `progress-summary`: `{ "label", "progress", "groups": [{ "id", "label", "items" }] }`
- `grouped-change-list`: `{ "groups": [{ "id", "label", "date", "items" }] }`

### Registros e indicadores

- `people-list`: `{ "people": [{ "id", "avatar", "name", "subtitle", "group", "meta" }] }`
- `grouped-summary`: `{ "groups": [{ "id", "label", "content", "items" }] }`
- `record-card`: `{ "badge", "title", "date", "text", "fields", "actionsLabel", "actions" }`
- `step-list`: `{ "introLabel", "intro", "steps", "conclusionLabel", "conclusion" }`
- `indicator`: `kind` aceita `status`, `priority`, `trend`, `health`, `confidence` ou
  `freshness`; os demais campos são `value`, `label` e `tone`.

## Composição em vez de tipos particulares

Casos de negócio são composições de blocos, não componentes:

- Uma decisão pode ser `record-card` + `quote` + `references`.
- Uma reunião pode ser `metadata` + `schedule-list` + `task-table`.
- Uma análise de falha pode ser `callout` + `step-list` + `grouped-summary`.
- Um resumo executivo pode ser `metric-grid` + `grouped-summary`.

Os títulos, rótulos e estados que tornam essas composições específicas pertencem ao conteúdo.
O renderizador continua reutilizável.

## Configurações visuais

- `colorIndex`: índice da paleta.
- `fontIndex`: `0` Editorial, `1` Clássico, `2` Moderno, `3` Técnico.
- `chartStyleIndex`: `0` Sólido, `1` Hachurado, `2` Pontilhado.
- `widthMode`: `standard` ou `full`.
- `fontScale`: `small`, `default` ou `large`.
- `componentStyle`: `editorial`, `structured` ou `minimal`.

Esses valores são apenas o estado inicial. Preferências do leitor podem substituí-los.
