# Padrão de Relatório (JSON)

Todo relatório é um objeto JSON guardado na coluna `content` (jsonb) da tabela `reports`
no Postgres — **não** um arquivo em `src/reports/`. Os arquivos dessa pasta
(`exemplo-completo.json` etc.) são só referência: o app em execução nunca os lê.

Para publicar um relatório, o JSON precisa ser enviado por uma das vias abaixo (ver
[AGENTS.md](AGENTS.md) para o fluxo completo):

- Editor visual em `/admin/reports/:slug/edit` (grid de blocos com inspector lateral).
- Colar/importar o JSON na tela `/admin/reports` (`JsonEditor`).
- Diretamente na API: `POST /api/reports` (criar) / `PUT /api/reports/:slug` (atualizar),
  autenticado e com a permissão `reports.manage`.

## Estrutura raiz

```json
{
  "id": "meu-relatorio",
  "title": "Título da aba do navegador",
  "from": "Rótulo do cabeçalho · #canal-ou-contexto",
  "date": "2026-07-10T18:19:55Z",
  "settings": { "colorIndex": 0, "fontIndex": 0, "chartStyleIndex": 2, "widthMode": "standard", "fontScale": "default" },
  "headline": ["Primeira linha do título", "Segunda linha"],
  "cover": { "src": "/imagens/capa.png", "alt": "", "eyebrow": "Dia", "caption": "Legenda da capa" },
  "intro": ["Parágrafo de abertura com **negrito**."],
  "metrics": [ ... ],
  "body": [ ... ]
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | não (na criação vira `slug`) | Slug da URL (`/report/<slug>`), kebab-case. Definido no ato de criar o relatório; não muda depois. |
| `title` | sim | Título do documento (aba do navegador) e da listagem admin. |
| `from` | não | Rótulo em caixa alta no topo esquerdo. Default: o próprio `title`. |
| `date` | sim | ISO 8601. Se omitido na criação/edição, usa o momento do salvamento. |
| `settings` | não | Aparência inicial (o leitor pode mudar no seletor ⚙ "Customize Report"; a escolha dele fica em `localStorage`, não altera o JSON salvo). |
| `headline` | sim | Título grande. Array = uma linha por item (quebra com `<br>`). Curto: 1-2 linhas de poucas palavras. |
| `cover` | não | Capa/hero integrada ao título. Sem `cover.src`, o hero renderiza em modo "plano" (só data). |
| `intro` | não | Array de parágrafos de abertura. |
| `metrics` | não | Faixa de métricas logo abaixo da intro. |
| `body` | sim | Sequência de seções e blocos de nível superior. |

### `settings`

- `colorIndex` (0–16): creme, amarelo, rosa, azul-acinzentado, verde, lavanda, pêssego, cinza,
  pedra quente, sálvia, água, azul gelo, malva, argila, areia, névoa, preto e branco.
- `fontIndex` (0–7): Editorial (serif itálica, ex-"Exposure"), Contemporâneo, Executivo, Clássico,
  Literário, Minimalista, Humanista, Técnico (monoespaçada).
- `chartStyleIndex` (0–2): preenchimento dos gráficos — sólido claro, hachurado, pontilhado.
- `widthMode` (`"standard"` | `"full"`): largura da coluna de leitura.
- `fontScale` (`"small"` | `"default"` | `"large"`): escala geral do corpo de texto.

Nenhum desses precisa de capricho — são só o estado **inicial**; o leitor pode trocar tudo
pelo seletor ⚙, inclusive tema claro/escuro (preferência do navegador, não um campo do JSON).

### `cover`

Capa/hero fundida ao título. Todos os campos são opcionais:

```json
{
  "src": "/imagens/capa.png",
  "alt": "Descrição da imagem",
  "eyebrow": "Rótulo pequeno acima do headline",
  "accent": "#f5d327",
  "textColor": "#fff",
  "caption": "Legenda abaixo da capa",
  "credit": "Crédito da imagem",
  "sideLeft": "Rótulo à esquerda (default: data curta)",
  "sideRight": "Rótulo à direita (default: 'Atualizado há X')"
}
```

Sem `src`, o hero cai no modo "plano" (sem imagem, só as datas). `accent`/`textColor` só têm
efeito quando há imagem.

### Marcação inline (em qualquer texto)

`**negrito**` · `*itálico*` · `` `código` `` · `` ``texto com `backtick` literal`` `` · `[texto](https://url)`

## `metrics`

```json
{ "value": "34%", "label": "Adoção", "note": "vs. meta de 25%", "span": 3 }
```

`span` é a largura na grade de 12 colunas (4 métricas → span 3; 3 métricas → span 4). Se
omitido, é calculado automaticamente. Uma métrica também aceita `details` (mesmo formato do
modal universal, ver final deste documento) para abrir um aprofundamento ao clicar.

## `body` — blocos de nível superior

### Seção

```json
{ "type": "section", "heading": "I. Nome da Seção", "items": [ ... ] }
```

### Quebra com citação em destaque

```json
{ "type": "quote-break", "text": "Frase de destaque.", "cite": "Atribuição opcional" }
```

### Quebra com imagem

```json
{ "type": "image-break", "src": "/imagens/foto.png", "alt": "", "caption": "Legenda opcional" }
```

### Sumário automático

```json
{ "type": "table-of-contents", "heading": "Sumário", "description": "Opcional" }
```

Lista automaticamente (com âncoras) todos os blocos `section` do próprio relatório — não
precisa listar os títulos manualmente.

### Relatórios relacionados

```json
{ "type": "related-reports", "heading": "Relatórios relacionados", "ids": ["outro-relatorio-slug"] }
```

### Quebra de página (impressão/PDF)

```json
{ "type": "page-break" }
```

Qualquer outro `type` de bloco também pode aparecer diretamente em `body` (fora de uma
seção): ganha automaticamente uma moldura full-width, com `heading`/`description` opcionais
no topo.

## Itens de uma seção

Cada item tem o rótulo à esquerda (título + badge) e o corpo à direita:

```json
{
  "title": "1. Título do item",
  "badge": "Resolvido · Igor",
  "description": "Texto curto sob o título (usado em itens de gráfico/imagem).",
  "columns": 1,
  "blocks": [ ... ]
}
```

Itens que contêm um bloco `chart` ou `image` mudam automaticamente para o layout com
gráfico/imagem à direita e legenda à esquerda. `showLabel: false` esconde a coluna de rótulo.
`columns` (1–6) transforma o corpo do item numa grade estilo Notion; cada bloco dentro de
`blocks` pode então usar `span` (número de colunas, ou `"full"` para ocupar a largura toda)
para controlar sua largura na grade.

## Modal universal de detalhes

Qualquer bloco (ou métrica, ou item de lista dentro de um bloco) pode receber `details`. O
elemento inteiro passa a abrir uma modal ao clicar:

```json
{
  "type": "paragraph",
  "text": "Clique para aprofundar.",
  "details": {
    "eyebrow": "Detalhes",
    "title": "Análise completa",
    "subtitle": "Complemento opcional ao título",
    "text": "Texto de contexto.",
    "fields": [{ "label": "Responsável", "value": "Igor" }],
    "size": "large",
    "blocks": [
      { "type": "chart", "variant": "bar", "labels": [], "datasets": [] },
      { "type": "paragraph", "text": "Conclusão." }
    ]
  }
}
```

`size`: `"small"` | `"medium"` | `"large"` | `"full"`. `blocks` aceita qualquer tipo de bloco
documentado abaixo, inclusive aninhando outra modal.

## Catálogo de blocos

Blocos de conteúdo vivem em `item.blocks`; a maioria também funciona direto em `body` (ver
acima). Tipos entre parênteses são **aliases** — mesmo componente, nome alternativo aceito
por compatibilidade (não use ao criar um bloco novo, mas continuam funcionando em relatórios
existentes).

### Texto e listas

```json
{ "type": "paragraph", "text": "**Conclusão em negrito.** Texto de apoio." }
{ "type": "bullets", "items": ["Primeiro ponto.", "Segundo ponto."] }
{ "type": "bullets", "style": "number", "items": ["Passo 1.", "Passo 2."] }
{ "type": "code", "code": "function exemplo() {\n  return 42;\n}" }
{
  "type": "mermaid",
  "code": "flowchart LR\n  A[Início] --> B[Fim]",
  "align": "center",
  "caption": "Legenda opcional"
}
```
`mermaid.align`: `"left"` | `"center"` | `"right"`; o código é renderizado como SVG.

### Tabelas e dados

```json
{
  "type": "table",
  "columns": ["Trimestre", "Receita", "Variação"],
  "rows": [["Q1", "R$ 58k", "+8%"], ["Q2", "R$ 64k", "+12%"]]
}
```
`columns` é `string[]` e `rows` é uma matriz na mesma ordem — nunca objetos. Colunas sem
nenhum valor real (preenchidas só com `-`, vazio, `n/a` etc.) são descartadas automaticamente
na renderização.

### Gráficos (Chart.js, estilo "tinta" monocromático)

```json
{
  "type": "chart",
  "variant": "line",
  "labels": ["Jan", "Fev", "Mar"],
  "datasets": [{ "label": "Adoção (%)", "data": [12, 18, 22], "fill": true }],
  "height": 250,
  "figure": "Fig. 1",
  "caption": "Legenda do gráfico."
}
```
`variant`: `"line"` | `"bar"` | `"doughnut"` | `"pie"`. `distribution` é alias de `chart`
(default `variant: "bar"`).

```json
{
  "type": "waterfall-chart",
  "items": [
    { "label": "Total inicial", "value": 568, "isTotal": true },
    { "label": "Resolvidos", "value": -520 },
    { "label": "Total pendente", "value": 48, "isTotal": true }
  ],
  "height": 240,
  "caption": "Legenda opcional"
}
```
Itens sem `isTotal` são variações assinadas (positivo soma, negativo reduz); itens com
`isTotal: true` são checkpoints (com `value` = total absoluto).

### Mídia

```json
{ "type": "image", "src": "/imagens/foto.png", "alt": "", "figure": "Fig. 2", "caption": "Legenda" }
{ "type": "gallery", "items": [{ "src": "/a.png", "caption": "Legenda A" }, { "src": "/b.png" }] }
{ "type": "before-after-image", "before": "/antes.png", "after": "/depois.png", "beforeLabel": "Antes", "afterLabel": "Depois", "caption": "Legenda" }
{ "type": "embed", "src": "https://...", "title": "Acessível", "ratio": "16 / 9", "caption": "Legenda" }
{ "type": "video", "src": "/video.mp4", "poster": "/capa.png", "caption": "Legenda" }
{ "type": "file-attachment", "href": "/relatorio.pdf", "name": "relatorio.pdf", "format": "PDF", "size": "1.2 MB", "download": true }
```

### Citações e conversas

```json
{ "type": "blockquote", "text": "Citação de documento ou artigo.", "cite": "Fonte" }
{ "type": "slack", "name": "Igor Moura", "channel": "#projeto-x", "time": "3 jul", "text": "Mensagem citada.", "avatar": "https://...", "href": "https://...slack.com/..." }
{ "type": "email", "fromAddr": "alguem@empresa.com", "to": "outro@empresa.com", "subject": "Assunto", "date": "3 jul", "text": "Corpo do e-mail." }
{ "type": "testimonial", "text": "Depoimento.", "author": "Nome", "role": "Cargo" }
{ "type": "conversation", "messages": [{ "author": "Nome", "time": "10:32", "text": "Mensagem." }] }
```
`quote` (alias de `blockquote`, variante editorial genérica).

### Interativos e estruturais

```json
{ "type": "todo", "items": [{ "text": "Primeira tarefa.", "done": true }, { "text": "Segunda tarefa.", "done": false }] }
{ "type": "accordion", "items": [{ "title": "Pergunta ou título", "text": "Resposta/conteúdo", "open": false }] }
{ "type": "tabs", "orientation": "vertical", "tabs": [{ "label": "Aba 1", "text": "Conteúdo", "items": ["opcional: lista"], "blocks": ["opcional: qualquer bloco"] }] }
{ "type": "definition", "term": "Termo", "text": "Definição destacada." }
{ "type": "glossary", "items": [{ "term": "Termo", "text": "Definição." }] }
{ "type": "drilldown", "label": "Ver detalhes", "details": { "title": "...", "text": "..." } }
```
`todo`: o estado marcado/desmarcado é salvo em `localStorage` (por navegador, não sincroniza
entre pessoas nem volta pro JSON). `faq`, `details`, `appendix` são aliases de `accordion`.

### Avisos e destaques

```json
{ "type": "callout", "kind": "note", "label": "Nota", "text": "Texto do aviso." }
{ "type": "progress", "label": "Sprint atual", "value": 72, "note": "72 de 100 pontos" }
{ "type": "stat-comparison", "before": { "label": "Antes", "value": "12%" }, "after": { "label": "Depois", "value": "34%" }, "note": "Nota opcional." }
{ "type": "divider", "label": "Rótulo opcional" }
```
`callout.kind`: `"note"` | `"warning"` | `"success"` (peso/estilo da borda, sem cores novas —
mantém a paleta monocromática).

### Linha do tempo e planejamento

```json
{ "type": "timeline", "items": [{ "date": "3 jul", "title": "Kickoff", "text": "Descrição do marco.", "status": "completed" }] }
{ "type": "roadmap", "lanes": [{ "label": "Agora", "items": [{ "title": "Iniciativa", "tag": "opcional" }] }] }
{ "type": "gantt", "startLabel": "Jan", "endLabel": "Dez", "tasks": [{ "title": "Fase 1", "start": "2026-01-05", "end": "2026-02-10", "status": "in-progress" }] }
{ "type": "countdown", "target": "2026-12-01T00:00:00Z", "units": ["days", "hours"], "label": "até", "eventLabel": "o lançamento" }
{ "type": "date-strip", "items": [{ "date": "3 jul", "label": "Kickoff", "active": true }] }
```
`timeline` também aceita o alias `milestones`. `roadmap` aceita o formato clássico
(`now`/`next`/`later`) em vez de `lanes`. `status` em `timeline`/`gantt`:
`not-started` | `in-progress` | `blocked` | `at-risk` | `completed` | `cancelled`.

### Agenda e calendários

```json
{ "type": "agenda", "items": [{ "time": "09:00", "title": "Daily", "text": "Descrição", "location": "Sala 2", "participants": ["A", "B"], "active": false }] }
{ "type": "calendar-month", "month": "2026-07", "variant": "detailed", "today": "2026-07-15", "maxPerDay": 2, "events": [{ "date": "2026-07-10", "time": "14:00", "title": "Evento", "text": "Descrição" }] }
{ "type": "calendar-week", "days": [{ "label": "Seg", "active": true, "items": [{ "time": "09:00", "title": "Evento" }] }] }
{ "type": "calendar-year", "year": 2026, "variant": "dots", "marks": [{ "date": "2026-07-10", "label": "Evento" }] }
```
`calendar-month.variant`: `"detailed"` | `"compact"`. `calendar-year.variant`: `"dots"` |
`"heatmap"` (com `values: { "2026-07-10": 4, ... }` e `max`). Todo item clicável (com
`details` ou campos extras) abre modal; `clickable: false` desativa.

### Analíticos

```json
{ "type": "kpi-grid", "columns": 3, "items": [{ "label": "Adoção", "value": "34%", "change": "+6pp", "trend": "up", "target": "40%", "spark": [10, 14, 18, 22], "note": "opcional" }] }
{ "type": "metric-detail", "metric": { "label": "Adoção", "value": "34%", "trend": "up", "spark": [10, 14, 18] } }
{ "type": "scorecard", "items": [{ "health": "healthy", "label": "Latência", "value": "120ms", "note": "opcional" }] }
{ "type": "funnel", "steps": [{ "label": "Visitas", "value": 1000 }, { "label": "Cadastro", "value": 420 }] }
{ "type": "gauge", "label": "Meta trimestral", "value": 68, "target": "100%" }
{ "type": "heatmap", "columns": ["Seg", "Ter"], "rows": [{ "label": "Time A", "values": [4, 8] }], "showValues": true, "max": 10 }
{ "type": "matrix", "xAxis": "Esforço", "yAxis": "Impacto", "quadrants": [{ "label": "Rápido & alto impacto", "items": ["Item 1"] }] }
{ "type": "ranking", "items": [{ "position": 1, "label": "Time A", "value": "98%", "trend": "up", "change": "+2pp" }] }
{ "type": "variance", "dimension": "Métrica", "rows": [{ "label": "Receita", "actual": "58k", "expected": "55k", "delta": "+3k" }] }
{ "type": "breakdown", "totalDisplay": "R$ 120k", "items": [{ "label": "Categoria A", "value": 70, "display": "R$ 70k" }] }
{ "type": "sparkline", "data": [10, 14, 18, 22], "width": 180, "height": 40 }
```
`heatmap` aceita alias `cohort`. `variance` aceita alias `benchmark`. `kpi-grid` usa a mesma
`Sparkline` embutida (SVG puro, sem Chart.js) que `kpi.spark`.

### Comparação e decisão

```json
{ "type": "comparison-table", "options": ["Opção A", "Opção B"], "highlightColumn": 1, "rows": [{ "label": "Custo", "values": ["Alto", "Baixo"] }] }
{ "type": "pros-cons", "pros": ["Vantagem"], "cons": ["Desvantagem"] }
{ "type": "option-cards", "options": [{ "title": "Opção A", "subtitle": "opcional", "recommended": true, "attributes": [{ "label": "Custo", "value": "Alto" }], "note": "opcional" }] }
{ "type": "swot", "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] }
{ "type": "dependencies", "items": [{ "from": "Time A", "on": "Time B", "note": "opcional" }] }
```
`tradeoffs` é alias de `pros-cons` (aceita `columns: [{ label, items, tone }]` para mais de
duas colunas). `scenario-comparison` é alias de `option-cards`.

### Estrutura e governança

```json
{ "type": "executive-summary", "context": ["..."], "findings": ["..."], "risks": ["..."], "recommendations": ["..."] }
{ "type": "key-takeaways", "items": ["Aprendizado 1", "Aprendizado 2"] }
{ "type": "decision", "title": "Decisão tomada", "rationale": "Por quê", "date": "3 jul", "owner": "Igor", "participants": ["A", "B"], "confidence": 80 }
{ "type": "action-items", "items": [{ "title": "Ação", "owner": "Igor", "due": "10 jul", "priority": "high", "status": "in-progress" }] }
{ "type": "recommendations", "items": [{ "title": "Recomendação", "impact": "Alto", "owner": "Igor", "due": "10 jul", "priority": "medium", "status": "not-started" }] }
{ "type": "blockers", "items": [{ "title": "Bloqueio", "impact": "Alto", "owner": "Igor", "due": "10 jul", "priority": "critical", "status": "blocked" }] }
{ "type": "risk-register", "items": [{ "title": "Risco", "mitigation": "Plano", "owner": "Igor", "due": "10 jul", "priority": "high", "status": "at-risk" }] }
{ "type": "references", "items": [{ "title": "Fonte", "href": "https://...", "source": "Autor", "note": "opcional" }] }
{ "type": "report-metadata", "author": "Igor", "version": "1.0", "status": "Final", "updated": "10 jul 2026", "period": "Q2 2026", "extra": [{ "label": "Campo extra", "value": "Valor" }] }
```
`assumptions` é alias de `key-takeaways`. `action-items` / `recommendations` / `blockers` /
`risk-register` compartilham o mesmo componente de tabela, com colunas específicas por tipo.
`priority`: `low` | `medium` | `high` | `critical`. `status` usa o mesmo vocabulário de
`timeline` (ver acima).

### Planejamento de projeto

```json
{ "type": "status-summary", "label": "Progresso geral", "progress": 72, "blockers": ["..."], "next": ["..."] }
{ "type": "okr", "objective": "Objetivo do trimestre", "keyResults": [{ "title": "Resultado-chave", "progress": 60 }] }
{ "type": "project-health", "dimensions": [{ "label": "Escopo", "health": "healthy", "note": "opcional" }] }
{ "type": "release-notes", "releases": [{ "version": "1.2.0", "date": "10 jul", "changes": [{ "kind": "added", "text": "Nova funcionalidade" }] }] }
```
`project-health.health`: `healthy` | `attention` | `critical`. `release-notes.changes[].kind`:
`added` | `fixed` | `changed` | `removed`. `changelog` é alias de `release-notes`.

### Pessoas e comunicação

```json
{ "type": "team-list", "people": [{ "avatar": "https://...", "name": "Igor Moura", "role": "PM", "team": "Growth", "contact": "igor@empresa.com" }] }
{ "type": "meeting-notes", "title": "Reunião semanal", "date": "3 jul", "participants": ["A", "B"], "agenda": ["Ponto 1"], "decisions": ["Decisão 1"], "next": ["Próximo passo"] }
```
`person-card` é alias de `team-list` (aceita também `person` no singular).

### Operações (incidentes)

```json
{ "type": "incident-summary", "severity": "SEV-2", "title": "Nome do incidente", "date": "3 jul", "impact": "...", "duration": "45min", "cause": "...", "resolution": "...", "actions": ["Ação preventiva"] }
{ "type": "root-cause", "problem": "Descrição do problema", "whys": ["Por quê 1", "Por quê 2"], "rootCause": "Causa raiz identificada" }
```

### Kanban

```json
{
  "type": "kanban",
  "variant": "compact",
  "columns": [
    { "title": "A Fazer", "cards": [{ "title": "Cartão", "description": "opcional", "tag": "opcional", "priority": "high", "assignee": "Igor", "due": "10 jul" }] }
  ]
}
```

### Indicadores de estado (badges avulsos)

```json
{ "type": "status-badge", "status": "in-progress" }
{ "type": "priority-badge", "priority": "high" }
{ "type": "trend-indicator", "trend": "up", "value": "+6pp" }
{ "type": "health-indicator", "health": "attention", "label": "opcional" }
{ "type": "confidence", "level": 80, "label": "opcional" }
{ "type": "freshness", "date": "10 jul", "label": "opcional" }
```

## Recursos do visualizador (não fazem parte do JSON)

- **Tema escuro**: alternado pelo ícone de sol/lua no seletor ⚙, é uma preferência do
  navegador de quem visualiza — não é um campo do relatório.
- **Compartilhar**: o botão "Share" no topo copia o link direto do relatório
  (`/report/<slug>?shared=1`), que abre só aquela página, sem o link de volta ao dashboard.
  Isso é conveniência de navegação, **não controle de acesso** — visibilidade real é
  controlada por grupos (associação relatório↔grupo, ver [AGENTS.md](AGENTS.md)) e permissões
  de usuário no backend, checadas pela API antes de servir qualquer conteúdo.
