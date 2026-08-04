# Dia Reports

Renderizador de publicações estruturadas em React.

- **Central de publicações** em `/`, com acesso separado a relatórios, documentos,
  dashboards e referências.
- **Listagens por tipo** em `/relatorios`, `/documentos`, `/dashboards` e `/referencias`.
- **Clicar em um relatório** abre `/report/<slug>` renderizado a partir do JSON salvo no banco.
- **Referências OpenAPI** usam `renderMode: "reference"` e podem receber o contrato embutido
  ou buscá-lo de uma URL HTTPS pública sempre que a publicação é aberta.
- **Exemplos OpenAPI** em `/referencias/viacep-api` (contrato embutido, inspirado no
  documento ViaCEP) e `/referencias/school360-api` (Swagger remoto do School360).
- **Catálogo vivo de componentes** em `/componentes`: documento virtual gerado diretamente
  por `blockManifest.js`, com um exemplo preenchido de cada componente. Não depende do banco.
- **Seletor ⚙ "Customize Report"** no canto inferior direito: paleta de fundos, estilos de gráfico, 4 temas tipográficos e 3 tratamentos de componentes (Editorial, Estruturado e Minimalista). A escolha é salva por relatório no `localStorage`.
- **Tema escuro**: ícone de sol/lua ao lado do ⚙, afeta o app inteiro (dashboard + relatórios); preferência salva no navegador.
- **Share**: botão no topo de cada relatório cria/copia um link `/shared/<token>` quando permitido; o acesso ao conteúdo continua passando pela API.
- Um contrato genérico sustenta relatórios e referências, enquanto a central prepara as
  categorias futuras de dashboards e documentos. O catálogo contém somente componentes
  genéricos e variantes visuais genéricas, documentados em
  [REPORT-SCHEMA.md](REPORT-SCHEMA.md).
- Gerando relatórios com um agente de IA? Leia [AGENTS.md](AGENTS.md) primeiro.

## Rodando

```bash
npm install
npm run dev
```

## Publicando um relatório

Este app não altera conteúdo de relatório. Para publicar ou atualizar conteúdo, grave uma linha
na tabela Postgres `reports` com `slug`, `title`, `date` e `content` (jsonb), por um processo
externo autorizado.

## Linha do tempo do The Foreword

A rota autenticada `/the-foreword` acompanha histórias que atravessam várias edições, com início, viradas importantes, atualizações e desfecho quando houver um fato que encerre o assunto.

1. Aplique `migrations/002_foreword_timelines.sql` no mesmo banco Neon do app.
2. Execute o seed histórico: `python3 scripts/seed_foreword_timelines.py`.
3. O cron do The Foreword grava diretamente nas tabelas `foreword_timelines` e `foreword_timeline_events`. Para cada edição, ele deve agrupar somente desdobramentos claros: cria `start` para um assunto novo, usa `dramatic` apenas para virada ou escalada, `resolution` apenas para encerramento factual e `update` para mudanças relevantes. A atualização da história e a inserção do marco precisam ser idempotentes. Não registre cada manchete.

## Fonte Exposure

A fonte serifada original do Dia ("Exposure") não é distribuída fora do app e não vem
neste repositório. Por padrão, o projeto usa **Fraunces** (self-hosted via
`@fontsource/fraunces`) como substituta — mesmo espírito editorial, itálico com
bastante personalidade. Se você tiver os arquivos oficiais (`Exposure-400.woff2`,
`Exposure-500.woff2`, `Exposure-550.woff2`, `Exposure-550-Italic.woff2`,
`Exposure-600.woff2`), coloque-os em `public/fonts/` — o `@font-face` já está
declarado em `src/styles/dia.css`, mas a fonte precisa ser referenciada
explicitamente em `src/lib/theme.js` (`FONTS[0].stack`) para ter prioridade sobre Fraunces.

## Stack

Vite · React 18 · React Router · Chart.js (gráficos monocromáticos estilo "tinta",
com preenchimento sólido, hachurado ou pontilhado via o seletor de estilo, com
cores que se adaptam ao tema claro/escuro) · Fraunces + Inter (`@fontsource`, self-hosted).
