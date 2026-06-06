import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/browser";
import { computeStats, type ComputedStats, type GitHubProfile, type GitHubRepo } from "@/lib/github-stats";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const VALID_VARIANTS = ["default", "compact", "minimal"] as const;
type Variant = (typeof VALID_VARIANTS)[number];

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
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Flutter: "#02569B",
  HTML: "#E34F26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Scala: "#C22D40",
  Haskell: "#5E5086",
  Lua: "#000080",
  "Objective-C": "#438EFF",
  R: "#198CE7",
  Julia: "#A270BA",
  Elixir: "#6E4A7E",
};

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

// ═══════════════════════════════════════════════════
// Shared SVG helpers
// ═══════════════════════════════════════════════════

function svgPreamble(W: number): string[] {
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
    `  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }`,
    `  .name { font-size: 16px; font-weight: 700; fill: var(--text-primary); }`,
    `  .username { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`,
    `  .bio { font-size: 11px; fill: var(--text-secondary); }`,
    `  .stat-val { font-size: 22px; font-weight: 700; fill: var(--text-primary); }`,
    `  .stat-lbl { font-size: 10px; font-weight: 500; fill: var(--text-secondary); text-transform: uppercase; }`,
    `  .section { font-size: 10px; font-weight: 600; fill: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.6px; }`,
    `  .lang-name { font-size: 11px; font-weight: 500; fill: var(--text-muted); }`,
    `  .lang-pct { font-size: 11px; fill: var(--text-secondary); }`,
    `  .repo-name { font-size: 12px; font-weight: 600; fill: var(--link); }`,
    `  .repo-stars { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`,
    `  .card-bg { fill: var(--card-bg); }`,
    `  .card-border { fill: var(--card-bg); stroke: var(--border); }`,
    `  .main-bg { fill: var(--bg); }`,
    `  .divider { stroke: var(--border); }`,
    `  .avatar-border { fill: none; stroke: var(--border); }`,
    `  .bar-bg { fill: var(--bar-bg); }`,
    `</style></defs>`,
  ];
}

function renderProfile(lines: string[], stats: ComputedStats, W: number, PAD: number, y: number): number {
  const avatarSize = 48;
  lines.push(`<defs><clipPath id="a"><circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath></defs>`);
  lines.push(`<image x="${PAD}" y="${y}" width="${avatarSize}" height="${avatarSize}" href="${esc(stats.avatarUrl)}" clip-path="url(#a)"/>`);
  lines.push(`<circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}" class="avatar-border" stroke-width="1.5"/>`);

  const nameX = PAD + avatarSize + 10;
  const displayName = stats.name ?? stats.login;
  lines.push(`<text x="${nameX}" y="${y + 18}" class="name">${esc(trunc(displayName, 24))}</text>`);
  lines.push(`<text x="${nameX}" y="${y + 32}" class="username">@${esc(trunc(stats.login, 24))}</text>`);
  if (stats.bio) {
    const bioMaxChars = Math.floor((W - PAD - nameX) / 5.5);
    const bioLines = wrapText(stats.bio, bioMaxChars);
    bioLines.slice(0, 2).forEach((line, i) => {
      lines.push(`<text x="${nameX}" y="${y + 46 + i * 14}" class="bio">${esc(trunc(line, bioMaxChars))}</text>`);
    });
  }
  return y + 80;
}

function renderDivider(lines: string[], PAD: number, W: number, y: number): number {
  lines.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" class="divider" stroke-width="1"/>`);
  return y + 14;
}

function renderStatsCards(lines: string[], stats: ComputedStats, PAD: number, contentW: number, y: number): number {
  const statsItems = [
    { label: "REPOS", value: stats.totalRepos },
    { label: "STARS", value: stats.totalStars },
    { label: "FORKS", value: stats.totalForks },
    { label: "FOLLOWERS", value: stats.followers },
  ];
  const gap = 10;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 56;

  statsItems.forEach((item, i) => {
    const cx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${cx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" class="card-border" stroke-width="1"/>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 28}" text-anchor="middle" class="stat-val">${fmt(item.value)}</text>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 44}" text-anchor="middle" class="stat-lbl">${item.label}</text>`);
  });
  return y + cardH + 14;
}

function renderLanguages(lines: string[], stats: ComputedStats, PAD: number, W: number, contentW: number, y: number): number {
  if (stats.topLanguages.length === 0) return y;

  lines.push(`<text x="${PAD}" y="${y + 10}" class="section">Languages</text>`);
  y += 18;

  const barH = 6;
  const totalPct = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
  let bx = PAD;

  lines.push(`<rect x="${PAD}" y="${y}" width="${contentW}" height="${barH}" rx="3" ry="3" class="bar-bg"/>`);
  stats.topLanguages.forEach((lang) => {
    const segW = Math.max((lang.percentage / totalPct) * contentW, lang.percentage > 0 ? 3 : 0);
    const color = LANG_COLORS[lang.name] ?? "#8b949e";
    lines.push(`<rect x="${bx}" y="${y}" width="${segW}" height="${barH}" rx="3" ry="3" fill="${color}"/>`);
    bx += segW;
  });

  y += barH + 10;

  let lx = PAD;
  let ly = y;
  const lineH = 18;
  stats.topLanguages.slice(0, 6).forEach((lang, i) => {
    const color = LANG_COLORS[lang.name] ?? "#8b949e";
    const nameW = lang.name.length * 7;
    const pctText = `${lang.percentage}%`;
    const pctW = pctText.length * 6.5;
    const labelW = 6 + 7 + nameW + 4 + pctW + 10;
    if (i > 0 && lx + labelW > W - PAD) {
      lx = PAD;
      ly += lineH;
    }
    if (i > 0) lx += 16;
    lines.push(`<circle cx="${lx + 3}" cy="${ly}" r="3" fill="${color}"/>`);
    lines.push(`<text x="${lx + 10}" y="${ly + 4}" class="lang-name">${esc(lang.name)}</text>`);
    lines.push(`<text x="${lx + 10 + nameW + 4}" y="${ly + 4}" class="lang-pct">${esc(pctText)}</text>`);
    lx += labelW;
  });

  return ly + lineH;
}

function renderRepos(lines: string[], stats: ComputedStats, PAD: number, contentW: number, y: number): number {
  if (stats.mostStarredRepos.length === 0) return y;

  lines.push(`<text x="${PAD}" y="${y + 10}" class="section">Most Starred</text>`);
  y += 22;

  const repoCount = Math.min(stats.mostStarredRepos.length, 3);
  const gap = 10;
  const cardW = (contentW - gap * (repoCount - 1)) / repoCount;
  const cardH = 36;

  stats.mostStarredRepos.slice(0, 3).forEach((repo, i) => {
    const rx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${rx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" class="card-border" stroke-width="1"/>`);
    lines.push(`<text x="${rx + 10}" y="${y + 22}" class="repo-name">${esc(trunc(repo.name, 16))}</text>`);
    lines.push(`<text x="${rx + cardW - 10}" y="${y + 22}" text-anchor="end" class="repo-stars">★ ${repo.stars}</text>`);
  });
  return y + cardH;
}

// ═══════════════════════════════════════════════════
// Variant: default — profile + stats + languages + repos
// ═══════════════════════════════════════════════════

function generateDefault(stats: ComputedStats): string {
  const W = 580;
  const PAD = 20;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [...svgPreamble(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" class="main-bg"/>`);

  y = renderProfile(lines, stats, W, PAD, y);
  y = renderDivider(lines, PAD, W, y);
  y = renderStatsCards(lines, stats, PAD, contentW, y);
  y = renderDivider(lines, PAD, W, y);
  y = renderLanguages(lines, stats, PAD, W, contentW, y);
  y = renderDivider(lines, PAD, W, y);
  y = renderRepos(lines, stats, PAD, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Variant: compact — profile + stats + languages (no repos)
// ═══════════════════════════════════════════════════

function generateCompact(stats: ComputedStats): string {
  const W = 400;
  const PAD = 16;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [...svgPreamble(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" class="main-bg"/>`);

  y = renderProfile(lines, stats, W, PAD, y);
  y = renderDivider(lines, PAD, W, y);
  y = renderStatsCards(lines, stats, PAD, contentW, y);
  y = renderDivider(lines, PAD, W, y);
  y = renderLanguages(lines, stats, PAD, W, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Variant: minimal — stats cards only (no profile, no languages, no repos)
// ═══════════════════════════════════════════════════

function generateMinimal(stats: ComputedStats): string {
  const W = 500;
  const PAD = 16;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [...svgPreamble(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" class="main-bg"/>`);

  y = renderStatsCards(lines, stats, PAD, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD - 14));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Dispatch + API handler
// ═══════════════════════════════════════════════════

function generateSvg(stats: ComputedStats, variant: Variant): string {
  switch (variant) {
    case "compact": return generateCompact(stats);
    case "minimal": return generateMinimal(stats);
    default: return generateDefault(stats);
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

    const cached = await prisma.gitHubStats.findUnique({ where: { username: cleanUser } });
    let stats: ComputedStats;

    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL) {
      stats = cached.data as unknown as ComputedStats;
    } else {
      const profile = (await fetchGitHub(`https://api.github.com/users/${cleanUser}`)) as GitHubProfile;
      const repos = (await fetchGitHub(`https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=100`)) as GitHubRepo[];
      stats = computeStats(profile, repos);
      await prisma.gitHubStats.upsert({
        where: { username: cleanUser },
        update: { data: stats as unknown as Prisma.InputJsonValue },
        create: { username: cleanUser, data: stats as unknown as Prisma.InputJsonValue },
      });
    }

    stats.avatarUrl = await fetchAvatarDataUri(stats.avatarUrl);
    const svg = generateSvg(stats, variant);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(message, { status: 500 });
  }
}
