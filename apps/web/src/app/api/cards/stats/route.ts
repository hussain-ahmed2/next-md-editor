import { fetchCardUserData } from "@/lib/cards/fetch-stats";
import { renderStatsCard } from "@/lib/cards/renderStatsCard";
import {
  parseCacheSeconds,
  parseStatsOptions,
  renderErrorCard,
  svgHeaders,
} from "@/lib/cards/options";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  if (!username) {
    return new Response(renderErrorCard("Missing required parameter: username"), {
      status: 400,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  try {
    const data = await fetchCardUserData(username);
    const svg = renderStatsCard(data.stats, parseStatsOptions(searchParams));
    return new Response(svg, { headers: svgHeaders(parseCacheSeconds(searchParams)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(renderErrorCard(message), {
      status: 200, // 200 so the error card renders inside READMEs
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  }
}
