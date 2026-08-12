/**
 * Query-string parsing/clamping for card endpoints — mirrors the option
 * names of anuraghazra/github-readme-stats so existing knowledge and docs
 * transfer directly.
 */
import { clampValue, parseArray, parseBoolean, type ColorOverrides } from "./utils";
import type { StatsCardOptions } from "./renderStatsCard";
import type { TopLangsLayout, TopLangsOptions } from "./renderTopLanguages";
import type { RepoCardOptions } from "./renderRepoCard";
import type { RankIconVariant } from "./icons";

export const CACHE_SECONDS_MIN = 300; // 5 min
export const CACHE_SECONDS_DEFAULT = 21600; // 6 h
export const CACHE_SECONDS_MAX = 86400; // 24 h

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function colorOverrides(params: URLSearchParams): ColorOverrides {
  return {
    theme: params.get("theme") ?? undefined,
    title_color: params.get("title_color") ?? undefined,
    icon_color: params.get("icon_color") ?? undefined,
    text_color: params.get("text_color") ?? undefined,
    bg_color: params.get("bg_color") ?? undefined,
    border_color: params.get("border_color") ?? undefined,
    ring_color: params.get("ring_color") ?? undefined,
  };
}

export function parseCacheSeconds(params: URLSearchParams): number {
  const requested = num(params.get("cache_seconds"));
  return clampValue(requested ?? CACHE_SECONDS_DEFAULT, CACHE_SECONDS_MIN, CACHE_SECONDS_MAX);
}

export function parseStatsOptions(params: URLSearchParams): StatsCardOptions {
  const rankIconParam = params.get("rank_icon");
  return {
    ...colorOverrides(params),
    hide: parseArray(params.get("hide")),
    show_icons: parseBoolean(params.get("show_icons")) ?? false,
    hide_title: parseBoolean(params.get("hide_title")) ?? false,
    hide_border: parseBoolean(params.get("hide_border")) ?? false,
    hide_rank: parseBoolean(params.get("hide_rank")) ?? false,
    include_all_commits: parseBoolean(params.get("include_all_commits")) ?? false,
    line_height: num(params.get("line_height")) ?? 25,
    custom_title: params.get("custom_title") ?? undefined,
    border_radius: num(params.get("border_radius")),
    number_format: params.get("number_format") === "long" ? "long" : "short",
    rank_icon: (["default", "github", "percentile"] as RankIconVariant[]).includes(
      rankIconParam as RankIconVariant,
    )
      ? (rankIconParam as RankIconVariant)
      : "default",
    card_width: num(params.get("card_width")),
    disable_animations: parseBoolean(params.get("disable_animations")) ?? false,
  };
}

const LAYOUTS: TopLangsLayout[] = ["normal", "compact", "donut", "donut-vertical", "pie"];

export function parseTopLangsOptions(params: URLSearchParams): TopLangsOptions {
  const layoutParam = params.get("layout");
  return {
    ...colorOverrides(params),
    hide: parseArray(params.get("hide")),
    langs_count: num(params.get("langs_count")) ?? 5,
    layout: LAYOUTS.includes(layoutParam as TopLangsLayout)
      ? (layoutParam as TopLangsLayout)
      : "normal",
    hide_title: parseBoolean(params.get("hide_title")) ?? false,
    hide_border: parseBoolean(params.get("hide_border")) ?? false,
    hide_progress: parseBoolean(params.get("hide_progress")) ?? false,
    card_width: num(params.get("card_width")),
    border_radius: num(params.get("border_radius")),
    custom_title: params.get("custom_title") ?? undefined,
    disable_animations: parseBoolean(params.get("disable_animations")) ?? false,
  };
}

export function parseRepoCardOptions(params: URLSearchParams): RepoCardOptions {
  return {
    ...colorOverrides(params),
    show_owner: parseBoolean(params.get("show_owner")) ?? false,
    hide_border: parseBoolean(params.get("hide_border")) ?? false,
    border_radius: num(params.get("border_radius")),
    description_lines_count: num(params.get("description_lines_count")),
  };
}

/** Standard SVG response headers with client + CDN caching. */
export function svgHeaders(cacheSeconds: number): HeadersInit {
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": `max-age=${Math.round(cacheSeconds / 2)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${CACHE_SECONDS_MAX}`,
  };
}

/** Error card so failures render visibly inside READMEs. */
export function renderErrorCard(message: string): string {
  const safe = message.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`).slice(0, 120);
  return `
    <svg width="495" height="100" viewBox="0 0 495 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #2f80ed }
        .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #252525 }
      </style>
      <rect x="0.5" y="0.5" width="494" height="99%" rx="4.5" fill="#fffefe" stroke="#e4e2e2"/>
      <text x="25" y="45" class="text">Something went wrong!</text>
      <text x="25" y="65" class="small">${safe}</text>
    </svg>
  `;
}
