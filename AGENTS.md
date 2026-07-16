# Guia para agentes de IA: como criar um relatório

Este arquivo é para você, agente de IA, gerando relatórios para este projeto.
Leia isto antes de criar ou editar o conteúdo de qualquer relatório.

## Onde o relatório realmente vive

Relatórios são linhas na tabela `reports` do Postgres (`slug`, `title`, `date`, `content`
jsonb), servidas por `api/reports.js`, **não** arquivos `.json` em `src/reports/`. Os arquivos
dessa pasta (`exemplo-completo.json` etc.) são só material de referência — editá-los ou criar
um novo não tem nenhum efeito no app rodando. Editar ou criar um relatório de verdade exige
uma chamada autenticada à API (ou o editor visual/tela admin, se você estiver operando no
navegador em nome de alguém já logado):

- `POST /api/reports` com `{ slug, title, date?, content }` — cria.
- `PUT /api/reports/:slug` com `{ title, date?, content }` — atualiza.
- Ambos exigem sessão autenticada com a permissão `reports.manage`; sem isso a API responde
  403. Se você não tem como autenticar (execução non-interativa, sem cookie de sessão),
  **não finja que publicou** — entregue o JSON pronto e diga explicitamente que falta alguém
  com acesso salvar via `/admin/reports` (colar/importar o JSON) ou pelo editor visual em
  `/admin/reports/:slug/edit`.
- Visibilidade por leitor é controlada por grupos (`report_group_members`), não pelo JSON do
  relatório — se o pedido mencionar restringir quem vê o relatório, isso se resolve na tela
  admin (associação relatório↔grupo), não como um campo em `content`.

## O que você pode e não pode tocar

- **Pode**: montar o objeto `content` (o JSON do relatório) e, se tiver acesso autenticado,
  enviá-lo via API/admin.
- **Não precisa tocar** (e normalmente não deve): nada em `src/components/`, `src/pages/`,
  `src/lib/` ou `src/styles/dia.css`. O visualizador já sabe renderizar qualquer relatório que
  siga o schema — você só escreve dados.
- Se o pedido do usuário exigir um tipo de bloco que não existe (um mapa, uma tabela
  dinâmica, etc.), diga isso explicitamente em vez de inventar um `type` novo — blocos com
  `type` desconhecido são silenciosamente ignorados pelo visualizador. O catálogo completo e
  autoritativo de tipos está em `src/lib/blockRegistry.js`; [REPORT-SCHEMA.md](REPORT-SCHEMA.md)
  é a versão legível dele.

## Fluxo de trabalho

1. Escolha um `slug`/`id` em kebab-case, único, sem espaços (`analise-churn-q3`, não
   `Análise de Churn Q3`). Vira a URL (`/report/<slug>`) — a API rejeita slugs fora do padrão
   `^[a-z0-9]+(-[a-z0-9]+)*$` e um slug já existente (409).
2. Escreva o JSON seguindo o schema completo em [REPORT-SCHEMA.md](REPORT-SCHEMA.md) (leia
   esse arquivo — este aqui é só a camada de orientação, não repete a referência de cada
   bloco).
3. Use `src/reports/exemplo-completo.json` como referência viva: ele contém pelo menos um
   exemplo de cada bloco existente, com explicações inline em `description`.
4. Publique via API/admin conforme a seção anterior. Não existe descoberta automática de
   arquivo — sem essa chamada, o relatório não aparece em lugar nenhum.
5. Valide o JSON (chaves fechadas, vírgulas, aspas) antes de finalizar — um JSON inválido
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

- Dado tabular com 2+ dimensões → `table`. Comparação lado a lado de opções/critérios →
  `comparison-table` ou `option-cards`.
- Série temporal ou comparação de categorias → `chart` (`line` para tendência, `bar` para
  comparação entre categorias, `doughnut`/`pie` para composição). Acúmulo com deltas
  (entradas/saídas de um total) → `waterfall-chart`. Indicadores numéricos em grade →
  `kpi-grid`; um único indicador em destaque → `metric-detail` ou `gauge`.
- Uma decisão tomada por alguém, com contexto → `decision` (ou `paragraph` + `bullets`), e se
  houver uma mensagem real do Slack por trás, adicione um bloco `slack` citando-a.
- Trechos de artigo/entrevista/documento externo → `blockquote`. Trecho de e-mail → `email`.
- Uma frase de efeito no meio do relatório → `quote-break` (nível de seção/corpo, não dentro
  de um item).
- Marcos com data → `timeline`, `roadmap` ou `gantt` conforme o nível de detalhe. Progresso
  percentual → `progress`, `status-summary` ou `okr`. Mudança de um valor para outro →
  `stat-comparison`. Reunião → `meeting-notes`. Incidente → `incident-summary` +
  `root-cause`.
- Vários relatórios longos → adicione `table-of-contents` no topo do `body` em vez de montar
  um sumário manual.
- Não invente dados. Se o usuário não forneceu números reais, não preencha `metrics`,
  `chart.datasets`, `table` ou qualquer bloco analítico com valores fictícios sem avisar que
  são ilustrativos (como o próprio `exemplo-completo.json` faz na intro). Prefira blocos de
  texto/estrutura (`paragraph`, `bullets`, `callout`, `executive-summary`) quando não houver
  dado real suficiente.

## Configurações (`settings`) — são só o estado inicial

`colorIndex`, `fontIndex`, `chartStyleIndex`, `widthMode` e `fontScale` em `settings` definem
a aparência **na primeira visita**; quem estiver lendo pode mudar tudo isso pelo seletor ⚙
"Customize Report" (incluindo alternar para tema escuro, que é preferência do navegador de
quem lê, não algo que você define no JSON). Não é necessário caprichar nessa escolha —
`{ "colorIndex": 0, "fontIndex": 0, "chartStyleIndex": 2 }` é um bom default neutro se o
usuário não pedir uma aparência específica.

## Compartilhamento e visibilidade — não confunda os dois mecanismos

O botão "Share" copia um link direto (`/report/<slug>?shared=1`) — é conveniência de
navegação (esconde o link de volta ao dashboard), **não é o controle de acesso**. Quem
efetivamente pode ver um relatório é decidido pelos grupos associados a ele
(`report_group_members`) e pela permissão do usuário logado, verificados pela API antes de
qualquer conteúdo ser servido — sem sessão válida, a API responde 401/404 mesmo para o link
direto. Se o usuário pedir para "restringir a um time" ou "enviar só para fulano", isso se
resolve associando o relatório ao grupo certo na tela admin, não com um campo no JSON.

## Checklist antes de entregar

- [ ] `slug`/`id` em kebab-case válido; `title` e `date` (ISO 8601) preenchidos.
- [ ] `headline` e `intro` entregam a conclusão principal, não um teaser.
- [ ] Todo número em `metrics`, `chart` ou tabelas é real (ou explicitamente marcado como
      exemplo).
- [ ] Blocos usam apenas os `type` documentados em [REPORT-SCHEMA.md](REPORT-SCHEMA.md) /
      `src/lib/blockRegistry.js`.
- [ ] JSON válido (sem vírgula sobrando, aspas fechadas).
- [ ] Deixou claro como o conteúdo será publicado (API autenticada vs. entregar o JSON para
      alguém colar no admin) — nunca reportado como "publicado" sem confirmação de que a
      chamada foi de fato aceita (201/200, não 401/403).
