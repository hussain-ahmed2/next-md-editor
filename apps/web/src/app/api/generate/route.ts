import { NextRequest } from "next/server";

export const runtime = "edge";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful coding assistant. Generate clear, well-formatted content in GitHub Flavored Markdown based on the user's request. Use proper formatting: fenced code blocks with language tags, tables, lists, and headings where appropriate. Return ONLY the markdown content — no extra commentary or explanation.`;

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt } = await req.json();

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
          { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
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
              /* skip malformed */
            }
          }
        }
      } catch {
        /* aborted */
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
