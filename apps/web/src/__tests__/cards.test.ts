import { describe, expect, it } from "vitest";
import { calculateRank } from "@/lib/cards/rank";
import { renderStatsCard, type StatsData } from "@/lib/cards/renderStatsCard";
import { renderTopLanguagesCard, type LangData } from "@/lib/cards/renderTopLanguages";
import { renderRepoCard } from "@/lib/cards/renderRepoCard";
import { getCardColors, kFormatter } from "@/lib/cards/utils";
import { themes } from "@/lib/cards/themes";
import { parseStatsOptions, parseTopLangsOptions } from "@/lib/cards/options";

const STATS: StatsData = {
  name: "Ada Lovelace",
  login: "ada",
  totalStars: 1234,
  commits: 500,
  prs: 42,
  issues: 17,
  reviews: 5,
  contributedTo: 8,
  followers: 100,
};

const LANGS: LangData[] = [
  { name: "TypeScript", color: "#3178c6", size: 5000 },
  { name: "Python", color: "#3572A5", size: 3000 },
  { name: "Rust", color: "#dea584", size: 2000 },
];

describe("calculateRank", () => {
  it("gives an empty account the lowest rank", () => {
    const rank = calculateRank({
      allCommits: false,
      commits: 0,
      prs: 0,
      issues: 0,
      reviews: 0,
      stars: 0,
      followers: 0,
    });
    expect(rank.level).toBe("C");
    expect(rank.percentile).toBeCloseTo(100);
  });

  it("ranks active accounts higher (lower percentile)", () => {
    const active = calculateRank({
      allCommits: false,
      commits: 2000,
      prs: 500,
      issues: 200,
      reviews: 100,
      stars: 5000,
      followers: 1000,
    });
    expect(active.percentile).toBeLessThan(10);
    expect(["S", "A+"]).toContain(active.level);
  });
});

describe("theme resolution", () => {
  it("ships the well-known upstream themes", () => {
    for (const name of [
      "default",
      "dark",
      "radical",
      "merko",
      "gruvbox",
      "tokyonight",
      "onedark",
      "cobalt",
      "synthwave",
      "highcontrast",
      "dracula",
      "transparent",
    ]) {
      expect(themes[name], `theme ${name}`).toBeDefined();
    }
  });

  it("resolves theme colors with overrides and falls back on bad hex", () => {
    const colors = getCardColors({ theme: "tokyonight", title_color: "ff0000" });
    expect(colors.titleColor).toBe("#ff0000");
    expect(colors.textColor).toBe(`#${themes.tokyonight.text_color}`);

    // Invalid override falls back to the default theme color (upstream behavior)
    const fallback = getCardColors({ theme: "tokyonight", title_color: "not-a-color" });
    expect(fallback.titleColor).toBe(`#${themes.default.title_color}`);
  });

  it("parses gradient backgrounds", () => {
    const colors = getCardColors({ bg_color: "35,4158d0,c850c0" });
    expect(colors.bgColor).toEqual(["35", "4158d0", "c850c0"]);
  });
});

describe("renderStatsCard", () => {
  it("renders all stat rows with themed colors", () => {
    const svg = renderStatsCard(STATS, { theme: "tokyonight", show_icons: true });
    expect(svg).toContain("Total Stars Earned");
    expect(svg).toContain("Total PRs");
    expect(svg).toContain("1.2k"); // kFormatter on stars
    expect(svg).toContain(`#${themes.tokyonight.title_color}`);
    expect(svg).toContain("rank-circle");
  });

  it("honors hide + hide_rank", () => {
    const svg = renderStatsCard(STATS, { hide: ["stars", "issues"], hide_rank: true });
    // Stat rows carry data-testid attributes; the a11y description may still
    // mention all stats (matches upstream), so assert on the rows themselves.
    expect(svg).not.toContain('data-testid="stars"');
    expect(svg).not.toContain('data-testid="issues"');
    expect(svg).not.toContain('data-testid="rank-circle"');
    expect(svg).toContain('data-testid="commits"');
  });

  it("supports gradients and custom titles", () => {
    const svg = renderStatsCard(STATS, {
      bg_color: "35,4158d0,c850c0",
      custom_title: "My Numbers",
    });
    expect(svg).toContain("linearGradient");
    expect(svg).toContain("My Numbers");
  });
});

describe("renderTopLanguagesCard", () => {
  it.each(["normal", "compact", "donut", "donut-vertical", "pie"] as const)(
    "renders the %s layout with all languages",
    (layout) => {
      const svg = renderTopLanguagesCard(LANGS, { layout });
      expect(svg).toContain("TypeScript");
      expect(svg).toContain("Python");
      expect(svg).toContain("Rust");
      expect(svg).not.toContain("NaN");
    },
  );

  it("respects langs_count and hide", () => {
    const svg = renderTopLanguagesCard(LANGS, { langs_count: 1, hide: ["typescript"] });
    expect(svg).toContain("Python");
    expect(svg).not.toContain("TypeScript");
    expect(svg).not.toContain("Rust");
  });
});

describe("renderRepoCard", () => {
  it("renders name, description, language and counts", () => {
    const svg = renderRepoCard(
      {
        name: "cool-repo",
        nameWithOwner: "ada/cool-repo",
        description: "A really cool repository that does many things",
        language: { name: "TypeScript", color: "#3178c6" },
        starCount: 4200,
        forkCount: 96,
      },
      { theme: "dracula", show_owner: true },
    );
    expect(svg).toContain("ada/cool-repo");
    expect(svg).toContain("TypeScript");
    expect(svg).toContain("4.2k");
    expect(svg).toContain("96");
  });
});

describe("options parsing", () => {
  it("parses stats options from a query string", () => {
    const params = new URLSearchParams(
      "username=ada&theme=dark&show_icons=true&hide=stars,issues&line_height=999&rank_icon=github&card_width=500",
    );
    const opts = parseStatsOptions(params);
    expect(opts.theme).toBe("dark");
    expect(opts.show_icons).toBe(true);
    expect(opts.hide).toEqual(["stars", "issues"]);
    expect(opts.rank_icon).toBe("github");
    expect(opts.card_width).toBe(500);
    // line_height is clamped later in the renderer; parser passes through
    const svg = renderStatsCard(STATS, opts);
    expect(svg).not.toContain("NaN");
  });

  it("falls back to defaults on junk input", () => {
    const params = new URLSearchParams("layout=bogus&langs_count=abc&rank_icon=nope");
    const langOpts = parseTopLangsOptions(params);
    expect(langOpts.layout).toBe("normal");
    expect(langOpts.langs_count).toBe(5);
    const statOpts = parseStatsOptions(params);
    expect(statOpts.rank_icon).toBe("default");
  });
});

describe("kFormatter", () => {
  it("shortens large numbers", () => {
    expect(kFormatter(999)).toBe("999");
    expect(kFormatter(1200)).toBe("1.2k");
  });
});
