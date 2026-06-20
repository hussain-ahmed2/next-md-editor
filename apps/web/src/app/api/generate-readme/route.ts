import { NextRequest } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are an expert developer documentation writer. Generate a professional, well-structured README in GitHub Flavored Markdown based on the user's project description. Include sections appropriate to the project type: title, features, installation, usage, API/configuration, contributing, and license. Use proper GFM formatting: fenced code blocks with language tags, tables, lists, and headings. Return ONLY the markdown content — no extra commentary or explanation.`;

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return new Response("Missing prompt", { status: 400 });
  }

  const openRouterRes = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "~openai/gpt-latest",
        max_tokens: 600,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!openRouterRes.ok) {
    const errorText = await openRouterRes.text();
    return new Response(errorText, { status: openRouterRes.status });
  }

  const encoder = new TextEncoder();
  const reader = openRouterRes.body!.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              /* skip malformed JSON lines */
            }
          }
        }
      } catch {
        /* stream aborted by client */
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
