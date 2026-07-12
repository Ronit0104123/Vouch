import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Temporary bypass of the Dodo checkout flow so company accounts can get
// past the paywall while we focus on the rest of the platform. Real Dodo
// checkout logic (backend /subscribe, webhook handling) is untouched —
// swap StartTrial.tsx's BYPASS_PAYMENT flag back to false to re-enable it.
export const startFreeTrial = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "company") {
      throw new Error("Only company accounts can start a trial");
    }
    await ctx.db.patch(userId, { subscriptionStatus: "active" });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role ?? null,
      companyName: user.companyName ?? null,
      subscriptionStatus: user.subscriptionStatus ?? null,
    };
  },
});

export const markSubscriptionInternal = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
    dodoSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, status, dodoSubscriptionId }) => {
    await ctx.db.patch(userId, {
      subscriptionStatus: status,
      ...(dodoSubscriptionId ? { dodoSubscriptionId } : {}),
    });
  },
});

// Called by the backend after it has verified the Dodo webhook's HMAC
// signature — `secret` must match WEBHOOK_SHARED_SECRET set via
// `npx convex env set`, so this can't be triggered by an arbitrary client.
export const confirmSubscription = action({
  args: {
    userId: v.id("users"),
    status: v.string(),
    dodoSubscriptionId: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, { userId, status, dodoSubscriptionId, secret }) => {
    if (secret !== process.env.WEBHOOK_SHARED_SECRET) {
      throw new Error("Not authorized");
    }
    await ctx.runMutation(internal.users.markSubscriptionInternal, {
      userId,
      status,
      dodoSubscriptionId,
    });
  },
});
