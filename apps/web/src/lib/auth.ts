import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Server-side better-auth instance. GitHub sign-in powers the stats
 * username autofill and the Vercel deploy wizard — documents themselves
 * never leave the user's browser.
 *
 * Required env: BETTER_AUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 * (and BETTER_AUTH_URL in production).
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.BETTER_AUTH_SECRET && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
}

/**
 * Only constructed when the required env vars are present. Building it
 * unconfigured makes better-auth reject on its default secret, which
 * surfaced as an unhandledRejection at server start — a deploy missing
 * these should degrade to "sign-in unavailable", not a noisy boot.
 */
export const auth = isAuthConfigured()
  ? betterAuth({
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID ?? "",
          clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
          // Store the GitHub login handle as the user's name so stats blocks
          // can be auto-filled with it.
          mapProfileToUser: (profile) => ({
            name: profile.login,
            image: profile.avatar_url,
          }),
        },
      },
    })
  : null;
