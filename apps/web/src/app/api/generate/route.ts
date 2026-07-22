import { NextRequest } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are a helpful coding assistant. Generate clear, well-formatted content in GitHub Flavored Markdown based on the user's request. Use proper formatting: fenced code blocks with language tags, tables, lists, and headings where appropriate. When given a prior conversation, build on the previous context naturally. Always respond in markdown unless the user asks for plain text.`;

// Best-effort per-instance rate limit (a serverless instance handles a slice
// of traffic, so this is a guardrail against a single client hammering the
// billed key, not a global quota). 20 requests / minute / IP.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const MAX_MESSAGES = 40;

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response("AI features are not configured on this server.", { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return new Response("Too many requests. Please wait a moment and try again.", {
      status: 429,
    });
  }

  let body: { messages?: unknown; prompt?: unknown; systemPrompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const { messages, prompt, systemPrompt } = body;

  if ((!messages || !Array.isArray(messages)) && (!prompt || typeof prompt !== "string")) {
    return new Response("Missing messages or prompt", { status: 400 });
  }
  if (Array.isArray(messages) && messages.length > MAX_MESSAGES) {
    return new Response("Too many messages", { status: 400 });
  }

  const apiMessages: Array<{ role: string; content: unknown }> = Array.isArray(messages)
    ? (messages as Array<{ role: string; content: unknown }>)
    : [{ role: "user", content: prompt }];

  const openRouterRes = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        max_tokens: 500,
        stream: true,
        messages: [
          { role: "system", content: typeof systemPrompt === "string" ? systemPrompt : SYSTEM_PROMPT },
          ...apiMessages,
        ],
      }),
    },
  );

  if (!openRouterRes.ok || !openRouterRes.body) {
    const errorText = openRouterRes.body ? await openRouterRes.text() : "Upstream AI service unavailable";
    return new Response(errorText, { status: openRouterRes.ok ? 502 : openRouterRes.status });
  }

  const encoder = new TextEncoder();
  const reader = openRouterRes.body.getReader();

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
