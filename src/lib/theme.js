// Paleta de fundos do seletor "Customize Report" (Dia Browser)
export const COLORS = [
  "#f7f5e9", // 0 creme (padrão)
  "#f5f0d7", // 1 amarelo
  "#f7dde2", // 2 rosa
  "#e3e8f1", // 3 azul-acinzentado
  "#e1f1d9", // 4 verde
  "#e7dcf5", // 5 lavanda
  "#f4e3d4", // 6 pêssego
  "#e5e5e5", // 7 cinza
  "#f2ebdb", // 8 pedra quente
  "#e2f1e4", // 9 sálvia clara
  "#ddf2f0", // 10 água
  "#ddeaf7", // 11 azul gelo
  "#f3e1f0", // 12 malva
  "#f6e6da", // 13 argila clara
  "#f1eed6", // 14 areia
  "#e3ecea", // 15 névoa
  "#f2f2f2", // 16 preto e branco -> cinza quase branco
];

// Equivalentes escuros da mesma paleta, usados quando o tema do app é "dark"
export const COLORS_DARK = [
  "#1c1b17", // 0 creme -> carvão neutro
  "#201c11", // 1 amarelo -> âmbar escuro
  "#211417", // 2 rosa -> vinho escuro
  "#12161d", // 3 azul-acinzentado -> ardósia
  "#121c14", // 4 verde -> verde-musgo escuro
  "#1a1520", // 5 lavanda -> roxo escuro
  "#211712", // 6 pêssego -> terracota escuro
  "#18181a", // 7 cinza -> grafite
  "#1d1a15", // 8 pedra -> bronze escuro
  "#131d16", // 9 sálvia -> floresta
  "#101d1c", // 10 água -> petróleo
  "#111923", // 11 azul gelo -> marinho
  "#20151d", // 12 malva -> ameixa
  "#211812", // 13 argila -> barro
  "#1e1c12", // 14 areia -> oliva escuro
  "#141b1a", // 15 névoa -> ardósia verde
  "#151515", // 16 preto e branco -> cinza quase preto
];

// Nomes compartilhados pelos pares claro/escuro exibidos no seletor.
export const COLOR_NAMES = [
  "Creme",
  "Amarelo suave",
  "Rosa",
  "Azul acinzentado",
  "Verde",
  "Lavanda",
  "Pêssego",
  "Cinza",
  "Pedra quente",
  "Sálvia",
  "Água",
  "Azul gelo",
  "Malva",
  "Argila",
  "Areia",
  "Névoa",
  "Preto e branco",
];

// Fontes do título (headline, section headings, blockquote break).
// "Exposure" é a serifada exclusiva do Dia Browser; como o arquivo da fonte
// não é distribuído fora do app, usamos Fraunces (self-hosted via
// @fontsource/fraunces) como substituta mais próxima em traço e itálico.
// SF Pro usa Inter (self-hosted) como fallback fiel fora do ecossistema Apple.
export const FONTS = [
  {
    label: "Editorial",
    stack: '"Fraunces", "Exposure", Georgia, "Times New Roman", serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    style: "italic",
    weight: 600,
    sampleStyle: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontStyle: "italic",
      fontWeight: 600,
    },
    bodySampleStyle: { fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400 },
  },
  {
    label: "Contemporâneo",
    stack: "Arial, Helvetica, sans-serif",
    bodyStack: 'Georgia, "Times New Roman", serif',
    style: "normal",
    weight: 600,
    weightSub: 500,
    sampleStyle: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: 600,
    },
    bodySampleStyle: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 },
  },
  {
    label: "Executivo",
    stack:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Inter", system-ui, sans-serif',
    bodyStack: 'Arial, Helvetica, sans-serif',
    style: "normal",
    weight: 800,
    weightSub: 700,
    sampleStyle: {
      fontFamily: '-apple-system, "Inter", system-ui, sans-serif',
      fontWeight: 800,
    },
    bodySampleStyle: { fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 400 },
  },
  {
    label: "Clássico",
    stack: 'Georgia, "Times New Roman", serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400 },
  },
  {
    label: "Literário",
    stack: '"Times New Roman", Times, serif',
    bodyStack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: '"Times New Roman", Times, serif',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 400 },
  },
  {
    label: "Minimalista",
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    bodyStack: 'Georgia, "Times New Roman", serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 },
  },
  {
    label: "Humanista",
    stack: 'Avenir, "Avenir Next", Montserrat, sans-serif',
    bodyStack: '"Times New Roman", Times, serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: 'Avenir, "Avenir Next", Montserrat, sans-serif',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: '"Times New Roman", Times, serif', fontWeight: 400 },
  },
  {
    label: "Técnico",
    stack: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400 },
  },
];

// Estilos de preenchimento dos gráficos (ChartBlock lê este índice)
export const CHART_STYLES = [
  { label: "Sólido" },
  { label: "Hachurado" },
  { label: "Pontilhado" },
];

export const FONT_SCALES = [
  { value: "small", label: "Pequena", size: "clamp(10.5px, 1.38vw, 16.5px)" },
  { value: "default", label: "Padrão", size: "clamp(12.03px, 1.5833vw, 19px)" },
  { value: "large", label: "Grande", size: "clamp(13.5px, 1.78vw, 21.5px)" },
];

const storageKey = (id) => `dia-report-settings:${id}`;

export function loadSettings(id, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveSettings(id, settings) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function applyTheme(
  { colorIndex = 0, fontIndex = 0, fontScale = "default" },
  appTheme = "light",
) {
  const root = document.documentElement;
  const palette = appTheme === "dark" ? COLORS_DARK : COLORS;
  const color = palette[colorIndex] ?? palette[0];
  const font = FONTS[fontIndex] ?? FONTS[0];
  const scale = FONT_SCALES.find((item) => item.value === fontScale) ?? FONT_SCALES[1];
  root.dataset.fontScale = scale.value;
  root.style.setProperty("--bg", color);
  root.style.setProperty("--report-font-size", scale.size);
  root.style.setProperty("--font-title", font.stack);
  root.style.setProperty("--font-body", font.bodyStack);
  root.style.setProperty("--title-style", font.style);
  root.style.setProperty("--title-weight", String(font.weight));
  root.style.setProperty("--title-weight-sub", String(font.weightSub ?? font.weight));
}

export function formatReportDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return fmt.format(date);
}

export function formatShortDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const RELATIVE_UNITS = [
  ["ano", 365 * 24 * 60 * 60],
  ["mês", 30 * 24 * 60 * 60],
  ["semana", 7 * 24 * 60 * 60],
  ["dia", 24 * 60 * 60],
  ["hora", 60 * 60],
  ["minuto", 60],
];

/* "Atualizado há X" — hora exata se for muito recente (<1min), senão a maior unidade que couber. */
export function formatUpdatedAgo(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return "Atualizado agora mesmo";

  for (const [label, seconds] of RELATIVE_UNITS) {
    const count = Math.floor(diffSeconds / seconds);
    if (count >= 1) {
      const plural = count > 1 ? (label === "mês" ? "meses" : `${label}s`) : label;
      return `Atualizado há ${count} ${plural}`;
    }
  }
  return "Atualizado agora mesmo";
}
