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
export const auth = betterAuth({
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
});

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.BETTER_AUTH_SECRET && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
}
