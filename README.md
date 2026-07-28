# Dia Reports

Renderizador de publicações estruturadas em React.

- **Home/dashboard** lista relatórios lidos da API (`GET /api/reports`), com conteúdo vindo da tabela Postgres `reports`.
- **Clicar em um relatório** abre `/report/<slug>` renderizado a partir do JSON salvo no banco.
- **Seletor ⚙ "Customize Report"** no canto inferior direito: paleta de fundos, estilos de gráfico, 4 temas tipográficos e 3 tratamentos de componentes (Editorial, Estruturado e Minimalista). A escolha é salva por relatório no `localStorage`.
- **Tema escuro**: ícone de sol/lua ao lado do ⚙, afeta o app inteiro (dashboard + relatórios); preferência salva no navegador.
- **Share**: botão no topo de cada relatório cria/copia um link `/shared/<token>` quando permitido; o acesso ao conteúdo continua passando pela API.
- Um contrato genérico sustenta o relatório atual e prepara layouts futuros sem fingir que
  dashboards ou documentos técnicos já existem. O catálogo contém somente componentes
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
