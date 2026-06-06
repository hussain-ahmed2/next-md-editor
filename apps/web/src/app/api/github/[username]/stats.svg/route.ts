import { prisma } from "@/lib/prisma";
import type { ComputedStats } from "@/lib/github-stats";

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

function generateSvg(stats: ComputedStats): string {
  const W = 580;
  const PAD = 20;
  const contentW = W - PAD * 2;

  let y = PAD;
  const lines: string[] = [];
  const l = (s: string) => lines.push(s);

  l(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="__H__" viewBox="0 0 ${W} __H__">`);
  l(`<defs><style>`);
  l(`  :root {`);
  l(`    --bg: #0d1117; --card-bg: #161b22; --border: #30363d; --bar-bg: #21262d;`);
  l(`    --text-primary: #f0f6fc; --text-secondary: #8b949e; --text-muted: #c9d1d9;`);
  l(`    --link: #58a6ff;`);
  l(`  }`);
  l(`  @media (prefers-color-scheme: light) {`);
  l(`    :root {`);
  l(`      --bg: #ffffff; --card-bg: #f6f8fa; --border: #d0d7de; --bar-bg: #e8e8e8;`);
  l(`      --text-primary: #1f2328; --text-secondary: #656d76; --text-muted: #1f2328;`);
  l(`      --link: #0969da;`);
  l(`    }`);
  l(`  }`);
  l(`  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }`);
  l(`  .name { font-size: 16px; font-weight: 700; fill: var(--text-primary); }`);
  l(`  .username { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`);
  l(`  .bio { font-size: 11px; fill: var(--text-secondary); }`);
  l(`  .stat-val { font-size: 22px; font-weight: 700; fill: var(--text-primary); }`);
  l(`  .stat-lbl { font-size: 10px; font-weight: 500; fill: var(--text-secondary); text-transform: uppercase; }`);
  l(`  .section { font-size: 10px; font-weight: 600; fill: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.6px; }`);
  l(`  .lang-name { font-size: 11px; font-weight: 500; fill: var(--text-muted); }`);
  l(`  .lang-pct { font-size: 11px; fill: var(--text-secondary); }`);
  l(`  .repo-name { font-size: 12px; font-weight: 600; fill: var(--link); }`);
  l(`  .repo-stars { font-size: 12px; font-weight: 500; fill: var(--text-secondary); }`);
  l(`</style></defs>`);

  l(`<rect width="${W}" height="__H__" rx="8" ry="8" fill="var(--bg)" stroke="var(--border)" stroke-width="1"/>`);

  // ═══ ROW 1: Profile (full width) ═══
  const avatarSize = 48;
  l(`<defs><clipPath id="a"><circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}"/></clipPath></defs>`);
  l(`<image x="${PAD}" y="${y}" width="${avatarSize}" height="${avatarSize}" href="${esc(stats.avatarUrl)}" clip-path="url(#a)"/>`);
  l(`<circle cx="${PAD + avatarSize / 2}" cy="${y + avatarSize / 2}" r="${avatarSize / 2}" fill="none" stroke="var(--border)" stroke-width="1.5"/>`);

  const nameX = PAD + avatarSize + 10;
  const displayName = stats.name ?? stats.login;
  l(`<text x="${nameX}" y="${y + 18}" class="name">${esc(trunc(displayName, 24))}</text>`);
  l(`<text x="${nameX}" y="${y + 32}" class="username">@${esc(trunc(stats.login, 24))}</text>`);
  if (stats.bio) {
    const bioMaxChars = Math.floor((W - PAD - nameX) / 5.5);
    const bioLines = wrapText(stats.bio, bioMaxChars);
    bioLines.slice(0, 2).forEach((line, i) => {
      l(`<text x="${nameX}" y="${y + 46 + i * 14}" class="bio">${esc(trunc(line, bioMaxChars))}</text>`);
    });
  }

  y += 80;

  // ── Divider ──
  l(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`);
  y += 14;

  // ═══ ROW 2: Stats (4 cards in a row) ═══
  const statsItems = [
    { label: "REPOS", value: stats.totalRepos },
    { label: "STARS", value: stats.totalStars },
    { label: "FORKS", value: stats.totalForks },
    { label: "FOLLOWERS", value: stats.followers },
  ];
  const statCardGap = 10;
  const statCardW = (contentW - statCardGap * 3) / 4;
  const statCardH = 56;

  statsItems.forEach((item, i) => {
    const cx = PAD + i * (statCardW + statCardGap);
    l(`<rect x="${cx}" y="${y}" width="${statCardW}" height="${statCardH}" rx="6" ry="6" fill="var(--card-bg)" stroke="var(--border)" stroke-width="1"/>`);
    l(`<text x="${cx + statCardW / 2}" y="${y + 28}" text-anchor="middle" class="stat-val">${fmt(item.value)}</text>`);
    l(`<text x="${cx + statCardW / 2}" y="${y + 44}" text-anchor="middle" class="stat-lbl">${item.label}</text>`);
  });

  y += statCardH + 14;

  // ── Divider ──
  l(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`);
  y += 14;

  // ═══ ROW 3: Languages (full width) ═══
  if (stats.topLanguages.length > 0) {
    l(`<text x="${PAD}" y="${y + 10}" class="section">Languages</text>`);
    y += 18;

    const barH = 6;
    const totalPct = stats.topLanguages.reduce((s, l) => s + l.percentage, 0);
    let bx = PAD;

    l(`<rect x="${PAD}" y="${y}" width="${contentW}" height="${barH}" rx="3" ry="3" fill="var(--bar-bg)"/>`);
    stats.topLanguages.forEach((lang) => {
      const segW = Math.max((lang.percentage / totalPct) * contentW, lang.percentage > 0 ? 3 : 0);
      const color = LANG_COLORS[lang.name] ?? "#8b949e";
      l(`<rect x="${bx}" y="${y}" width="${segW}" height="${barH}" rx="3" ry="3" fill="${color}"/>`);
      bx += segW;
    });

    y += barH + 10;

    // Labels inline with wrapping
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
      l(`<circle cx="${lx + 3}" cy="${ly}" r="3" fill="${color}"/>`);
      l(`<text x="${lx + 10}" y="${ly + 4}" class="lang-name">${esc(lang.name)}</text>`);
      l(`<text x="${lx + 10 + nameW + 4}" y="${ly + 4}" class="lang-pct">${esc(pctText)}</text>`);
      lx += labelW;
    });

    y = ly + lineH;
  }

  // ── Divider ──
  l(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`);
  y += 14;

  // ═══ ROW 4: Repos (3 cards in a row) ═══
  if (stats.mostStarredRepos.length > 0) {
    l(`<text x="${PAD}" y="${y + 10}" class="section">Most Starred</text>`);
    y += 22;

    const repoCount = Math.min(stats.mostStarredRepos.length, 3);
    const repoCardGap = 10;
    const repoCardW = (contentW - repoCardGap * (repoCount - 1)) / repoCount;
    const repoCardH = 36;

    stats.mostStarredRepos.slice(0, 3).forEach((repo, i) => {
      const rx = PAD + i * (repoCardW + repoCardGap);
      l(`<rect x="${rx}" y="${y}" width="${repoCardW}" height="${repoCardH}" rx="6" ry="6" fill="var(--card-bg)" stroke="var(--border)" stroke-width="1"/>`);
      l(`<text x="${rx + 10}" y="${y + 22}" class="repo-name">${esc(trunc(repo.name, 16))}</text>`);
      l(`<text x="${rx + repoCardW - 10}" y="${y + 22}" text-anchor="end" class="repo-stars">★ ${repo.stars}</text>`);
    });
    y += repoCardH;
  }

  const H = y + PAD;
  lines[0] = lines[0].replace(/__H__/g, String(H));

  l(`</svg>`);
  return lines.join("\n");
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
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const cleanUser = username.toLowerCase().trim();

    const cached = await prisma.gitHubStats.findUnique({ where: { username: cleanUser } });
    if (!cached) {
      return new Response("Stats not found", { status: 404 });
    }

    const stats = cached.data as unknown as ComputedStats;
    stats.avatarUrl = await fetchAvatarDataUri(stats.avatarUrl);
    const svg = generateSvg(stats);

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
