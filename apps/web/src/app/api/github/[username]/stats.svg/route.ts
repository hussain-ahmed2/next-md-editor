import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/browser";
import { computeStats, fetchContributions, type ComputedStats, type GitHubProfile, type GitHubRepo } from "@/lib/github-stats";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const VALID_VARIANTS = ["default", "compact", "minimal", "classic"] as const;
type Variant = (typeof VALID_VARIANTS)[number];
const VALID_THEMES = ["auto", "light", "dark"] as const;
type Theme = (typeof VALID_THEMES)[number];

async function fetchGitHub(url: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "next-md-editor",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6", JavaScript: "#F7DF1E", Python: "#3572A5",
  Java: "#B07219", "C++": "#F34B7D", C: "#555555", "C#": "#178600",
  Go: "#00ADD8", Rust: "#DEA584", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Flutter: "#02569B",
  HTML: "#E34F26", CSS: "#563D7C", Shell: "#89E051", Vue: "#41B883",
  Svelte: "#FF3E00", Scala: "#C22D40", Haskell: "#5E5086", Lua: "#000080",
  "Objective-C": "#438EFF", R: "#198CE7", Julia: "#A270BA", Elixir: "#6E4A7E",
};

// ═══════════════════════════════════════════════════
// Color palettes for inline rendering
// ═══════════════════════════════════════════════════

interface C { bg: string; card: string; border: string; barBg: string; text: string; secondary: string; muted: string; link: string }
const DARK: C = { bg: "#0d1117", card: "#161b22", border: "#30363d", barBg: "#21262d", text: "#f0f6fc", secondary: "#8b949e", muted: "#c9d1d9", link: "#58a6ff" };
const LIGHT: C = { bg: "#ffffff", card: "#f6f8fa", border: "#d0d7de", barBg: "#e8e8e8", text: "#1f2328", secondary: "#656d76", muted: "#1f2328", link: "#0969da" };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const FONT = `font-family="-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif"`;

// ═══════════════════════════════════════════════════
// AUTO mode: CSS variables with @media query
// ═══════════════════════════════════════════════════

function svgAutoPreamble(W: number): string[] {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="__H__" viewBox="0 0 ${W} __H__">`,
    `<defs><style>`,
    `  :root {`,
    `    --bg: #0d1117; --card-bg: #161b22; --border: #30363d; --bar-bg: #21262d;`,
    `    --text-primary: #f0f6fc; --text-secondary: #8b949e; --text-muted: #c9d1d9;`,
    `    --link: #58a6ff;`,
    `  }`,
    `  @media (prefers-color-scheme: light) {`,
    `    :root {`,
    `      --bg: #ffffff; --card-bg: #f6f8fa; --border: #d0d7de; --bar-bg: #e8e8e8;`,
    `      --text-primary: #1f2328; --text-secondary: #656d76; --text-muted: #1f2328;`,
    `      --link: #0969da;`,
    `    }`,
    `  }`,
    `  text { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif; }`,
    `  .n { font-size: 16px; font-weight: 700; fill: var(--text-primary); }`,
    `  .u { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`,
    `  .b { font-size: 11px; fill: var(--text-secondary); }`,
    `  .sv { font-size: 22px; font-weight: 700; fill: var(--text-primary); }`,
    `  .sl { font-size: 10px; font-weight: 500; fill: var(--text-secondary); }`,
    `  .sc { font-size: 10px; font-weight: 600; fill: var(--text-secondary); letter-spacing: 0.6px; }`,
    `  .ln { font-size: 11px; font-weight: 500; fill: var(--text-muted); }`,
    `  .lp { font-size: 11px; fill: var(--text-secondary); }`,
    `  .rn { font-size: 12px; font-weight: 600; fill: var(--link); }`,
    `  .rs { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`,
    `  .cb { fill: var(--card-bg); stroke: var(--border); }`,
    `  .bg { fill: var(--bg); }`,
    `  .dv { stroke: var(--border); }`,
    `  .av { fill: none; stroke: var(--border); }`,
    `  .bb { fill: var(--bar-bg); }`,
    `</style></defs>`,
  ];
}

function autoProfile(lines: string[], stats: ComputedStats, W: number, PAD: number, y: number): number {
  const sz = 48;
  lines.push(`<defs><clipPath id="a"><circle cx="${PAD + sz / 2}" cy="${y + sz / 2}" r="${sz / 2}"/></clipPath></defs>`);
  lines.push(`<image x="${PAD}" y="${y}" width="${sz}" height="${sz}" href="${esc(stats.avatarUrl)}" clip-path="url(#a)"/>`);
  lines.push(`<circle cx="${PAD + sz / 2}" cy="${y + sz / 2}" r="${sz / 2}" class="av" stroke-width="1.5"/>`);
  const nx = PAD + sz + 10;
  const dn = stats.name ?? stats.login;
  lines.push(`<text x="${nx}" y="${y + 18}" class="n">${esc(trunc(dn, 24))}</text>`);
  lines.push(`<text x="${nx}" y="${y + 32}" class="u">@${esc(trunc(stats.login, 24))}</text>`);
  if (stats.bio) {
    const mc = Math.floor((W - PAD - nx) / 5.5);
    wrapText(stats.bio, mc).slice(0, 2).forEach((l, i) => {
      lines.push(`<text x="${nx}" y="${y + 46 + i * 14}" class="b">${esc(trunc(l, mc))}</text>`);
    });
  }
  return y + 80;
}

function autoDivider(lines: string[], PAD: number, W: number, y: number): number {
  lines.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" class="dv" stroke-width="1"/>`);
  return y + 14;
}

function autoStatsCards(lines: string[], stats: ComputedStats, PAD: number, cw: number, y: number): number {
  const items = [
    { l: "REPOS", v: stats.totalRepos }, { l: "STARS", v: stats.totalStars },
    { l: "FORKS", v: stats.totalForks }, { l: "FOLLOWERS", v: stats.followers },
  ];
  const gap = 10, cardW = (cw - gap * 3) / 4, cardH = 56;
  items.forEach((it, i) => {
    const cx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${cx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" class="cb" stroke-width="1"/>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 28}" text-anchor="middle" class="sv">${fmt(it.v)}</text>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 44}" text-anchor="middle" class="sl">${it.l}</text>`);
  });
  return y + cardH + 14;
}

function autoLanguages(lines: string[], stats: ComputedStats, PAD: number, W: number, cw: number, y: number): number {
  if (stats.topLanguages.length === 0) return y;
  lines.push(`<text x="${PAD}" y="${y + 10}" class="sc">LANGUAGES</text>`);
  y += 18;
  const barH = 6, total = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
  let bx = PAD;
  lines.push(`<rect x="${PAD}" y="${y}" width="${cw}" height="${barH}" rx="3" ry="3" class="bb"/>`);
  stats.topLanguages.forEach((l) => {
    const w = Math.max((l.percentage / total) * cw, l.percentage > 0 ? 3 : 0);
    lines.push(`<rect x="${bx}" y="${y}" width="${w}" height="${barH}" rx="3" ry="3" fill="${LANG_COLORS[l.name] ?? "var(--text-secondary)"}"/>`);
    bx += w;
  });
  y += barH + 10;
  let lx = PAD, ly = y;
  const lineH = 18;
  stats.topLanguages.slice(0, 6).forEach((l, i) => {
    const c = LANG_COLORS[l.name] ?? "var(--text-secondary)";
    const nw = l.name.length * 7;
    const pt = `${l.percentage}%`;
    const pw = pt.length * 6.5;
    const lw = 6 + 7 + nw + 4 + pw + 10;
    if (i > 0 && lx + lw > W - PAD) { lx = PAD; ly += lineH; }
    if (i > 0) lx += 16;
    lines.push(`<circle cx="${lx + 3}" cy="${ly}" r="3" fill="${c}"/>`);
    lines.push(`<text x="${lx + 10}" y="${ly + 4}" class="ln">${esc(l.name)}</text>`);
    lines.push(`<text x="${lx + 10 + nw + 4}" y="${ly + 4}" class="lp">${esc(pt)}</text>`);
    lx += lw;
  });
  return ly + lineH;
}

function autoRepos(lines: string[], stats: ComputedStats, PAD: number, cw: number, y: number): number {
  if (stats.mostStarredRepos.length === 0) return y;
  lines.push(`<text x="${PAD}" y="${y + 10}" class="sc">MOST STARRED</text>`);
  y += 22;
  const rc = Math.min(stats.mostStarredRepos.length, 3), gap = 10;
  const cardW = (cw - gap * (rc - 1)) / rc, cardH = 36;
  stats.mostStarredRepos.slice(0, 3).forEach((r, i) => {
    const rx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${rx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" class="cb" stroke-width="1"/>`);
    lines.push(`<text x="${rx + 10}" y="${y + 22}" class="rn">${esc(trunc(r.name, 16))}</text>`);
    lines.push(`<text x="${rx + cardW - 10}" y="${y + 22}" text-anchor="end" class="rs">★ ${r.stars}</text>`);
  });
  return y + cardH;
}

function autoClassicStatRow(lines: string[], icon: string, label: string, value: string, y: number, x: number, vx: number): number {
  lines.push(`<text x="${x}" y="${y + 4}" font-size="13" fill="var(--text-secondary)" ${FONT}>${icon}</text>`);
  lines.push(`<text x="${x + 20}" y="${y + 4}" font-size="13" fill="var(--text-primary)" ${FONT}>${esc(label)}</text>`);
  lines.push(`<text x="${vx}" y="${y + 4}" text-anchor="end" font-size="13" font-weight="600" fill="var(--text-primary)" ${FONT}>${esc(value)}</text>`);
  return y + 28;
}

function generateAutoClassic(stats: ComputedStats): string {
  const W = 620, PAD = 20, cw = W - PAD * 2;
  const leftW = Math.floor(cw * 0.52), rightW = cw - leftW - 16;
  let y = PAD;
  const lines: string[] = [...svgAutoPreamble(W)];
  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" class="bg"/>`);
  const dn = stats.name ?? stats.login;
  lines.push(`<text x="${PAD}" y="${y + 14}" font-size="16" font-weight="700" fill="var(--link)" ${FONT}>${esc(trunc(dn, 26))}'s GitHub Statistics</text>`);
  y += 30;
  y = autoDivider(lines, PAD, W, y);
  y += 4;
  const leftX = PAD, rightX = PAD + leftW + 16, sy = y;
  let ly = sy;
  const cs = [
    { icon: "★", label: "Stars", value: fmt(stats.totalStars) },
    { icon: "⑂", label: "Forks", value: fmt(stats.totalForks) },
    { icon: "⊞", label: "All-time contributions", value: fmt(stats.contributions ?? 0) },
    { icon: "⟐", label: "Lines of code changed", value: "N/A" },
    { icon: "⊙", label: "Repositories with contributions", value: fmt(stats.reposContributedTo ?? 0) },
    { icon: "⊡", label: "Repos", value: fmt(stats.totalRepos) },
    { icon: "♡", label: "Followers", value: fmt(stats.followers) },
  ];
  for (const s of cs) ly = autoClassicStatRow(lines, s.icon, s.label, s.value, ly, leftX, leftX + leftW);
  let ry = sy;
  if (stats.topLanguages.length > 0) {
    lines.push(`<text x="${rightX}" y="${ry + 10}" font-size="13" font-weight="600" fill="var(--text-primary)" ${FONT}>Languages Used (By File Size)</text>`);
    ry += 22;
    const barH = 10, total = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
    let bx = rightX;
    lines.push(`<rect x="${rightX}" y="${ry}" width="${rightW}" height="${barH}" rx="5" ry="5" class="bb"/>`);
    stats.topLanguages.forEach((l) => {
      const w = Math.max((l.percentage / total) * rightW, l.percentage > 0 ? 3 : 0);
      lines.push(`<rect x="${bx}" y="${ry}" width="${w}" height="${barH}" rx="5" ry="5" fill="${LANG_COLORS[l.name] ?? "var(--text-secondary)"}"/>`);
      bx += w;
    });
    ry += barH + 14;
    const colW = rightW / 3, lineH = 20;
    stats.topLanguages.slice(0, 12).forEach((l, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const lx = rightX + col * colW, cy = ry + row * lineH + 4;
      lines.push(`<circle cx="${lx}" cy="${cy}" r="4" fill="${LANG_COLORS[l.name] ?? "var(--text-secondary)"}"/>`);
      lines.push(`<text x="${lx + 10}" y="${cy + 4}" font-size="11" fill="var(--text-muted)" ${FONT}>${esc(l.name)} ${l.percentage}%</text>`);
    });
    ry += Math.ceil(stats.topLanguages.slice(0, 12).length / 3) * lineH;
  }
  const fy = Math.max(ly, ry);
  lines.push(`</svg>`);
  return lines.join("\n").replace(/__H__/g, String(fy + PAD));
}

// ═══════════════════════════════════════════════════
// EXPLICIT mode: all colors inlined (no CSS vars)
// ═══════════════════════════════════════════════════

function svgExplicitPreamble(W: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="__H__" viewBox="0 0 ${W} __H__">`;
}

function exProfile(lines: string[], stats: ComputedStats, c: C, W: number, PAD: number, y: number): number {
  const sz = 48;
  lines.push(`<defs><clipPath id="a"><circle cx="${PAD + sz / 2}" cy="${y + sz / 2}" r="${sz / 2}"/></clipPath></defs>`);
  lines.push(`<image x="${PAD}" y="${y}" width="${sz}" height="${sz}" href="${esc(stats.avatarUrl)}" clip-path="url(#a)"/>`);
  lines.push(`<circle cx="${PAD + sz / 2}" cy="${y + sz / 2}" r="${sz / 2}" fill="none" stroke="${c.border}" stroke-width="1.5"/>`);
  const nx = PAD + sz + 10;
  const dn = stats.name ?? stats.login;
  lines.push(`<text x="${nx}" y="${y + 18}" font-size="16" font-weight="700" fill="${c.text}" ${FONT}>${esc(trunc(dn, 24))}</text>`);
  lines.push(`<text x="${nx}" y="${y + 32}" font-size="12" font-weight="500" fill="${c.secondary}" ${FONT}>@${esc(trunc(stats.login, 24))}</text>`);
  if (stats.bio) {
    const mc = Math.floor((W - PAD - nx) / 5.5);
    wrapText(stats.bio, mc).slice(0, 2).forEach((l, i) => {
      lines.push(`<text x="${nx}" y="${y + 46 + i * 14}" font-size="11" fill="${c.secondary}" ${FONT}>${esc(trunc(l, mc))}</text>`);
    });
  }
  return y + 80;
}

function exDivider(lines: string[], c: C, PAD: number, W: number, y: number): number {
  lines.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${c.border}" stroke-width="1"/>`);
  return y + 14;
}

function exStatsCards(lines: string[], stats: ComputedStats, c: C, PAD: number, cw: number, y: number): number {
  const items = [
    { l: "REPOS", v: stats.totalRepos }, { l: "STARS", v: stats.totalStars },
    { l: "FORKS", v: stats.totalForks }, { l: "FOLLOWERS", v: stats.followers },
  ];
  const gap = 10, cardW = (cw - gap * 3) / 4, cardH = 56;
  items.forEach((it, i) => {
    const cx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${cx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" fill="${c.card}" stroke="${c.border}" stroke-width="1"/>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 28}" text-anchor="middle" font-size="22" font-weight="700" fill="${c.text}" ${FONT}>${fmt(it.v)}</text>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 44}" text-anchor="middle" font-size="10" font-weight="500" fill="${c.secondary}" ${FONT}>${it.l}</text>`);
  });
  return y + cardH + 14;
}

function exLanguages(lines: string[], stats: ComputedStats, c: C, PAD: number, W: number, cw: number, y: number): number {
  if (stats.topLanguages.length === 0) return y;
  lines.push(`<text x="${PAD}" y="${y + 10}" font-size="10" font-weight="600" fill="${c.secondary}" letter-spacing="0.6" ${FONT}>LANGUAGES</text>`);
  y += 18;
  const barH = 6, total = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
  let bx = PAD;
  lines.push(`<rect x="${PAD}" y="${y}" width="${cw}" height="${barH}" rx="3" ry="3" fill="${c.barBg}"/>`);
  stats.topLanguages.forEach((l) => {
    const w = Math.max((l.percentage / total) * cw, l.percentage > 0 ? 3 : 0);
    lines.push(`<rect x="${bx}" y="${y}" width="${w}" height="${barH}" rx="3" ry="3" fill="${LANG_COLORS[l.name] ?? c.secondary}"/>`);
    bx += w;
  });
  y += barH + 10;
  let lx = PAD, ly = y;
  const lineH = 18;
  stats.topLanguages.slice(0, 6).forEach((l, i) => {
    const color = LANG_COLORS[l.name] ?? c.secondary;
    const nw = l.name.length * 7;
    const pt = `${l.percentage}%`;
    const pw = pt.length * 6.5;
    const lw = 6 + 7 + nw + 4 + pw + 10;
    if (i > 0 && lx + lw > W - PAD) { lx = PAD; ly += lineH; }
    if (i > 0) lx += 16;
    lines.push(`<circle cx="${lx + 3}" cy="${ly}" r="3" fill="${color}"/>`);
    lines.push(`<text x="${lx + 10}" y="${ly + 4}" font-size="11" font-weight="500" fill="${c.muted}" ${FONT}>${esc(l.name)}</text>`);
    lines.push(`<text x="${lx + 10 + nw + 4}" y="${ly + 4}" font-size="11" fill="${c.secondary}" ${FONT}>${esc(pt)}</text>`);
    lx += lw;
  });
  return ly + lineH;
}

function exRepos(lines: string[], stats: ComputedStats, c: C, PAD: number, cw: number, y: number): number {
  if (stats.mostStarredRepos.length === 0) return y;
  lines.push(`<text x="${PAD}" y="${y + 10}" font-size="10" font-weight="600" fill="${c.secondary}" letter-spacing="0.6" ${FONT}>MOST STARRED</text>`);
  y += 22;
  const rc = Math.min(stats.mostStarredRepos.length, 3), gap = 10;
  const cardW = (cw - gap * (rc - 1)) / rc, cardH = 36;
  stats.mostStarredRepos.slice(0, 3).forEach((r, i) => {
    const rx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${rx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" fill="${c.card}" stroke="${c.border}" stroke-width="1"/>`);
    lines.push(`<text x="${rx + 10}" y="${y + 22}" font-size="12" font-weight="600" fill="${c.link}" ${FONT}>${esc(trunc(r.name, 16))}</text>`);
    lines.push(`<text x="${rx + cardW - 10}" y="${y + 22}" text-anchor="end" font-size="12" font-weight="500" fill="${c.secondary}" ${FONT}>★ ${r.stars}</text>`);
  });
  return y + cardH;
}

function exClassicStatRow(lines: string[], icon: string, label: string, value: string, c: C, y: number, x: number, vx: number): number {
  lines.push(`<text x="${x}" y="${y + 4}" font-size="13" fill="${c.secondary}" ${FONT}>${icon}</text>`);
  lines.push(`<text x="${x + 20}" y="${y + 4}" font-size="13" fill="${c.text}" ${FONT}>${esc(label)}</text>`);
  lines.push(`<text x="${vx}" y="${y + 4}" text-anchor="end" font-size="13" font-weight="600" fill="${c.text}" ${FONT}>${esc(value)}</text>`);
  return y + 28;
}

function exClassic(stats: ComputedStats, c: C): string {
  const W = 620, PAD = 20, cw = W - PAD * 2;
  const leftW = Math.floor(cw * 0.52), rightW = cw - leftW - 16;
  let y = PAD;
  const lines: string[] = [svgExplicitPreamble(W)];
  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);
  const dn = stats.name ?? stats.login;
  lines.push(`<text x="${PAD}" y="${y + 14}" font-size="16" font-weight="700" fill="${c.link}" ${FONT}>${esc(trunc(dn, 26))}'s GitHub Statistics</text>`);
  y += 30;
  y = exDivider(lines, c, PAD, W, y);
  y += 4;
  const leftX = PAD, rightX = PAD + leftW + 16, sy = y;
  let ly = sy;
  const cs = [
    { icon: "★", label: "Stars", value: fmt(stats.totalStars) },
    { icon: "⑂", label: "Forks", value: fmt(stats.totalForks) },
    { icon: "⊞", label: "All-time contributions", value: fmt(stats.contributions ?? 0) },
    { icon: "⟐", label: "Lines of code changed", value: "N/A" },
    { icon: "⊙", label: "Repositories with contributions", value: fmt(stats.reposContributedTo ?? 0) },
    { icon: "⊡", label: "Repos", value: fmt(stats.totalRepos) },
    { icon: "♡", label: "Followers", value: fmt(stats.followers) },
  ];
  for (const s of cs) ly = exClassicStatRow(lines, s.icon, s.label, s.value, c, ly, leftX, leftX + leftW);
  let ry = sy;
  if (stats.topLanguages.length > 0) {
    lines.push(`<text x="${rightX}" y="${ry + 10}" font-size="13" font-weight="600" fill="${c.text}" ${FONT}>Languages Used (By File Size)</text>`);
    ry += 22;
    const barH = 10, total = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
    let bx = rightX;
    lines.push(`<rect x="${rightX}" y="${ry}" width="${rightW}" height="${barH}" rx="5" ry="5" fill="${c.barBg}"/>`);
    stats.topLanguages.forEach((l) => {
      const w = Math.max((l.percentage / total) * rightW, l.percentage > 0 ? 3 : 0);
      lines.push(`<rect x="${bx}" y="${ry}" width="${w}" height="${barH}" rx="5" ry="5" fill="${LANG_COLORS[l.name] ?? c.secondary}"/>`);
      bx += w;
    });
    ry += barH + 14;
    const colW = rightW / 3, lineH = 20;
    stats.topLanguages.slice(0, 12).forEach((l, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const lx = rightX + col * colW, cy = ry + row * lineH + 4;
      lines.push(`<circle cx="${lx}" cy="${cy}" r="4" fill="${LANG_COLORS[l.name] ?? c.secondary}"/>`);
      lines.push(`<text x="${lx + 10}" y="${cy + 4}" font-size="11" fill="${c.muted}" ${FONT}>${esc(l.name)} ${l.percentage}%</text>`);
    });
    ry += Math.ceil(stats.topLanguages.slice(0, 12).length / 3) * lineH;
  }
  const fy = Math.max(ly, ry);
  lines.push(`</svg>`);
  return lines.join("\n").replace(/__H__/g, String(fy + PAD));
}

// ═══════════════════════════════════════════════════
// Explicit mode generators
// ═══════════════════════════════════════════════════

function exDefault(stats: ComputedStats, c: C): string {
  const W = 580, PAD = 20, cw = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgExplicitPreamble(W)];
  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);
  y = exProfile(lines, stats, c, W, PAD, y);
  y = exDivider(lines, c, PAD, W, y);
  y = exStatsCards(lines, stats, c, PAD, cw, y);
  y = exDivider(lines, c, PAD, W, y);
  y = exLanguages(lines, stats, c, PAD, W, cw, y);
  y = exDivider(lines, c, PAD, W, y);
  y = exRepos(lines, stats, c, PAD, cw, y);
  lines.push(`</svg>`);
  return lines.join("\n").replace(/__H__/g, String(y + PAD));
}

function exCompact(stats: ComputedStats, c: C): string {
  const W = 400, PAD = 16, cw = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgExplicitPreamble(W)];
  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);
  y = exProfile(lines, stats, c, W, PAD, y);
  y = exDivider(lines, c, PAD, W, y);
  y = exStatsCards(lines, stats, c, PAD, cw, y);
  y = exDivider(lines, c, PAD, W, y);
  y = exLanguages(lines, stats, c, PAD, W, cw, y);
  lines.push(`</svg>`);
  return lines.join("\n").replace(/__H__/g, String(y + PAD));
}

function exMinimal(stats: ComputedStats, c: C): string {
  const W = 500, PAD = 16, cw = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgExplicitPreamble(W)];
  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);
  y = exStatsCards(lines, stats, c, PAD, cw, y);
  lines.push(`</svg>`);
  return lines.join("\n").replace(/__H__/g, String(y + PAD - 14));
}

// ═══════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════

function generateSvg(stats: ComputedStats, variant: Variant, theme: Theme): string {
  // Auto mode: CSS variables with @media query (browser detects preference)
  if (theme === "auto") {
    const W = variant === "compact" ? 400 : variant === "minimal" ? 500 : variant === "classic" ? 620 : 580;
    const PAD = variant === "compact" || variant === "minimal" ? 16 : 20;
    const cw = W - PAD * 2;
    let y = PAD;
    const lines: string[] = [...svgAutoPreamble(W)];
    lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" class="bg"/>`);

    if (variant === "classic") {
      return generateAutoClassic(stats);
    }
    if (variant !== "minimal") { y = autoProfile(lines, stats, W, PAD, y); y = autoDivider(lines, PAD, W, y); }
    y = autoStatsCards(lines, stats, PAD, cw, y);
    y = autoDivider(lines, PAD, W, y);
    if (variant !== "minimal") { y = autoLanguages(lines, stats, PAD, W, cw, y); }
    if (variant === "default") { y = autoDivider(lines, PAD, W, y); y = autoRepos(lines, stats, PAD, cw, y); }
    lines.push(`</svg>`);
    return lines.join("\n").replace(/__H__/g, String(y + PAD));
  }

  // Explicit light/dark: all colors inlined (no CSS vars, guaranteed to work in <img>)
  const palette = theme === "light" ? LIGHT : DARK;
  switch (variant) {
    case "compact": return exCompact(stats, palette);
    case "minimal": return exMinimal(stats, palette);
    case "classic": return exClassic(stats, palette);
    default: return exDefault(stats, palette);
  }
}

async function fetchAvatarDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${b64}`;
  } catch {
    return url;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const cleanUser = username.toLowerCase().trim();
    const url = new URL(request.url);
    const variantParam = url.searchParams.get("variant");
    const variant: Variant = VALID_VARIANTS.includes(variantParam as Variant)
      ? (variantParam as Variant)
      : "default";
    const themeParam = url.searchParams.get("theme");
    const theme: Theme = VALID_THEMES.includes(themeParam as Theme)
      ? (themeParam as Theme)
      : "auto";

    const cached = await prisma.gitHubStats.findUnique({ where: { username: cleanUser } });
    let stats: ComputedStats;

    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL) {
      stats = cached.data as unknown as ComputedStats;
    } else {
      const profile = (await fetchGitHub(`https://api.github.com/users/${cleanUser}`)) as GitHubProfile;
      const repos = (await fetchGitHub(`https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=100`)) as GitHubRepo[];
      stats = computeStats(profile, repos);
      const contrib = await fetchContributions(cleanUser, GITHUB_TOKEN);
      stats.contributions = contrib.contributions;
      stats.reposContributedTo = contrib.reposContributedTo;
      await prisma.gitHubStats.upsert({
        where: { username: cleanUser },
        update: { data: stats as unknown as Prisma.InputJsonValue },
        create: { username: cleanUser, data: stats as unknown as Prisma.InputJsonValue },
      });
    }

    stats.avatarUrl = await fetchAvatarDataUri(stats.avatarUrl);
    const svg = generateSvg(stats, variant, theme);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(message, { status: 500 });
  }
}
