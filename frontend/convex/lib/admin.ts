import type { QueryCtx, MutationCtx } from "../_generated/server";

export const ADMIN_EMAILS = ["admin@gmail.com"];

export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return !!identity?.email && ADMIN_EMAILS.includes(identity.email);
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  if (!(await isAdmin(ctx))) {
    throw new Error("Not authorized");
  }
}
