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

interface C { bg: string; card: string; border: string; barBg: string; text: string; secondary: string; muted: string; link: string }
const DARK: C = { bg: "#0d1117", card: "#161b22", border: "#30363d", barBg: "#21262d", text: "#f0f6fc", secondary: "#8b949e", muted: "#c9d1d9", link: "#58a6ff" };
const LIGHT: C = { bg: "#ffffff", card: "#f6f8fa", border: "#d0d7de", barBg: "#e8e8e8", text: "#1f2328", secondary: "#656d76", muted: "#1f2328", link: "#0969da" };

function getColors(theme: Theme, preferLight?: boolean): C {
  if (theme === "light") return LIGHT;
  if (theme === "dark") return DARK;
  return preferLight ? LIGHT : DARK;
}

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

const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";

// ═══════════════════════════════════════════════════
// Shared SVG helpers — all colors inlined
// ═══════════════════════════════════════════════════

function svgOpen(W: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="__H__" viewBox="0 0 ${W} __H__">`;
}

function renderProfile(lines: string[], stats: ComputedStats, c: C, W: number, PAD: number, y: number): number {
  const avatarSize = 48;
  lines.push(`<defs><clipPath id="a"><circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath></defs>`);
  lines.push(`<image x="${PAD}" y="${y}" width="${avatarSize}" height="${avatarSize}" href="${esc(stats.avatarUrl)}" clip-path="url(#a)"/>`);
  lines.push(`<circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}" fill="none" stroke="${c.border}" stroke-width="1.5"/>`);

  const nameX = PAD + avatarSize + 10;
  const displayName = stats.name ?? stats.login;
  lines.push(`<text x="${nameX}" y="${y + 18}" font-size="16" font-weight="700" fill="${c.text}" ${FONT}>${esc(trunc(displayName, 24))}</text>`);
  lines.push(`<text x="${nameX}" y="${y + 32}" font-size="12" font-weight="500" fill="${c.secondary}" ${FONT}>@${esc(trunc(stats.login, 24))}</text>`);
  if (stats.bio) {
    const bioMaxChars = Math.floor((W - PAD - nameX) / 5.5);
    const bioLines = wrapText(stats.bio, bioMaxChars);
    bioLines.slice(0, 2).forEach((line, i) => {
      lines.push(`<text x="${nameX}" y="${y + 46 + i * 14}" font-size="11" fill="${c.secondary}" ${FONT}>${esc(trunc(line, bioMaxChars))}</text>`);
    });
  }
  return y + 80;
}

function renderDivider(lines: string[], c: C, PAD: number, W: number, y: number): number {
  lines.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${c.border}" stroke-width="1"/>`);
  return y + 14;
}

function renderStatsCards(lines: string[], stats: ComputedStats, c: C, PAD: number, contentW: number, y: number): number {
  const items = [
    { label: "REPOS", value: stats.totalRepos },
    { label: "STARS", value: stats.totalStars },
    { label: "FORKS", value: stats.totalForks },
    { label: "FOLLOWERS", value: stats.followers },
  ];
  const gap = 10;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 56;

  items.forEach((item, i) => {
    const cx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${cx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" fill="${c.card}" stroke="${c.border}" stroke-width="1"/>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 28}" text-anchor="middle" font-size="22" font-weight="700" fill="${c.text}" ${FONT}>${fmt(item.value)}</text>`);
    lines.push(`<text x="${cx + cardW / 2}" y="${y + 44}" text-anchor="middle" font-size="10" font-weight="500" fill="${c.secondary}" ${FONT} text-transform="uppercase">${item.label}</text>`);
  });
  return y + cardH + 14;
}

function renderLanguages(lines: string[], stats: ComputedStats, c: C, PAD: number, W: number, contentW: number, y: number): number {
  if (stats.topLanguages.length === 0) return y;

  lines.push(`<text x="${PAD}" y="${y + 10}" font-size="10" font-weight="600" fill="${c.secondary}" letter-spacing="0.6" ${FONT}>LANGUAGES</text>`);
  y += 18;

  const barH = 6;
  const totalPct = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
  let bx = PAD;

  lines.push(`<rect x="${PAD}" y="${y}" width="${contentW}" height="${barH}" rx="3" ry="3" fill="${c.barBg}"/>`);
  stats.topLanguages.forEach((lang) => {
    const segW = Math.max((lang.percentage / totalPct) * contentW, lang.percentage > 0 ? 3 : 0);
    const color = LANG_COLORS[lang.name] ?? c.secondary;
    lines.push(`<rect x="${bx}" y="${y}" width="${segW}" height="${barH}" rx="3" ry="3" fill="${color}"/>`);
    bx += segW;
  });

  y += barH + 10;

  let lx = PAD;
  let ly = y;
  const lineH = 18;
  stats.topLanguages.slice(0, 6).forEach((lang, i) => {
    const color = LANG_COLORS[lang.name] ?? c.secondary;
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
    lines.push(`<text x="${lx + 10}" y="${ly + 4}" font-size="11" font-weight="500" fill="${c.muted}" ${FONT}>${esc(lang.name)}</text>`);
    lines.push(`<text x="${lx + 10 + nameW + 4}" y="${ly + 4}" font-size="11" fill="${c.secondary}" ${FONT}>${esc(pctText)}</text>`);
    lx += labelW;
  });

  return ly + lineH;
}

function renderRepos(lines: string[], stats: ComputedStats, c: C, PAD: number, contentW: number, y: number): number {
  if (stats.mostStarredRepos.length === 0) return y;

  lines.push(`<text x="${PAD}" y="${y + 10}" font-size="10" font-weight="600" fill="${c.secondary}" letter-spacing="0.6" ${FONT}>MOST STARRED</text>`);
  y += 22;

  const repoCount = Math.min(stats.mostStarredRepos.length, 3);
  const gap = 10;
  const cardW = (contentW - gap * (repoCount - 1)) / repoCount;
  const cardH = 36;

  stats.mostStarredRepos.slice(0, 3).forEach((repo, i) => {
    const rx = PAD + i * (cardW + gap);
    lines.push(`<rect x="${rx}" y="${y}" width="${cardW}" height="${cardH}" rx="6" ry="6" fill="${c.card}" stroke="${c.border}" stroke-width="1"/>`);
    lines.push(`<text x="${rx + 10}" y="${y + 22}" font-size="12" font-weight="600" fill="${c.link}" ${FONT}>${esc(trunc(repo.name, 16))}</text>`);
    lines.push(`<text x="${rx + cardW - 10}" y="${y + 22}" text-anchor="end" font-size="12" font-weight="500" fill="${c.secondary}" ${FONT}>★ ${repo.stars}</text>`);
  });
  return y + cardH;
}

// ═══════════════════════════════════════════════════
// Variant: default
// ═══════════════════════════════════════════════════

function generateDefault(stats: ComputedStats, c: C): string {
  const W = 580;
  const PAD = 20;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgOpen(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);

  y = renderProfile(lines, stats, c, W, PAD, y);
  y = renderDivider(lines, c, PAD, W, y);
  y = renderStatsCards(lines, stats, c, PAD, contentW, y);
  y = renderDivider(lines, c, PAD, W, y);
  y = renderLanguages(lines, stats, c, PAD, W, contentW, y);
  y = renderDivider(lines, c, PAD, W, y);
  y = renderRepos(lines, stats, c, PAD, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Variant: compact
// ═══════════════════════════════════════════════════

function generateCompact(stats: ComputedStats, c: C): string {
  const W = 400;
  const PAD = 16;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgOpen(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);

  y = renderProfile(lines, stats, c, W, PAD, y);
  y = renderDivider(lines, c, PAD, W, y);
  y = renderStatsCards(lines, stats, c, PAD, contentW, y);
  y = renderDivider(lines, c, PAD, W, y);
  y = renderLanguages(lines, stats, c, PAD, W, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Variant: minimal
// ═══════════════════════════════════════════════════

function generateMinimal(stats: ComputedStats, c: C): string {
  const W = 500;
  const PAD = 16;
  const contentW = W - PAD * 2;
  let y = PAD;
  const lines: string[] = [svgOpen(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);

  y = renderStatsCards(lines, stats, c, PAD, contentW, y);

  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(y + PAD - 14));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Variant: classic — two-column layout
// ═══════════════════════════════════════════════════

function renderClassicStatRow(lines: string[], icon: string, label: string, value: string, c: C, y: number, x: number, valX: number): number {
  lines.push(`<text x="${x}" y="${y + 4}" font-size="13" fill="${c.secondary}" ${FONT}>${icon}</text>`);
  lines.push(`<text x="${x + 20}" y="${y + 4}" font-size="13" fill="${c.text}" ${FONT}>${esc(label)}</text>`);
  lines.push(`<text x="${valX}" y="${y + 4}" text-anchor="end" font-size="13" font-weight="600" fill="${c.text}" ${FONT}>${esc(value)}</text>`);
  return y + 28;
}

function generateClassic(stats: ComputedStats, c: C): string {
  const W = 620;
  const PAD = 20;
  const contentW = W - PAD * 2;
  const leftW = Math.floor(contentW * 0.52);
  const rightW = contentW - leftW - 16;
  let y = PAD;
  const lines: string[] = [svgOpen(W)];

  lines.push(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="${c.bg}"/>`);

  const displayName = stats.name ?? stats.login;
  lines.push(`<text x="${PAD}" y="${y + 14}" font-size="16" font-weight="700" fill="${c.link}" ${FONT}>${esc(trunc(displayName, 26))}'s GitHub Statistics</text>`);
  y += 30;
  y = renderDivider(lines, c, PAD, W, y);
  y += 4;

  const leftX = PAD;
  const rightX = PAD + leftW + 16;
  const startY = y;

  let ly = startY;
  const contributionStats = [
    { icon: "★", label: "Stars", value: fmt(stats.totalStars) },
    { icon: "⑂", label: "Forks", value: fmt(stats.totalForks) },
    { icon: "⊞", label: "All-time contributions", value: fmt(stats.contributions ?? 0) },
    { icon: "⟐", label: "Lines of code changed", value: "N/A" },
    { icon: "⊙", label: "Repositories with contributions", value: fmt(stats.reposContributedTo ?? 0) },
    { icon: "⊡", label: "Repos", value: fmt(stats.totalRepos) },
    { icon: "♡", label: "Followers", value: fmt(stats.followers) },
  ];
  for (const s of contributionStats) {
    ly = renderClassicStatRow(lines, s.icon, s.label, s.value, c, ly, leftX, leftX + leftW);
  }

  let ry = startY;
  if (stats.topLanguages.length > 0) {
    lines.push(`<text x="${rightX}" y="${ry + 10}" font-size="13" font-weight="600" fill="${c.text}" ${FONT}>Languages Used (By File Size)</text>`);
    ry += 22;

    const barH = 10;
    const totalPct = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
    let bx = rightX;
    lines.push(`<rect x="${rightX}" y="${ry}" width="${rightW}" height="${barH}" rx="5" ry="5" fill="${c.barBg}"/>`);
    stats.topLanguages.forEach((lang) => {
      const segW = Math.max((lang.percentage / totalPct) * rightW, lang.percentage > 0 ? 3 : 0);
      const color = LANG_COLORS[lang.name] ?? c.secondary;
      lines.push(`<rect x="${bx}" y="${ry}" width="${segW}" height="${barH}" rx="5" ry="5" fill="${color}"/>`);
      bx += segW;
    });
    ry += barH + 14;

    const colW = rightW / 3;
    const lineH = 20;
    stats.topLanguages.slice(0, 12).forEach((lang, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const lx = rightX + col * colW;
      const cy = ry + row * lineH + 4;
      const color = LANG_COLORS[lang.name] ?? c.secondary;
      lines.push(`<circle cx="${lx}" cy="${cy}" r="4" fill="${color}"/>`);
      lines.push(`<text x="${lx + 10}" y="${cy + 4}" font-size="11" fill="${c.muted}" ${FONT}>${esc(lang.name)} ${lang.percentage}%</text>`);
    });
    ry += Math.ceil(stats.topLanguages.slice(0, 12).length / 3) * lineH;
  }

  const finalY = Math.max(ly, ry);
  lines.push(`</svg>`);
  lines[0] = lines[0].replace(/__H__/g, String(finalY + PAD));
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════

function generateSvg(stats: ComputedStats, variant: Variant, colors: C): string {
  switch (variant) {
    case "compact": return generateCompact(stats, colors);
    case "minimal": return generateMinimal(stats, colors);
    case "classic": return generateClassic(stats, colors);
    default: return generateDefault(stats, colors);
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

    // For "auto", detect from Accept header or default dark
    let preferLight: boolean | undefined;
    if (theme === "auto") {
      const accept = request.headers.get("accept") ?? "";
      // Browser dark-mode users send specific media query in Sec-CH-Prefers-Color-Scheme
      const prefersDark = request.headers.get("sec-ch-prefers-color-scheme");
      if (prefersDark === "light") preferLight = true;
      else if (prefersDark === "dark") preferLight = false;
      // Default to dark for "auto"
      if (preferLight === undefined) preferLight = false;
    }
    const colors = getColors(theme, preferLight);
    const svg = generateSvg(stats, variant, colors);

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
