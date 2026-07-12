import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
