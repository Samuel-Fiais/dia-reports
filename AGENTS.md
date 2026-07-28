# Guia para agentes de IA: como criar um relatório

Este arquivo é para você, agente de IA, gerando JSON de relatórios para este projeto.
Leia isto antes de criar ou revisar qualquer conteúdo de relatório.

## Onde o relatório realmente vive

Publicações são linhas na tabela `reports` do Postgres (`slug`, `title`, `date`, `content`
jsonb), servidas por `api/reports.js`. Este repositório é apenas renderizador: não há
fluxo interno nem endpoint para gravar conteúdo.

- Para publicar de verdade, um processo externo autorizado precisa gravar/atualizar a linha em
  `reports` no Postgres.
- Se você não tem acesso a esse processo, **não finja que publicou** — entregue o JSON pronto e
  diga explicitamente que falta alguém com acesso persistir o conteúdo no banco.
- Visibilidade por leitor é controlada por grupos (`report_group_members`), não pelo JSON do
  relatório — se o pedido mencionar restringir quem vê o relatório, isso se resolve no processo
  administrativo que associa relatório↔grupo, não como um campo em `content`.

## O que você pode e não pode tocar

- **Pode**: montar o objeto `content` (o JSON do relatório) para publicação externa.
- **Não precisa tocar** (e normalmente não deve): nada em `src/components/`, `src/pages/`,
  `src/lib/` ou `src/styles/dia.css`. O visualizador já sabe renderizar qualquer relatório que
  siga o schema — você só escreve dados.
- Se o pedido do usuário exigir um tipo de bloco que não existe, componha a solução com os
  blocos genéricos disponíveis ou explicite a limitação. Nunca invente um `type`: blocos
  desconhecidos tornam a publicação inválida. O catálogo completo e
  autoritativo de tipos está em `src/lib/blockManifest.js`; [REPORT-SCHEMA.md](REPORT-SCHEMA.md)
  é a versão legível dele.

## Fluxo de trabalho

1. Escolha um `slug`/`id` em kebab-case, único, sem espaços (`analise-churn-q3`, não
   `Análise de Churn Q3`). Vira a URL (`/report/<slug>`); use o padrão
   `^[a-z0-9]+(-[a-z0-9]+)*$`.
2. Escreva o JSON seguindo o schema completo em [REPORT-SCHEMA.md](REPORT-SCHEMA.md) (leia
   esse arquivo — este aqui é só a camada de orientação, não repete a referência de cada
   bloco).
3. Entregue o JSON para publicação externa no Postgres. Não existe descoberta automática de
   arquivo — sem persistência no banco, o relatório não aparece em lugar nenhum.
4. Valide o JSON e o catálogo de blocos antes de finalizar — conteúdo inválido
   quebra a renderização do relatório inteiro.

## Tom e voz

Os relatórios são em **português do Brasil**, tom editorial e direto — como os exemplos
existentes. Evite genérico corporativo. Regras práticas:

- `headline`: chamada muito curta, 1-2 linhas de poucas palavras cada (array = uma linha por
  item), no máximo ~12 palavras no total. Não é uma frase longa.
- `intro`: 1 parágrafo que já entrega a conclusão principal, não um teaser
  ("Sim, vale — com uma ressalva." é melhor que "Neste relatório vamos analisar...").
- Use `**negrito**` na frase-conclusão de cada parágrafo/item importante — o leitor deve
  conseguir escanear só o negrito e entender o essencial.
- `badge` nos itens é curto (1-3 palavras): `"Resolvido · Nome"`, `"Em Risco"`,
  `"Ponto forte"`, `"Aberto"` — não frases completas.
- Seções numeradas com romanos (`"I. Nome da Seção"`) e itens numerados (`"1. Título"`)
  seguem o padrão dos exemplos; mantenha se o relatório tiver múltiplas seções longas.

## Escolhendo blocos

- Dado tabular com 2+ dimensões → `table`. Comparação entre valores → `value-comparison`;
  comparação em quadrantes → `quadrant-grid`.
- Série temporal ou comparação de categorias → `chart` (`line` para tendência, `bar` para
  comparação entre categorias, `doughnut`/`pie` para composição). Acúmulo com deltas
  (entradas/saídas de um total) → `chart` com `variant: "waterfall"`. Indicadores numéricos
  em grade → `metric-grid`; um único indicador → `gauge`.
- Conteúdo atribuído → `quote`; escolha uma apresentação genérica (`standard`, `featured`,
  `break`, `message` ou `correspondence`) sem criar tipos ligados à origem.
- Marcos com data → `timeline`; compromissos → `schedule-list`; planejamento espacial →
  `calendar` ou `board`; progresso → `progress` ou `progress-summary`.
- Contexto estruturado → `grouped-summary`, `record-card`, `step-list`, `metadata` ou
  `definition-list`. Os rótulos pertencem aos dados, nunca ao componente.
- Publicações longas → adicione `table-of-contents` no topo do `body` em vez de montar
  um sumário manual.
- Não invente dados. Se o usuário não forneceu números reais, não preencha `metrics`,
  `chart.datasets`, `table` ou qualquer bloco analítico com valores fictícios sem avisar que
  são ilustrativos. Prefira blocos de
  texto/estrutura (`paragraph`, `list`, `callout`, `grouped-summary`) quando não houver
  dado real suficiente.

## Configurações (`settings`) — são só o estado inicial

`colorIndex`, `fontIndex`, `chartStyleIndex`, `widthMode`, `fontScale` e `componentStyle` em `settings` definem
a aparência **na primeira visita**; quem estiver lendo pode mudar tudo isso pelo seletor ⚙
"Customize Report" (incluindo alternar para tema escuro, que é preferência do navegador de
quem lê, não algo que você define no JSON). Não é necessário caprichar nessa escolha —
`{ "colorIndex": 0, "fontIndex": 0, "chartStyleIndex": 2, "componentStyle": "editorial" }` é um bom default neutro se o
usuário não pedir uma aparência específica.

## Compartilhamento e visibilidade — não confunda os dois mecanismos

O botão "Share" cria um token e copia um link `/shared/<token>`. Isso é diferente da
visibilidade normal por grupos: quem vê `/report/<slug>` é decidido pelos grupos associados ao
relatório (`report_group_members`) e pela permissão do usuário logado, verificados pela API
antes de qualquer conteúdo ser servido. Se o usuário pedir para "restringir a um time" ou
"enviar só para fulano", isso se resolve associando o relatório ao grupo certo no processo
administrativo externo, não com um campo no JSON.

## Checklist antes de entregar

- [ ] `slug`/`id` em kebab-case válido; `title` e `date` (ISO 8601) preenchidos.
- [ ] `headline` e `intro` entregam a conclusão principal, não um teaser.
- [ ] Todo número em `metrics`, `chart` ou tabelas é real (ou explicitamente marcado como
      exemplo).
- [ ] Blocos usam apenas os `type` documentados em [REPORT-SCHEMA.md](REPORT-SCHEMA.md) /
      `src/lib/blockManifest.js`.
- [ ] `schemaVersion` é `2` e `renderMode` é `report`.
- [ ] JSON válido (sem vírgula sobrando, aspas fechadas).
- [ ] Deixou claro como o conteúdo será publicado externamente — nunca reporte como
      "publicado" sem confirmação de que a linha foi persistida no Postgres.
