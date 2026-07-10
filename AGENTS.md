# Guia para agentes de IA: como criar um relatório

Este arquivo é para você, agente de IA, gerando relatórios para este projeto.
Leia isto antes de criar ou editar qualquer `.json` em `src/reports/`.

## O que você pode e não pode tocar

- **Pode**: criar/editar arquivos `.json` em `src/reports/`.
- **Não precisa tocar** (e normalmente não deve): nada em `src/components/`,
  `src/pages/`, `src/lib/` ou `src/styles/dia.css`. O visualizador já sabe
  renderizar qualquer relatório que siga o schema — você só escreve dados.
- Se o pedido do usuário exigir um tipo de bloco que não existe (uma tabela
  dinâmica, um mapa, etc.), diga isso explicitamente em vez de inventar um
  `type` novo — blocos com `type` desconhecido são silenciosamente ignorados
  pelo visualizador.

## Fluxo de trabalho

1. Escolha um `id` em kebab-case, único, sem espaços (`analise-churn-q3`, não
   `Análise de Churn Q3`). Esse id vira a URL (`/report/<id>`) e o nome do
   arquivo (`src/reports/<id>.json`).
2. Escreva o JSON seguindo o schema completo em [REPORT-SCHEMA.md](REPORT-SCHEMA.md)
   (leia esse arquivo — este aqui é só a camada de orientação, não repete a
   referência de cada bloco).
3. Use `src/reports/exemplo-completo.json` como referência viva: ele contém
   pelo menos um exemplo de cada bloco existente, incluindo os interativos
   (to-do, upload, callout, progress, timeline, gallery, stat-comparison,
   divider).
4. Não precisa registrar o relatório em lugar nenhum — salvar o arquivo já é
   suficiente. Ele aparece automaticamente no dashboard (`/`), ordenado por
   `date` (mais recente primeiro).
5. Valide o JSON (chaves fechadas, vírgulas, aspas) antes de finalizar — um
   JSON inválido quebra a renderização do relatório inteiro.

## Tom e voz

Os relatórios são em **português do Brasil**, tom editorial e direto — como
os exemplos em `src/reports/`. Evite genérico corporativo. Regras práticas:

- `headline`: título curto, pode quebrar em 1-2 linhas (array = uma linha por item).
- `intro`: 1 parágrafo que já entrega a conclusão principal, não um teaser
  ("Sim, vale — com uma ressalva." é melhor que "Neste relatório vamos analisar...").
- Use `**negrito**` na frase-conclusão de cada parágrafo/item, do jeito que os
  exemplos fazem — o leitor deve conseguir escanear só o negrito e entender o essencial.
- `badge` nos itens é curto (1-3 palavras): `"Resolvido · Nome"`, `"Em Risco"`,
  `"Ponto forte"`, `"Aberto"` — não frases completas.
- Seções numeradas com romanos (`"I. Nome da Seção"`) e itens numerados
  (`"1. Título"`) seguem o padrão dos exemplos; mantenha se o relatório tiver
  múltiplas seções longas.

## Escolhendo blocos

- Dado tabular com 2+ dimensões → `table`.
- Série temporal ou comparação de categorias → `chart` (`line` para tendência,
  `bar` para comparação entre categorias, `doughnut`/`pie` para composição).
- Uma decisão tomada por alguém, com contexto → `paragraph` + `bullets`, e se
  houver uma mensagem real do Slack por trás, adicione um bloco `slack` citando-a.
- Trechos de artigo/entrevista/documento externo → `blockquote`.
- Uma frase de efeito no meio do relatório → `quote-break` (nível de seção, não
  dentro de um item).
- Marcos com data → `timeline`. Progresso percentual → `progress`. Mudança de
  um valor para outro → `stat-comparison`.
- Não invente dados. Se o usuário não forneceu números reais, não preencha
  `metrics` ou `chart.datasets` com valores fictícios sem avisar que são
  ilustrativos (como o próprio `exemplo-completo.json` faz na intro).

## Configurações (`settings`) — são só o estado inicial

`colorIndex`, `fontIndex` e `chartStyleIndex` em `settings` definem a
aparência **na primeira visita**; quem estiver lendo pode mudar tudo isso
pelo seletor ⚙ "Customize Report" (incluindo alternar para tema escuro, que
é uma preferência do navegador de quem lê, não algo que você define no JSON).
Não é necessário caprichar nessa escolha — `colorIndex: 0, fontIndex: 0,
chartStyleIndex: 2` é um bom default neutro se o usuário não pedir uma cor
específica.

## Compartilhamento — não é controle de acesso

Existe um botão "Share" que copia um link direto (`/report/<id>?shared=1`).
Isso é conveniência de navegação (esconde o link de volta ao dashboard), **não
é autenticação nem proteção de dados** — é um app estático sem backend, e
todo o conteúdo de todos os relatórios é compilado no mesmo pacote JS. Se o
usuário pedir um relatório para "enviar para um cliente" ou algo com dados
sensíveis, avise que este projeto não oferece confidencialidade real por link.

## Checklist antes de entregar

- [ ] `id`, `title`, `date` preenchidos; `date` em ISO 8601.
- [ ] `headline` e `intro` entregam a conclusão principal, não um teaser.
- [ ] Todo número em `metrics` ou `chart` é real (ou explicitamente marcado como exemplo).
- [ ] Blocos usam apenas os `type` documentados em [REPORT-SCHEMA.md](REPORT-SCHEMA.md).
- [ ] JSON válido (sem vírgula sobrando, aspas fechadas).
