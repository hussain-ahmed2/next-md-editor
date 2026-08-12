/**
 * Stats card renderer, adapted from anuraghazra/github-readme-stats
 * (MIT license) — src/cards/stats-card.js.
 */
import { Card } from "./Card";
import { icons, rankIcon, type RankIconVariant } from "./icons";
import { calculateRank } from "./rank";
import {
  clampValue,
  flexLayout,
  getCardColors,
  kFormatter,
  measureText,
  type ColorOverrides,
} from "./utils";

export interface StatsData {
  name: string;
  login: string;
  totalStars: number;
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  contributedTo: number;
  followers: number;
}

export interface StatsCardOptions extends ColorOverrides {
  hide?: string[];
  show_icons?: boolean;
  hide_title?: boolean;
  hide_border?: boolean;
  hide_rank?: boolean;
  include_all_commits?: boolean;
  line_height?: number;
  custom_title?: string;
  border_radius?: number;
  number_format?: "short" | "long";
  rank_icon?: RankIconVariant;
  card_width?: number;
  disable_animations?: boolean;
}

const CARD_MIN_WIDTH = 287;
const CARD_DEFAULT_WIDTH = 287;
const RANK_CARD_MIN_WIDTH = 420;
const RANK_CARD_DEFAULT_WIDTH = 450;

function createTextNode({
  icon,
  label,
  value,
  id,
  index,
  showIcons,
  shiftValuePos,
  bold,
  number_format,
}: {
  icon: string;
  label: string;
  value: number;
  id: string;
  index: number;
  showIcons: boolean;
  shiftValuePos: number;
  bold: boolean;
  number_format: "short" | "long";
}): string {
  const kValue = number_format === "long" ? String(value) : kFormatter(value);
  const staggerDelay = (index + 3) * 150;

  const labelOffset = showIcons ? `x="25"` : "";
  const iconSvg = showIcons
    ? `
    <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
      ${icon}
    </svg>
  `
    : "";
  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      ${iconSvg}
      <text class="stat ${bold ? "bold" : "not_bold"}" ${labelOffset} y="12.5">${label}:</text>
      <text
        class="stat ${bold ? "bold" : "not_bold"}"
        x="${(showIcons ? 140 : 120) + shiftValuePos}"
        y="12.5"
        data-testid="${id}"
      >${kValue}</text>
    </g>
  `;
}

export function renderStatsCard(stats: StatsData, options: StatsCardOptions = {}): string {
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    hide_rank = false,
    include_all_commits = false,
    line_height = 25,
    custom_title,
    border_radius,
    number_format = "short",
    rank_icon = "default",
    card_width,
    disable_animations = false,
  } = options;

  const lheight = clampValue(line_height, 15, 60);
  const colors = getCardColors(options);

  const rank = calculateRank({
    allCommits: include_all_commits,
    commits: stats.commits,
    prs: stats.prs,
    issues: stats.issues,
    reviews: stats.reviews,
    stars: stats.totalStars,
    followers: stats.followers,
  });

  const STATS: Record<
    string,
    { icon: string; label: string; value: number; id: string }
  > = {
    stars: { icon: icons.star, label: "Total Stars Earned", value: stats.totalStars, id: "stars" },
    commits: {
      icon: icons.commits,
      label: `Total Commits${include_all_commits ? "" : ` (${new Date().getFullYear()})`}`,
      value: stats.commits,
      id: "commits",
    },
    prs: { icon: icons.prs, label: "Total PRs", value: stats.prs, id: "prs" },
    issues: { icon: icons.issues, label: "Total Issues", value: stats.issues, id: "issues" },
    contribs: {
      icon: icons.contribs,
      label: "Contributed to (last year)",
      value: stats.contributedTo,
      id: "contribs",
    },
  };

  const longLocales = false;
  const isLongLocale = longLocales;

  const statItems = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key, index) =>
      createTextNode({
        ...STATS[key],
        index,
        showIcons: show_icons,
        shiftValuePos: 79.01 + (isLongLocale ? 50 : 0),
        bold: true,
        number_format,
      }),
    );

  if (statItems.length === 0 && hide_rank) {
    throw new Error("Could not render stats card — everything is hidden.");
  }

  // Card height scales with visible rows
  const height = Math.max(45 + (statItems.length + 1) * lheight, hide_rank ? 0 : 150);

  const cssStyles = `
    .stat {
      font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor};
    }
    @supports(-moz-appearance: auto) {
      .stat { font-size:12px; }
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .rank-text {
      font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textColor};
      animation: scaleInAnimation 0.3s ease-in-out forwards;
    }
    .rank-percentile-header {
      font-size: 14px;
    }
    .rank-percentile-text {
      font-size: 16px;
    }
    .not_bold { font-weight: 400 }
    .bold { font-weight: 700 }
    .icon {
      fill: ${colors.iconColor};
      display: block;
    }
    .rank-circle-rim {
      stroke: ${colors.ringColor};
      fill: none;
      stroke-width: 6;
      opacity: 0.2;
    }
    .rank-circle {
      stroke: ${colors.ringColor};
      stroke-dasharray: 250;
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      opacity: 0.8;
      transform-origin: -10px 8px;
      transform: rotate(-90deg);
      animation: rankAnimation 1s forwards ease-in-out;
    }
    text { fill: ${colors.textColor} }
    @keyframes rankAnimation {
      from { stroke-dashoffset: ${calculateCircleProgress(0)}; }
      to { stroke-dashoffset: ${calculateCircleProgress(100 - rank.percentile)}; }
    }
    @keyframes scaleInAnimation {
      from { transform: translate(-5px, 5px) scale(0); }
      to { transform: translate(-5px, 5px) scale(1); }
    }
  `;

  const calculateTextWidth = () =>
    measureText(custom_title ?? `${encodeURIComponent(stats.name)}'s GitHub Stats`, 18);

  const iconWidth = show_icons && statItems.length ? 16 + 1 : 0;
  const minCardWidth =
    (hide_rank
      ? clampValue(50 + calculateTextWidth() * 2, CARD_MIN_WIDTH, Infinity)
      : RANK_CARD_MIN_WIDTH + iconWidth) + iconWidth;
  const defaultCardWidth =
    (hide_rank ? CARD_DEFAULT_WIDTH : RANK_CARD_DEFAULT_WIDTH) + iconWidth;
  const width = card_width
    ? card_width < minCardWidth
      ? minCardWidth
      : card_width
    : defaultCardWidth;

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: `${stats.name}'${stats.name.slice(-1) === "s" ? "" : "s"} GitHub Stats`,
    width,
    height,
    borderRadius: border_radius ?? 4.5,
    colors,
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);
  if (disable_animations) card.disableAnimations();

  const calculateRankXTranslation = (): number => {
    const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
    if (width > RANK_CARD_DEFAULT_WIDTH) {
      const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
      return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
    }
    return minXTranslation + (width - minCardWidth) / 2;
  };

  const rankCircle = hide_rank
    ? ""
    : `<g data-testid="rank-circle"
          transform="translate(${calculateRankXTranslation()}, ${height / 2 - 50})">
        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
        <circle class="rank-circle" cx="-10" cy="8" r="40" />
        <g class="rank-text">
          ${rankIcon(rank_icon, rank.level, rank.percentile)}
        </g>
      </g>`;

  card.setAccessibilityLabel({
    title: `${card.title}, Rank: ${rank.level}`,
    desc: `Total Stars Earned: ${stats.totalStars}, Total Commits: ${stats.commits}, Total PRs: ${stats.prs}, Total Issues: ${stats.issues}, Contributed to: ${stats.contributedTo}`,
  });

  return card.render(`
    ${rankCircle}
    <svg x="0" y="0">
      ${flexLayout({
        items: statItems,
        gap: lheight,
        direction: "column",
      }).join("")}
    </svg>
  `);
}

/** Stroke offset for the rank ring at a given percentage. */
export function calculateCircleProgress(value: number): number {
  const radius = 40;
  const c = Math.PI * (radius * 2);
  const percentage = clampValue(value, 0, 100);
  return ((100 - percentage) / 100) * c;
}
