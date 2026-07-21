/**
 * Shared card rendering helpers, adapted from
 * anuraghazra/github-readme-stats (MIT license).
 */
import { themes, type CardTheme } from "./themes";

export function encodeHTML(str: string): string {
  return str
    .replace(/[ -香<>&](?!#)/gim, (i) => `&#${i.charCodeAt(0)};`)
    .replace(/\u0008/gim, '');
}

export function kFormatter(num: number): string {
  return Math.abs(num) > 999
    ? `${(Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1)}k`
    : String(num);
}

export function clampValue(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(value, max));
}

export function parseBoolean(value: string | null | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
}

export function parseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const HEX_COLOR = /^([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR.test(color);
}

/** A bg_color may be "deg,color1,color2,..." for gradients. */
export function isValidGradient(colors: string[]): boolean {
  return (
    colors.length > 2 && !Number.isNaN(parseFloat(colors[0])) && colors.slice(1).every(isValidHexColor)
  );
}

export type ResolvedBg = string | string[]; // solid "#hex" or [deg, c1, c2, ...]

export interface CardColors {
  titleColor: string;
  iconColor: string;
  textColor: string;
  bgColor: ResolvedBg;
  borderColor: string;
  ringColor: string;
}

function fallbackColor(color: string | undefined, fallback: string): string {
  if (color && isValidHexColor(color)) return `#${color}`;
  return fallback;
}

export interface ColorOverrides {
  title_color?: string;
  icon_color?: string;
  text_color?: string;
  bg_color?: string;
  border_color?: string;
  ring_color?: string;
  theme?: string;
}

/** Merge default theme <- named theme <- individual color overrides. */
export function getCardColors(overrides: ColorOverrides): CardColors {
  const defaultTheme = themes.default;
  const selectedTheme: CardTheme = themes[overrides.theme ?? ""] ?? defaultTheme;

  const titleColor = fallbackColor(
    overrides.title_color ?? selectedTheme.title_color,
    `#${defaultTheme.title_color}`,
  );
  const ringColor = fallbackColor(
    overrides.ring_color ?? selectedTheme.ring_color ?? overrides.title_color ?? selectedTheme.title_color,
    titleColor,
  );
  const iconColor = fallbackColor(
    overrides.icon_color ?? selectedTheme.icon_color,
    `#${defaultTheme.icon_color}`,
  );
  const textColor = fallbackColor(
    overrides.text_color ?? selectedTheme.text_color,
    `#${defaultTheme.text_color}`,
  );
  const borderColor = fallbackColor(
    overrides.border_color ?? selectedTheme.border_color,
    "#e4e2e2",
  );

  const rawBg = overrides.bg_color ?? selectedTheme.bg_color;
  const bgParts = parseArray(rawBg);
  const bgColor: ResolvedBg = isValidGradient(bgParts)
    ? bgParts
    : fallbackColor(rawBg, `#${defaultTheme.bg_color}`);

  return { titleColor, iconColor, textColor, bgColor, borderColor, ringColor };
}

/** Approximate rendered width of text at a given font size (px). */
export function measureText(str: string, fontSize = 10): number {
  // prettier-ignore
  const widths = [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0.2796875,0.2765625,0.3546875,0.5546875,0.5546875,0.8890625,0.665625,0.190625,
    0.3328125,0.3328125,0.3890625,0.5828125,0.2765625,0.3328125,0.2765625,0.3015625,
    0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,
    0.5546875,0.5546875,0.2765625,0.2765625,0.584375,0.5828125,0.584375,0.5546875,
    1.0140625,0.665625,0.665625,0.721875,0.721875,0.665625,0.609375,0.7765625,
    0.721875,0.2765625,0.5,0.665625,0.5546875,0.8328125,0.721875,0.7765625,
    0.665625,0.7765625,0.721875,0.665625,0.609375,0.721875,0.665625,0.94375,
    0.665625,0.665625,0.609375,0.2765625,0.3546875,0.2765625,0.4765625,0.5546875,
    0.3328125,0.5546875,0.5546875,0.5,0.5546875,0.5546875,0.2765625,0.5546875,
    0.5546875,0.221875,0.240625,0.5,0.221875,0.8328125,0.5546875,0.5546875,
    0.5546875,0.5546875,0.3328125,0.5,0.2765625,0.5546875,0.5,0.721875,
    0.5,0.5,0.5,0.3546875,0.259375,0.353125,0.5890625,
  ];
  const avg = 0.5279276315789471;
  return (
    str
      .split("")
      .map((c) => (c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg))
      .reduce((cur, acc) => acc + cur, 0) * fontSize
  );
}

/** Split long text into up to `maxLines` lines of ~`width` chars. */
export function wrapTextMultiline(text: string, width = 59, maxLines = 3): string[] {
  const fullWidthComma = "，";
  const encoded = encodeHTML(text);
  const isChinese = encoded.includes(fullWidthComma);

  let wrapped: string[] = [];
  const words = isChinese ? encoded.split(fullWidthComma) : encoded.split(" ");
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line}${isChinese ? fullWidthComma : " "}${word}` : word;
    if (candidate.length > width) {
      if (line) wrapped.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) wrapped.push(line);

  wrapped = wrapped.slice(0, maxLines);
  if (wrapped.length === maxLines && words.join(" ").length > wrapped.join(" ").length) {
    wrapped[maxLines - 1] += "...";
  }
  return wrapped.filter(Boolean);
}

/** Lay out sibling SVG fragments horizontally/vertically with gaps. */
export function flexLayout({
  items,
  gap,
  direction,
  sizes = [],
}: {
  items: string[];
  gap: number;
  direction?: "column" | "row";
  sizes?: number[];
}): string[] {
  let lastSize = 0;
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") transform = `translate(0, ${lastSize})`;
    lastSize += gap + size;
    return `<g transform="${transform}">${item}</g>`;
  });
}
