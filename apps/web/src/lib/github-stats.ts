export interface GitHubProfile {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
}

export interface ComputedStats {
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  followers: number;
  following: number;
  topLanguages: { name: string; count: number; percentage: number }[];
  mostStarredRepos: { name: string; stars: number; url: string; description: string | null }[];
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  login: string;
}

export function computeStats(profile: GitHubProfile, repos: GitHubRepo[]): ComputedStats {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

  const langMap = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) {
      langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
    }
  }
  const totalLangRepos = Array.from(langMap.values()).reduce((a, b) => a + b, 0);
  const topLanguages = Array.from(langMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalLangRepos > 0 ? Math.round((count / totalLangRepos) * 100) : 0,
    }));

  const mostStarredRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      url: r.html_url,
      description: r.description,
    }));

  return {
    totalStars,
    totalForks,
    totalRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    topLanguages,
    mostStarredRepos,
    avatarUrl: profile.avatar_url,
    name: profile.name,
    bio: profile.bio,
    login: profile.login,
  };
}
