import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * When GitHub sign-in is not configured (no BETTER_AUTH_SECRET /
 * GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET), answer 503 instead of
 * constructing an unusable auth instance at import time.
 */
const unavailable = () =>
  new Response(
    JSON.stringify({ error: "Sign-in is not configured on this server." }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );

const handlers = auth ? toNextJsHandler(auth.handler) : { GET: unavailable, POST: unavailable };

export const GET = handlers.GET;
export const POST = handlers.POST;
