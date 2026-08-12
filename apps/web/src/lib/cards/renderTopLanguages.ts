/**
 * Top languages card renderer, adapted from anuraghazra/github-readme-stats
 * (MIT license) — src/cards/top-languages-card.js.
 */
import { Card } from "./Card";
import { clampValue, flexLayout, getCardColors, measureText, type ColorOverrides } from "./utils";

export interface LangData {
  name: string;
  color: string | null;
  size: number;
}

export type TopLangsLayout = "normal" | "compact" | "donut" | "donut-vertical" | "pie";

export interface TopLangsOptions extends ColorOverrides {
  hide?: string[];
  langs_count?: number;
  layout?: TopLangsLayout;
  hide_title?: boolean;
  hide_border?: boolean;
  hide_progress?: boolean;
  card_width?: number;
  border_radius?: number;
  custom_title?: string;
  disable_animations?: boolean;
}

const DEFAULT_CARD_WIDTH = 300;
const MIN_CARD_WIDTH = 280;
const DEFAULT_LANGS_COUNT = 5;
const DEFAULT_LANG_COLOR = "#858585";

function trimLangs(langs: LangData[], count: number, hide: string[]): LangData[] {
  const hidden = new Set(hide.map((h) => h.trim().toLowerCase()));
  return langs
    .filter((l) => !hidden.has(l.name.toLowerCase()))
    .sort((a, b) => b.size - a.size)
    .slice(0, clampValue(count, 1, 20));
}

function totalSize(langs: LangData[]): number {
  return langs.reduce((acc, l) => acc + l.size, 0) || 1;
}

/** Normal layout: one progress bar per language. */
function renderNormalLayout(langs: LangData[], width: number, hideProgress: boolean): string {
  const total = totalSize(langs);
  const items = langs.map((lang, index) => {
    const progress = ((lang.size / total) * 100).toFixed(2);
    const staggerDelay = (index + 3) * 150;
    const color = lang.color || DEFAULT_LANG_COLOR;
    const progressBarWidth = width - 95;
    return `
      <g class="stagger" style="animation-delay: ${staggerDelay}ms">
        <text data-testid="lang-name" x="2" y="15" class="lang-name">${lang.name} ${
          hideProgress ? "" : `${progress}%`
        }</text>
        ${
          hideProgress
            ? ""
            : `
        <svg width="${progressBarWidth}" x="0" y="25">
          <rect rx="5" ry="5" x="0" y="0" width="${progressBarWidth}" height="8" fill="#ddd"></rect>
          <svg data-testid="lang-progress" width="${progress}%">
            <rect height="8" fill="${color}" rx="5" ry="5" x="0" y="0" class="lang-progress" />
          </svg>
        </svg>`
        }
      </g>
    `;
  });
  return flexLayout({ items, gap: hideProgress ? 25 : 40, direction: "column" }).join("");
}

/** Compact layout: single multi-color bar + two-column legend. */
function renderCompactLayout(langs: LangData[], width: number, hideProgress: boolean): string {
  const total = totalSize(langs);
  const paddingRight = 50;
  const offsetWidth = width - paddingRight;

  let progressOffset = 0;
  const compactProgressBar = langs
    .map((lang) => {
      const percentage = parseFloat(((lang.size / total) * offsetWidth).toFixed(2));
      const progress = percentage < 10 ? percentage + 10 : percentage;
      const output = `
        <rect
          mask="url(#rect-mask)"
          data-testid="lang-progress"
          x="${progressOffset}"
          y="0"
          width="${progress}"
          height="8"
          fill="${lang.color || DEFAULT_LANG_COLOR}"
        />
      `;
      progressOffset += percentage;
      return output;
    })
    .join("");

  const legend = langs.map((lang, index) => {
    const percentage = ((lang.size / total) * 100).toFixed(2);
    const color = lang.color || DEFAULT_LANG_COLOR;
    const x = index % 2 === 0 ? 0 : 150;
    const y = Math.floor(index / 2) * 25;
    return `
      <g transform="translate(${x}, ${y})">
        <circle cx="5" cy="6" r="5" fill="${color}" />
        <text data-testid="lang-name" x="15" y="10" class="lang-name">
          ${lang.name} ${percentage}%
        </text>
      </g>
    `;
  });

  return `
    ${
      hideProgress
        ? ""
        : `
    <mask id="rect-mask">
      <rect x="0" y="0" width="${offsetWidth}" height="8" fill="white" rx="5"/>
    </mask>
    ${compactProgressBar}`
    }
    <g transform="translate(0, ${hideProgress ? 0 : 25})">
      ${legend.join("")}
    </g>
  `;
}

interface Slice {
  lang: LangData;
  percent: number;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function pieSlicePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function computeSlices(langs: LangData[]): Slice[] {
  const total = totalSize(langs);
  return langs.map((lang) => ({ lang, percent: (lang.size / total) * 100 }));
}

function renderLegend(slices: Slice[], x: number, y: number): string {
  return slices
    .map((slice, index) => {
      const color = slice.lang.color || DEFAULT_LANG_COLOR;
      return `
      <g transform="translate(${x}, ${y + index * 22})">
        <circle cx="5" cy="6" r="5" fill="${color}" />
        <text data-testid="lang-name" x="15" y="10" class="lang-name">
          ${slice.lang.name} ${slice.percent.toFixed(2)}%
        </text>
      </g>
    `;
    })
    .join("");
}

/** Donut layout: ring chart left, legend right (or below for vertical). */
function renderDonutLayout(langs: LangData[], vertical: boolean): string {
  const slices = computeSlices(langs);
  const cx = vertical ? 130 : 80;
  const cy = vertical ? 80 : 65;
  const radius = 50;

  let angle = 0;
  const arcs = slices
    .map((slice) => {
      const sweep = Math.max((slice.percent / 100) * 360 - 0.5, 0.1);
      const path = arcPath(cx, cy, radius, angle, angle + sweep);
      angle += (slice.percent / 100) * 360;
      return `<path d="${path}" stroke="${slice.lang.color || DEFAULT_LANG_COLOR}" fill="none" stroke-width="12" data-testid="lang-donut" />`;
    })
    .join("");

  const legendX = vertical ? 25 : 170;
  const legendY = vertical ? 160 : 10;
  return `
    ${arcs}
    ${renderLegend(slices, legendX, legendY)}
  `;
}

/** Pie layout: filled slices left, legend right. */
function renderPieLayout(langs: LangData[]): string {
  const slices = computeSlices(langs);
  const cx = 80;
  const cy = 65;
  const radius = 55;

  let angle = 0;
  const paths = slices
    .map((slice) => {
      const sweep = Math.max((slice.percent / 100) * 360 - 0.3, 0.1);
      const path = pieSlicePath(cx, cy, radius, angle, angle + sweep);
      angle += (slice.percent / 100) * 360;
      return `<path d="${path}" fill="${slice.lang.color || DEFAULT_LANG_COLOR}" data-testid="lang-pie" />`;
    })
    .join("");

  return `
    ${paths}
    ${renderLegend(slices, 170, 10)}
  `;
}

export function renderTopLanguagesCard(
  topLangs: LangData[],
  options: TopLangsOptions = {},
): string {
  const {
    hide = [],
    langs_count = DEFAULT_LANGS_COUNT,
    layout = "normal",
    hide_title = false,
    hide_border = false,
    hide_progress = false,
    card_width,
    border_radius,
    custom_title,
    disable_animations = false,
  } = options;

  const langs = trimLangs(topLangs, langs_count, hide);
  const colors = getCardColors(options);

  let width = card_width
    ? clampValue(card_width, MIN_CARD_WIDTH, Infinity)
    : DEFAULT_CARD_WIDTH;
  let height: number;
  let body: string;

  switch (layout) {
    case "compact":
      height = 90 + Math.round(langs.length / 2) * 25 + (hide_progress ? 0 : 25);
      body = renderCompactLayout(langs, width, hide_progress);
      break;
    case "donut":
      width = Math.max(width, 340);
      height = Math.max(165, 90 + langs.length * 22);
      body = renderDonutLayout(langs, false);
      break;
    case "donut-vertical":
      height = 200 + langs.length * 22;
      body = renderDonutLayout(langs, true);
      break;
    case "pie":
      width = Math.max(width, 340);
      height = Math.max(170, 90 + langs.length * 22);
      body = renderPieLayout(langs);
      break;
    default:
      height = 45 + (langs.length + 1) * 40;
      body = renderNormalLayout(langs, width, hide_progress);
  }

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: "Most Used Languages",
    width,
    height,
    borderRadius: border_radius ?? 4.5,
    colors,
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  if (disable_animations) card.disableAnimations();
  card.setCSS(`
    @keyframes slideInAnimation {
      from { width: 0; }
      to { width: calc(100%-100px); }
    }
    @keyframes growWidthAnimation {
      from { width: 0; }
      to { width: 100%; }
    }
    .lang-name {
      font: 400 11px "Segoe UI", Ubuntu, Sans-Serif;
      fill: ${colors.textColor};
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .lang-progress {
      animation: growWidthAnimation 0.6s ease-in-out forwards;
    }
  `);

  card.setAccessibilityLabel({
    title: card.title,
    desc: langs.map((l) => `${l.name} ${((l.size / totalSize(langs)) * 100).toFixed(1)}%`).join(", "),
  });

  return card.render(`
    <svg data-testid="lang-items" x="25">
      ${body}
    </svg>
  `);
}
