import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const request = mutation({
  args: {
    employeeEmail: v.string(),
  },
  handler: async (ctx, { employeeEmail }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in as a company to request access");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "company" || !user.companyName) {
      throw new Error("Only company accounts can request access");
    }

    const existing = await ctx.db
      .query("shareRequests")
      .withIndex("by_employeeEmail", (q) => q.eq("employeeEmail", employeeEmail))
      .filter((q) => q.eq(q.field("requestingCompany"), user.companyName))
      .order("desc")
      .first();
    if (existing && existing.status !== "denied") return existing._id;

    return await ctx.db.insert("shareRequests", {
      employeeEmail,
      requestingCompany: user.companyName,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("shareRequests") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    if (!doc) return null;
    return {
      status: doc.status,
      employeeEmail: doc.employeeEmail,
      requestingCompany: doc.requestingCompany,
    };
  },
});

export const listForEmployee = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "employee" || !user.email) return null;

    const requests = await ctx.db
      .query("shareRequests")
      .withIndex("by_employeeEmail", (q) => q.eq("employeeEmail", user.email!))
      .order("desc")
      .collect();

    return {
      requests,
      pendingCount: requests.filter((r) => r.status === "pending").length,
    };
  },
});

export const approve = mutation({
  args: { id: v.id("shareRequests") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    const shareRequest = await ctx.db.get(id);
    if (!user || !shareRequest || user.role !== "employee" || user.email !== shareRequest.employeeEmail) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(id, { status: "approved" });
  },
});

export const deny = mutation({
  args: { id: v.id("shareRequests") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    const shareRequest = await ctx.db.get(id);
    if (!user || !shareRequest || user.role !== "employee" || user.email !== shareRequest.employeeEmail) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(id, { status: "denied" });
  },
});
