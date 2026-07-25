# Dia Reports

Dashboard de relatórios em React com o design system de relatórios do **Dia Browser**.

- **Home/dashboard** lista relatórios lidos da API (`GET /api/reports`), com conteúdo vindo da tabela Postgres `reports`.
- **Clicar em um relatório** abre `/report/<slug>` renderizado a partir do JSON salvo no banco.
- **Seletor ⚙ "Customize Report"** no canto inferior direito: 8 cores de fundo, 3 estilos de preenchimento de gráfico (sólido/hachurado/pontilhado) e 3 fontes de título (Exposure → Fraunces, Arial, SF Pro → Inter). A escolha é salva por relatório no `localStorage`.
- **Tema escuro**: ícone de sol/lua ao lado do ⚙, afeta o app inteiro (dashboard + relatórios); preferência salva no navegador.
- **Share**: botão no topo de cada relatório cria/copia um link `/shared/<token>` quando permitido; o acesso ao conteúdo continua passando pela API.
- O padrão do JSON (métricas, seções, itens, tabelas, gráficos, citações do Slack, blockquotes, código, imagens, to-do, upload de imagem, callouts, progresso, timeline, galeria, comparação antes/depois, divisor) está documentado em [REPORT-SCHEMA.md](REPORT-SCHEMA.md).
- Gerando relatórios com um agente de IA? Leia [AGENTS.md](AGENTS.md) primeiro.

## Rodando

```bash
npm install
npm run dev
```

## Publicando um relatório

Este app não altera conteúdo de relatório. Para publicar ou atualizar conteúdo, grave uma linha
na tabela Postgres `reports` com `slug`, `title`, `date` e `content` (jsonb), por um processo
externo autorizado. Os arquivos em `src/reports/` são apenas exemplos de schema e não são
carregados em runtime.

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
