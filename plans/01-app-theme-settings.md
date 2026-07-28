# Menu flutuante + configurações de tema do app

**Depende de:** `00-overview.md` (contexto de auth só para permissionar itens do menu
que outros planos adicionarem depois — a UI base deste plano funciona mesmo sem auth
pronta, pode ser feito em paralelo). **Não depende de** `02`/`03`/`04`/`05`.

## O que muda

Hoje o toggle claro/escuro (`ThemeToggleButton.jsx`) fica solto no canto superior
direito de `Home.jsx` e do `ReportPage.jsx`. Isso vira um item dentro de um **menu
flutuante** novo, e ganha um segundo controle: a cor de fundo do **app** (dashboard,
menu, e as próprias telas administrativas dos planos `02`–`05`), escolhida na mesma
paleta de 16 cores hoje usada só no "Customize Report" (`COLORS`/`COLORS_DARK` em
`src/lib/theme.js`).

**Importante:** isso é o tema do *chrome* do app, não do relatório. Um relatório
aberto continua respeitando seu próprio `settings.colorIndex` (salvo por relatório,
customizável no painel ⚙ de `SettingsPanel.jsx`) exatamente como hoje — nada muda em
`ReportPage.jsx`/`ReportView.jsx`/`SettingsPanel.jsx`.

## Estado e persistência

Estender `src/context/ThemeContext.jsx`:

```jsx
const APP_COLOR_KEY = 'dia-app-color-index'

function loadAppColorIndex() {
  try {
    const v = Number(localStorage.getItem(APP_COLOR_KEY))
    return Number.isInteger(v) && v >= 0 && v <= 15 ? v : 0
  } catch { return 0 }
}
```

`ThemeProvider` passa a expor também `{ appColorIndex, setAppColorIndex }` (mesmo
padrão de `appTheme`/`toggleAppTheme`: `useState` + `useEffect` que persiste no
`localStorage`). Não aplicar CSS vars direto no `ThemeProvider` — quem aplica é cada
tela via o hook abaixo, exatamente como `Home.jsx` já faz hoje (evita a tela de
relatório ser sobrescrita pelo provider a cada render).

## Novo hook: `src/lib/useAppChromeTheme.js`

```js
import { useEffect } from 'react'
import { applyTheme } from './theme.js'
import { useAppTheme } from '../context/ThemeContext.jsx'

// Toda tela que NÃO é um relatório (dashboard, admin, login) usa este hook no lugar
// de chamar applyTheme manualmente com colorIndex hardcoded.
export function useAppChromeTheme(title) {
  const { appTheme, appColorIndex } = useAppTheme()
  useEffect(() => {
    applyTheme({ colorIndex: appColorIndex, fontIndex: 0 }, appTheme)
    if (title) document.title = title
  }, [appTheme, appColorIndex, title])
}
```

Atualizar `Home.jsx`: trocar o `useEffect` atual que chama
`applyTheme({ colorIndex: 0, fontIndex: 0 }, appTheme)` por
`useAppChromeTheme('Relatórios')`. Os planos `02`–`05` usam o mesmo hook em suas
telas (`useAppChromeTheme('Grupos de relatórios')` etc.) — não duplicar a lógica.

## Menu flutuante — `src/components/AppMenu.jsx`

Um FAB (floating action button) fixo, canto inferior direito (`position: fixed;
bottom: 1.5rem; right: 1.5rem; z-index: 50`), mesmo círculo/sombra visual do
`.theme-toggle-btn`/`.settings-btn` já existentes (ver `dia.css`, procurar essas
classes — reusar `border-radius: 999px`, `box-shadow`, `border: 0.5px solid
var(--hairline)`, transições). Ao clicar, expande uma lista vertical de itens acima
do botão (mesmo padrão de `.report-share-menu` em `ShareButton.jsx`: `position:
absolute`, fecha em click-fora ou `Escape` — copiar esse hook de fechar, já existe
duas vezes no código, um terceiro lugar já justifica extrair para
`src/lib/useClickOutside.js`, ver "Reaproveitamento" abaixo).

Itens do menu são uma lista declarativa, para os outros planos só *adicionarem uma
entrada* sem tocar na lógica do componente:

```jsx
// src/components/AppMenu.jsx
const BASE_ITEMS = [
  { key: 'settings', label: 'Configurações', icon: Settings, action: 'modal:settings' },
]
```

Cada plano que adiciona uma tela nova (`02` grupos, `03` perfis, `04` usuários, `05`
editor) acrescenta um item ao array com `{ key, label, icon, to: '/admin/...',
permission: 'report_groups.manage' }` (campo `permission` opcional — se ausente, item
sempre visível pra qualquer logado; se presente, só mostra quando
`user.permissions[permission] === true`, lido via `useAuth()` de `04`). Como este
plano (`01`) é implementado antes de `04` existir, a checagem de permissão deve ser
escrita já agora, mas com um fallback seguro: se `useAuth` ainda não existir no
projeto, todo item aparece (comportamento atual, sem permissão nenhuma implementada
ainda) — quando `04` for mergeado, a checagem passa a valer de verdade sem precisar
tocar em `AppMenu.jsx` de novo.

Import de ícones: `Settings, User, Users, FolderKanban, FileEdit` (lucide-react, já é
dependência do projeto — ver migração de ícones já feita em toda a base).

Renderizar `<AppMenu />` uma vez, no nível do `App.jsx` (fora das `<Routes>`, dentro
do `ThemeProvider`), não em cada página — assim ele persiste entre navegações e não
precisa ser re-adicionado em cada tela nova. **Remover** o `<ThemeToggleButton />`
solto de `Home.jsx` e `ReportPage.jsx` — vira só um item dentro do menu (na página de
relatório, ele deve continuar existindo, mas dentro do MESMO `AppMenu` — não duplicar
o menu por página).

Atenção com `ReportPage.jsx`: hoje, quando `shared === true` (link compartilhado), a
`SettingsPanel` (⚙ de customização do relatório) fica escondida de propósito. O
`AppMenu` novo (que é sobre o app, não sobre o relatório) **também deve ficar
escondido quando `shared === true`** — um visitante de link compartilhado não deveria
ver menu de configurações/admin do app. Passar isso via contexto ou um simples
`data-shared` no body que `AppMenu` lê, ou (mais simples) um contexto
`ShareContext`/prop — decisão de implementação livre, mas o comportamento (esconder
em modo compartilhado) não é opcional.

## Modal de configurações — `src/components/SettingsModal.jsx`

Visual: modal genérico centralizado com backdrop, **não** reusar `ModalProvider` de
`Modal.jsx` (aquele é específico do conteúdo de relatório — usa `renderBlocks`,
`renderInline`, é acoplado ao body do relatório). Criar um modal simples e
independente, mas reaproveitando as mesmas classes CSS de `.dia-modal-backdrop`/
`.dia-modal`/`.dia-modal-close` (já estilizadas, dão consistência visual de graça) —
só não passar pelo `ModalContext` daquele arquivo.

Conteúdo do modal (única seção por enquanto, conforme pedido):

```
Configurações
─────────────
Tema
[toggle claro/escuro]   (reusa <ThemeToggleButton />, já existe)

Cor de fundo
[grade de 16 swatches — igual ao "Fundo" do SettingsPanel.jsx, mas:
 - lê/escreve appColorIndex (contexto), não settings.colorIndex de relatório
 - onClick: setAppColorIndex(i)]
```

Reaproveitar a marcação de `.settings-swatches`/`.swatch` de `SettingsPanel.jsx`
(mesmo componente visual, só trocando a fonte de dados — copiar o `.map(colors...)`
de lá, adaptado para `appColorIndex`/`setAppColorIndex` em vez de
`settings.colorIndex`/`onChange`).

## Reaproveitamento a extrair (fazer uma vez, usar nos 3 lugares)

`src/lib/useClickOutside.js` — o hook de "fechar ao clicar fora ou Escape" está
duplicado hoje em `ShareButton.jsx` e `SettingsPanel.jsx`. Com o `AppMenu` este código
apareceria pela terceira vez — extrair agora:

```js
export function useClickOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])
}
```

Atualizar `ShareButton.jsx` e `SettingsPanel.jsx` para usar esse hook em vez do
código duplicado (pequena limpeza, não é o foco do plano mas deixa o `AppMenu` mais
simples de escrever e remove duplicação real).

## CSS novo (`dia.css`)

Seguir exatamente os tokens já usados (`--ink`, `--ink-secondary`, `--ink-muted`,
`--hairline`, `--surface`, `--bg`, `--shadow-color`, `--font-body`) — não introduzir
cores novas fora da paleta. Classes sugeridas: `.app-menu`, `.app-menu-fab`,
`.app-menu-list`, `.app-menu-item`. Espelhar o border-radius/sombra/transições de
`.report-share-btn` e `.report-share-menu` (já existem, copiar o padrão, não
reinventar).

## Verificação

1. `npm run build` sem erros.
2. Rodar `npx vercel dev` **só se o usuário pedir** para testar manualmente: abrir o
   menu, trocar tema claro/escuro, trocar cor de fundo, confirmar que a cor persiste
   ao recarregar (localStorage) e que abrir um relatório mostra a cor *daquele
   relatório*, não a do app — e voltar ao dashboard mostra a cor do app de novo.
