import { fetchRepoData } from "@/lib/cards/fetch-stats";
import { renderRepoCard } from "@/lib/cards/renderRepoCard";
import {
  parseCacheSeconds,
  parseRepoCardOptions,
  renderErrorCard,
  svgHeaders,
} from "@/lib/cards/options";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  const repo = searchParams.get("repo")?.trim();
  if (!username || !repo) {
    return new Response(renderErrorCard("Missing required parameters: username, repo"), {
      status: 400,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  try {
    const data = await fetchRepoData(username, repo);
    const svg = renderRepoCard(data, parseRepoCardOptions(searchParams));
    return new Response(svg, { headers: svgHeaders(parseCacheSeconds(searchParams)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(renderErrorCard(message), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  }
}
