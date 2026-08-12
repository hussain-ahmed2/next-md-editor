/**
 * Repo pin card renderer, adapted from anuraghazra/github-readme-stats
 * (MIT license) — src/cards/repo-card.js.
 */
import { Card } from "./Card";
import { icons } from "./icons";
import {
  encodeHTML,
  flexLayout,
  getCardColors,
  kFormatter,
  measureText,
  wrapTextMultiline,
  type ColorOverrides,
} from "./utils";

export interface RepoData {
  name: string;
  nameWithOwner: string;
  description: string | null;
  language: { name: string; color: string | null } | null;
  starCount: number;
  forkCount: number;
  isArchived?: boolean;
  isTemplate?: boolean;
}

export interface RepoCardOptions extends ColorOverrides {
  show_owner?: boolean;
  hide_border?: boolean;
  border_radius?: number;
  description_lines_count?: number;
}

const ICON_SIZE = 16;
const DESCRIPTION_LINE_WIDTH = 59;
const DESCRIPTION_MAX_LINES = 3;

function iconWithLabel(icon: string, label: string, testid: string): string {
  const iconSvg = `
    <svg class="icon" y="-12" viewBox="0 0 16 16" version="1.1" width="${ICON_SIZE}" height="${ICON_SIZE}">
      ${icon}
    </svg>
  `;
  const text = `<text data-testid="${testid}" class="gray">${label}</text>`;
  return flexLayout({ items: [iconSvg, text], gap: 20 }).join("");
}

export function renderRepoCard(repo: RepoData, options: RepoCardOptions = {}): string {
  const {
    show_owner = false,
    hide_border = false,
    border_radius,
    description_lines_count,
  } = options;

  const header = show_owner ? repo.nameWithOwner : repo.name;
  const langName = repo.language?.name ?? "Unspecified";
  const langColor = repo.language?.color ?? "#333";

  const descriptionMaxLines = description_lines_count
    ? Math.max(1, Math.min(DESCRIPTION_MAX_LINES, description_lines_count))
    : DESCRIPTION_MAX_LINES;
  const desc = repo.description ?? "No description provided";
  const multiLineDescription = wrapTextMultiline(desc, DESCRIPTION_LINE_WIDTH, descriptionMaxLines);
  const descriptionLinesCount = description_lines_count
    ? Math.max(1, description_lines_count)
    : multiLineDescription.length;

  const descriptionSvg = multiLineDescription
    .map((line) => `<tspan dy="1.2em" x="25">${encodeHTML(line)}</tspan>`)
    .join("");

  const height = (descriptionLinesCount > 1 ? 120 : 110) + descriptionLinesCount * 10;

  const colors = getCardColors({ ...options, theme: options.theme });

  const svgLanguage = repo.language
    ? `
    <g data-testid="primary-lang">
      <circle data-testid="lang-color" cx="0" cy="-5" r="6" fill="${langColor}" />
      <text data-testid="lang-name" class="gray" x="15">${encodeHTML(langName)}</text>
    </g>
    `
    : "";

  const totalStars = kFormatter(repo.starCount);
  const totalForks = kFormatter(repo.forkCount);
  const svgStars = iconWithLabel(icons.star, totalStars, "stargazers");
  const svgForks = iconWithLabel(icons.fork, totalForks, "forkcount");

  const starAndForkCount = flexLayout({
    items: [svgLanguage, svgStars, svgForks],
    sizes: [
      measureText(langName, 12),
      ICON_SIZE + measureText(`${totalStars}`, 12),
      ICON_SIZE + measureText(`${totalForks}`, 12),
    ],
    gap: 25,
  }).join("");

  const badgeText = repo.isTemplate ? "Template" : repo.isArchived ? "Archived" : null;
  const badge = badgeText
    ? `
    <g data-testid="badge" transform="translate(320, -18)">
      <rect stroke="${colors.textColor}" stroke-width="1" width="70" height="20" x="-12" y="-14" ry="10" rx="10"></rect>
      <text
        x="23" y="-5"
        alignment-baseline="central"
        dominant-baseline="central"
        text-anchor="middle"
        fill="${colors.textColor}"
        font-size="11"
      >${badgeText}</text>
    </g>
    `
    : "";

  const card = new Card({
    defaultTitle: header.length > 35 ? `${header.slice(0, 35)}...` : header,
    titlePrefixIcon: icons.contribs,
    width: 400,
    height,
    borderRadius: border_radius ?? 4.5,
    colors,
  });
  card.setHideBorder(hide_border);
  card.disableAnimations();
  card.setCSS(`
    .description { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textColor} }
    .gray { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textColor} }
    .icon { fill: ${colors.iconColor} }
  `);
  card.setAccessibilityLabel({
    title: header,
    desc,
  });

  return card.render(`
    ${badge}
    <text class="description" x="25" y="-5">
      ${descriptionSvg}
    </text>
    <g transform="translate(30, ${height - 75})">
      ${starAndForkCount}
    </g>
  `);
}
