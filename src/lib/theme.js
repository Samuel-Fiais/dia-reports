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
  "#050505", // 16 preto e branco -> cinza quase preto
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
