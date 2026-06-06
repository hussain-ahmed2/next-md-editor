import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/browser";
import { computeStats, type ComputedStats, type GitHubProfile, type GitHubRepo } from "@/lib/github-stats";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchGitHub(url: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "next-md-editor",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const cleanUser = username.toLowerCase().trim();

    const cached = await prisma.gitHubStats.findUnique({ where: { username: cleanUser } });
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL) {
      return NextResponse.json(cached.data as unknown as ComputedStats, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const profile = (await fetchGitHub(
      `https://api.github.com/users/${cleanUser}`,
    )) as GitHubProfile;

    const repos = (await fetchGitHub(
      `https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=100`,
    )) as GitHubRepo[];

    const stats = computeStats(profile, repos);

    await prisma.gitHubStats.upsert({
      where: { username: cleanUser },
      update: { data: stats as unknown as Prisma.InputJsonValue },
      create: { username: cleanUser, data: stats as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(stats, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
