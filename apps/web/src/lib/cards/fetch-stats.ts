import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/browser";
import type { StatsData } from "./renderStatsCard";
import type { LangData } from "./renderTopLanguages";
import type { RepoData } from "./renderRepoCard";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SCHEMA_VERSION = 2;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

export interface CardUserData {
  schemaVersion: number;
  stats: StatsData;
  languages: LangData[];
}

interface GraphQLUserResponse {
  data?: {
    user?: {
      name: string | null;
      login: string;
      followers: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestReviewContributions: number;
      };
      pullRequests: { totalCount: number };
      openIssues: { totalCount: number };
      closedIssues: { totalCount: number };
      repositoriesContributedTo: { totalCount: number };
      repositories: {
        nodes: {
          stargazers: { totalCount: number };
          languages: {
            edges: { size: number; node: { name: string; color: string | null } }[];
          } | null;
        }[];
      };
    };
  };
  errors?: { message: string }[];
}

async function githubGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "next-md-editor",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<T>;
}

const USER_QUERY = `query userInfo($login: String!) {
  user(login: $login) {
    name
    login
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestReviewContributions
    }
    pullRequests(first: 1) { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
      nodes {
        stargazers { totalCount }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

/** REST fallback when no GITHUB_TOKEN is configured (GraphQL requires auth). */
async function fetchViaRest(username: string): Promise<CardUserData> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "next-md-editor",
  };
  const u = encodeURIComponent(username);
  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${u}`, { headers }),
    fetch(`https://api.github.com/users/${u}/repos?sort=pushed&per_page=100`, { headers }),
  ]);
  if (!profileRes.ok) throw new Error(`GitHub user not found (${profileRes.status})`);
  const profile = (await profileRes.json()) as {
    name: string | null;
    login: string;
    followers: number;
  };
  const repos = (reposRes.ok ? await reposRes.json() : []) as {
    stargazers_count: number;
    language: string | null;
    fork: boolean;
  }[];

  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const langMap = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language && !repo.fork) {
      langMap.set(repo.language, (langMap.get(repo.language) ?? 0) + 1);
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    stats: {
      name: profile.name ?? profile.login,
      login: profile.login,
      totalStars,
      commits: 0,
      prs: 0,
      issues: 0,
      reviews: 0,
      contributedTo: 0,
      followers: profile.followers,
    },
    // Without byte sizes, weight languages by repo count
    languages: Array.from(langMap.entries()).map(([name, count]) => ({
      name,
      color: null,
      size: count,
    })),
  };
}

async function fetchFresh(username: string): Promise<CardUserData> {
  if (!GITHUB_TOKEN) return fetchViaRest(username);

  const json = await githubGraphQL<GraphQLUserResponse>(USER_QUERY, { login: username });
  const user = json.data?.user;
  if (!user) {
    throw new Error(json.errors?.[0]?.message ?? "GitHub user not found");
  }

  const totalStars = user.repositories.nodes.reduce(
    (acc, repo) => acc + repo.stargazers.totalCount,
    0,
  );

  const langMap = new Map<string, { color: string | null; size: number }>();
  for (const repo of user.repositories.nodes) {
    for (const edge of repo.languages?.edges ?? []) {
      const existing = langMap.get(edge.node.name);
      langMap.set(edge.node.name, {
        color: edge.node.color ?? existing?.color ?? null,
        size: (existing?.size ?? 0) + edge.size,
      });
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    stats: {
      name: user.name ?? user.login,
      login: user.login,
      totalStars,
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.pullRequests.totalCount,
      issues: user.openIssues.totalCount + user.closedIssues.totalCount,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      contributedTo: user.repositoriesContributedTo.totalCount,
      followers: user.followers.totalCount,
    },
    languages: Array.from(langMap.entries()).map(([name, v]) => ({
      name,
      color: v.color,
      size: v.size,
    })),
  };
}

/** Card data for a user, cached in Postgres under "cards:<login>". */
export async function fetchCardUserData(username: string): Promise<CardUserData> {
  const cleanUser = username.toLowerCase().trim();
  const cacheKey = `cards:${cleanUser}`;

  try {
    const cached = await prisma.gitHubStats.findUnique({ where: { username: cacheKey } });
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL) {
      const data = cached.data as unknown as CardUserData;
      if (data.schemaVersion === SCHEMA_VERSION) return data;
    }
  } catch {
    // DB unavailable — fall through to a live fetch
  }

  const fresh = await fetchFresh(cleanUser);

  try {
    await prisma.gitHubStats.upsert({
      where: { username: cacheKey },
      update: { data: fresh as unknown as Prisma.InputJsonValue },
      create: { username: cacheKey, data: fresh as unknown as Prisma.InputJsonValue },
    });
  } catch {
    // Caching is best-effort
  }

  return fresh;
}

const REPO_QUERY = `query repoInfo($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    name
    nameWithOwner
    description
    isArchived
    isTemplate
    stargazers { totalCount }
    forkCount
    primaryLanguage { name color }
  }
}`;

interface GraphQLRepoResponse {
  data?: {
    repository?: {
      name: string;
      nameWithOwner: string;
      description: string | null;
      isArchived: boolean;
      isTemplate: boolean;
      stargazers: { totalCount: number };
      forkCount: number;
      primaryLanguage: { name: string; color: string | null } | null;
    };
  };
  errors?: { message: string }[];
}

export async function fetchRepoData(owner: string, repoName: string): Promise<RepoData> {
  if (GITHUB_TOKEN) {
    const json = await githubGraphQL<GraphQLRepoResponse>(REPO_QUERY, {
      owner,
      repo: repoName,
    });
    const repo = json.data?.repository;
    if (!repo) throw new Error(json.errors?.[0]?.message ?? "Repository not found");
    return {
      name: repo.name,
      nameWithOwner: repo.nameWithOwner,
      description: repo.description,
      language: repo.primaryLanguage,
      starCount: repo.stargazers.totalCount,
      forkCount: repo.forkCount,
      isArchived: repo.isArchived,
      isTemplate: repo.isTemplate,
    };
  }

  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
    {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "next-md-editor" },
  });
  if (!res.ok) throw new Error(`Repository not found (${res.status})`);
  const repo = (await res.json()) as {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    archived: boolean;
    is_template?: boolean;
  };
  return {
    name: repo.name,
    nameWithOwner: repo.full_name,
    description: repo.description,
    language: repo.language ? { name: repo.language, color: null } : null,
    starCount: repo.stargazers_count,
    forkCount: repo.forks_count,
    isArchived: repo.archived,
    isTemplate: repo.is_template ?? false,
  };
}
