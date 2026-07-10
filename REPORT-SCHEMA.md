# Padrão de Relatório (JSON)

Todo relatório é um arquivo `.json` salvo na pasta comum **`src/reports/`**.
O dashboard descobre os arquivos automaticamente — basta salvar e ele aparece na home.

## Estrutura raiz

```json
{
  "id": "meu-relatorio",
  "title": "Título da aba do navegador",
  "from": "Rótulo do cabeçalho · #canal-ou-contexto",
  "date": "2026-07-10T18:19:55Z",
  "settings": { "colorIndex": 0, "fontIndex": 0, "chartStyleIndex": 2 },
  "headline": ["Primeira linha do título", "Segunda linha"],
  "intro": ["Parágrafo de abertura com **negrito**."],
  "metrics": [ ... ],
  "body": [ ... ]
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | não | Slug da URL (`/report/<id>`). Se omitido, usa o nome do arquivo. |
| `title` | sim | Título do documento (aba do navegador). |
| `from` | não | Rótulo em caixa alta no topo esquerdo. Default: "Relatório". |
| `date` | sim | ISO 8601. Renderizada por extenso no topo direito. |
| `settings` | não | Aparência inicial (o usuário pode mudar no seletor ⚙ e a escolha fica salva no navegador). |
| `headline` | sim | Título grande. Array = uma linha por item (quebra com `<br>`). |
| `intro` | não | Array de parágrafos de abertura. |
| `metrics` | não | Faixa de métricas logo abaixo da intro. |
| `body` | sim | Sequência de seções e quebras. |

### `settings`

- `colorIndex` (0–7): creme, amarelo, rosa, azul-acinzentado, verde, lavanda, pêssego, cinza.
- `fontIndex` (0–2): Exposure (serif itálica), Arial, SF Pro.
- `chartStyleIndex` (0–2): preenchimento dos gráficos — sólido claro, hachurado, pontilhado.

### Marcação inline (em qualquer texto)

`**negrito**` · `*itálico*` · `` `código` `` · `[texto](https://url)`

## `metrics`

```json
{ "value": "34%", "label": "Adoção", "note": "vs. meta de 25%", "span": 3 }
```

`span` é a largura na grade de 12 colunas (4 métricas → span 3; 3 métricas → span 4).
Se omitido, é calculado automaticamente.

## `body` — blocos de nível superior

### Seção

```json
{
  "type": "section",
  "heading": "I. Nome da Seção",
  "items": [ ... ]
}
```

### Quebra com citação em destaque

```json
{ "type": "quote-break", "text": "Frase de destaque.", "cite": "Atribuição opcional" }
```

### Quebra com imagem

```json
{ "type": "image-break", "src": "/imagens/foto.png", "alt": "", "caption": "Legenda opcional" }
```

## Itens de uma seção

Cada item tem o rótulo à esquerda (título + badge) e o corpo à direita:

```json
{
  "title": "1. Título do item",
  "badge": "Resolvido · Igor",
  "description": "Texto curto sob o título (usado em itens de gráfico).",
  "blocks": [ ... ]
}
```

Itens que contêm um bloco `chart` ou `image` mudam automaticamente para o
layout com gráfico/imagem à direita e legenda à esquerda.

## `blocks` — blocos do corpo de um item

### Parágrafo
```json
{ "type": "paragraph", "text": "**Conclusão em negrito.** Texto de apoio." }
```

### Lista (com ou sem numeração)
```json
{ "type": "bullets", "items": ["Primeiro ponto.", "Segundo ponto."] }
{ "type": "bullets", "style": "number", "items": ["Passo 1.", "Passo 2."] }
```

### Tabela de dados
```json
{
  "type": "table",
  "columns": ["Trimestre", "Receita", "Variação"],
  "rows": [["Q1", "R$ 58k", "+8%"], ["Q2", "R$ 64k", "+12%"]]
}
```

### Gráfico (Chart.js, estilo "tinta" monocromático)
```json
{
  "type": "chart",
  "variant": "line",            // "line" | "bar" | "doughnut" | "pie"
  "labels": ["Jan", "Fev", "Mar"],
  "datasets": [{ "label": "Adoção (%)", "data": [12, 18, 22] }],
  "height": 250,
  "figure": "Fig. 1",
  "caption": "Legenda do gráfico."
}
```

### Citação do Slack
```json
{
  "type": "slack",
  "name": "Igor Moura",
  "channel": "#projeto-x",
  "time": "3 jul",
  "text": "Mensagem citada.",
  "avatar": "https://.../avatar.png",   // opcional
  "href": "https://...slack.com/..."     // opcional: link da thread
}
```

### Blockquote editorial
```json
{ "type": "blockquote", "text": "Citação de documento ou artigo.", "cite": "Fonte" }
```

### Bloco de código
```json
{ "type": "code", "code": "function exemplo() {\n  return 42;\n}" }
```

### Imagem
```json
{ "type": "image", "src": "/imagens/foto.png", "alt": "", "figure": "Fig. 2", "caption": "Legenda" }
```

### To-do (checklist com estado)
```json
{
  "type": "todo",
  "items": [
    { "text": "Primeira tarefa.", "done": true },
    { "text": "Segunda tarefa.", "done": false }
  ]
}
```
O estado marcado/desmarcado é salvo em `localStorage` (por navegador, não é sincronizado
entre pessoas nem volta para o arquivo `.json`).

### Upload de imagem (anexo feito por quem visualiza)
```json
{
  "type": "image-upload",
  "label": "Clique para anexar um screenshot",
  "figure": "Fig. 4",
  "caption": "Legenda opcional"
}
```
Renderiza uma área de arraste/clique. A imagem enviada é convertida para
`data:` URL e salva em `localStorage` **apenas no navegador de quem enviou**
(limite ~1.5MB por imagem) — não é enviada a nenhum servidor nem persistida
no arquivo `.json`.

### Callout (aviso/nota)
```json
{ "type": "callout", "kind": "note", "label": "Nota", "text": "Texto do aviso." }
```
`kind`: `"note"` | `"warning"` | `"success"` (só muda o peso/estilo da borda — mantém a paleta monocromática do relatório, sem cores novas).

### Barra de progresso
```json
{ "type": "progress", "label": "Sprint atual", "value": 72, "note": "72 de 100 pontos" }
```

### Linha do tempo
```json
{
  "type": "timeline",
  "items": [
    { "date": "3 jul", "title": "Kickoff", "text": "Descrição do marco." }
  ]
}
```

### Galeria de imagens
```json
{
  "type": "gallery",
  "items": [
    { "src": "/imagens/a.png", "caption": "Legenda A" },
    { "src": "/imagens/b.png", "caption": "Legenda B" }
  ]
}
```

### Comparação antes/depois
```json
{
  "type": "stat-comparison",
  "before": { "label": "Antes", "value": "12%" },
  "after": { "label": "Depois", "value": "34%" },
  "note": "Nota opcional sob a comparação."
}
```

### Divisor
```json
{ "type": "divider", "label": "Rótulo opcional" }
```

## Recursos do visualizador (não fazem parte do JSON)

- **Tema escuro**: alternado pelo ícone de sol/lua no seletor ⚙, é uma preferência do
  navegador de quem visualiza — não é um campo do relatório.
- **Compartilhar**: o botão "Share" no topo copia o link direto do relatório
  (`/report/<id>?shared=1`), que abre só aquela página, sem o link de volta ao dashboard.
  Como é um app estático sem backend, **isso não é controle de acesso real** — não inclua
  dados sensíveis em relatórios que serão compartilhados por link.
