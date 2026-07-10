# Dia Reports

Dashboard de relatórios em React com o design system de relatórios do **Dia Browser**.

- **Home/dashboard** lista todos os relatórios da pasta comum `src/reports/` (descoberta automática — salvou o `.json`, apareceu no dashboard).
- **Clicar em um relatório** abre `/report/<id>` renderizado a partir do JSON.
- **Seletor ⚙ "Customize Report"** no canto inferior direito: 8 cores de fundo, 3 estilos de preenchimento de gráfico (sólido/hachurado/pontilhado) e 3 fontes de título (Exposure → Fraunces, Arial, SF Pro → Inter). A escolha é salva por relatório no `localStorage`.
- **Tema escuro**: ícone de sol/lua ao lado do ⚙, afeta o app inteiro (dashboard + relatórios); preferência salva no navegador.
- **Share**: botão no topo de cada relatório copia um link direto (`/report/<id>?shared=1`) que abre só aquela página. Não é controle de acesso real — é um app estático, sem backend/auth (o botão deixa isso explícito).
- O padrão do JSON (métricas, seções, itens, tabelas, gráficos, citações do Slack, blockquotes, código, imagens, to-do, upload de imagem, callouts, progresso, timeline, galeria, comparação antes/depois, divisor) está documentado em [REPORT-SCHEMA.md](REPORT-SCHEMA.md).
- Gerando relatórios com um agente de IA? Leia [AGENTS.md](AGENTS.md) primeiro.

## Rodando

```bash
npm install
npm run dev
```

## Adicionando um relatório

1. Crie `src/reports/meu-relatorio.json` seguindo o [REPORT-SCHEMA.md](REPORT-SCHEMA.md)
   (use `src/reports/exemplo-completo.json` como referência de todos os componentes).
2. Pronto — ele aparece no dashboard, ordenado por data (mais recente primeiro).

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
