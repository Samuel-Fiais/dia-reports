// Paleta de fundos do seletor "Customize Report" (Dia Browser)
export const COLORS = [
  "#fbfaf5", // 0 creme (padrão)
  "#fcf9e9", // 1 amarelo
  "#fcf0f2", // 2 rosa
  "#f2f5f9", // 3 azul-acinzentado
  "#f3f8f0", // 4 verde
  "#f6f1fa", // 5 lavanda
  "#faf3ed", // 6 pêssego
  "#f5f5f5", // 7 cinza
  "#f8f5ee", // 8 pedra quente
  "#f2f8f3", // 9 sálvia clara
  "#f0f8f7", // 10 água
  "#f1f6fb", // 11 azul gelo
  "#f9f1f7", // 12 malva
  "#faf3ee", // 13 argila clara
  "#f8f7ed", // 14 areia
  "#f2f7f6", // 15 névoa
  "#ffffff", // 16 preto e branco
];

// Amostras deliberadamente mais fortes que os fundos aplicados. Mantêm o
// seletor legível sem devolver essa saturação ao documento.
export const COLOR_SWATCHES = [
  "#e9e2bd",
  "#eadb87",
  "#e9aeb9",
  "#b9c7dc",
  "#b9dbaa",
  "#cbb4e7",
  "#e3b58f",
  "#c7c7c7",
  "#d8c49c",
  "#aed3b4",
  "#9fd7d2",
  "#a7c9e9",
  "#ddb0d5",
  "#e1b397",
  "#d8ce8f",
  "#b4cbc6",
  "#ffffff",
];

export const COLOR_SWATCHES_DARK = [
  "#514b35",
  "#5a4a22",
  "#57343d",
  "#34475f",
  "#36543a",
  "#493657",
  "#5a3d2d",
  "#454548",
  "#51432f",
  "#35513d",
  "#2e5050",
  "#304963",
  "#55364f",
  "#59402f",
  "#534d2d",
  "#354d49",
  "#1a1a1a",
];

// Equivalentes escuros da mesma paleta, usados quando o tema do app é "dark"
export const COLORS_DARK = [
  "#121210", // 0 creme -> preto quente
  "#14130f", // 1 amarelo -> preto âmbar
  "#141012", // 2 rosa -> preto rosado
  "#0f1114", // 3 azul-acinzentado -> preto ardósia
  "#0f130f", // 4 verde -> preto musgo
  "#121014", // 5 lavanda -> preto violeta
  "#14110f", // 6 pêssego -> preto terracota
  "#111112", // 7 cinza -> preto grafite
  "#13110f", // 8 pedra -> preto bronze
  "#0f130f", // 9 sálvia -> preto sálvia
  "#0e1313", // 10 água -> preto petróleo
  "#0e1115", // 11 azul gelo -> preto marinho
  "#141012", // 12 malva -> preto ameixa
  "#14110f", // 13 argila -> preto argila
  "#13120f", // 14 areia -> preto oliva
  "#101312", // 15 névoa -> preto esverdeado
  "#080808", // 16 preto e branco -> preto neutro
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

// Quatro temas tipográficos deliberadamente distintos.
// "Exposure" é a serifada exclusiva do Dia Browser; como o arquivo da fonte
// não é distribuído fora do app, usamos Fraunces (self-hosted via
// @fontsource/fraunces) como substituta mais próxima em traço e itálico.
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
    label: "Clássico",
    stack: 'Georgia, "Times New Roman", serif',
    bodyStack: 'Georgia, "Times New Roman", serif',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 },
  },
  {
    label: "Moderno",
    stack:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Inter", system-ui, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    style: "normal",
    weight: 800,
    weightSub: 700,
    sampleStyle: {
      fontFamily: '-apple-system, "Inter", system-ui, sans-serif',
      fontWeight: 800,
    },
    bodySampleStyle: { fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400 },
  },
  {
    label: "Técnico",
    stack: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    bodyStack: '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace',
    style: "normal",
    weight: 700,
    weightSub: 600,
    sampleStyle: {
      fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
      fontWeight: 700,
    },
    bodySampleStyle: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 400 },
  },
];

export function normalizeFontIndex(value) {
  const index = Number(value);
  if (Number.isInteger(index) && index >= 0 && index < FONTS.length) return index;
  return 0;
}

export function getFontTheme(value) {
  return FONTS[normalizeFontIndex(value)];
}

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

export const COMPONENT_STYLES = [
  { value: "editorial", label: "Editorial" },
  { value: "structured", label: "Estruturado" },
  { value: "minimal", label: "Minimalista" },
];

export function normalizeComponentStyle(value) {
  return COMPONENT_STYLES.some((option) => option.value === value) ? value : "editorial";
}

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
  const font = getFontTheme(fontIndex);
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
