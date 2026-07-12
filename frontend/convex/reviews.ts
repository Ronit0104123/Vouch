import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { vouchScore } from "./lib/scoring";

const ratingsValidator = v.object({
  technical: v.number(),
  ownership: v.number(),
  collaboration: v.number(),
  delivery: v.number(),
  communication: v.number(),
  growth: v.number(),
});

export const create = mutation({
  args: {
    employeeEmail: v.string(),
    employeeName: v.string(),
    companyName: v.string(),
    reviewerName: v.string(),
    reviewerEmail: v.string(),
    title: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    rehireable: v.boolean(),
    goodStanding: v.boolean(),
    ratings: ratingsValidator,
    rawComment: v.string(),
    structuredSummary: v.string(),
    integrityFlag: v.boolean(),
    integrityNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const caller = userId ? await ctx.db.get(userId) : null;
    if (!caller || caller.role !== "company" || caller.subscriptionStatus !== "active") {
      throw new Error("Only subscribed company accounts can write reviews");
    }

    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", args.employeeEmail))
      .first();

    if (!existingEmployee) {
      await ctx.db.insert("employees", {
        name: args.employeeName,
        email: args.employeeEmail,
        role: "developer",
        createdAt: Date.now(),
      });
    }

    const score = vouchScore(args.ratings);

    const reviewId = await ctx.db.insert("reviews", {
      employeeEmail: args.employeeEmail,
      companyName: args.companyName,
      reviewerName: args.reviewerName,
      reviewerEmail: args.reviewerEmail,
      title: args.title,
      startDate: args.startDate,
      endDate: args.endDate,
      rehireable: args.rehireable,
      goodStanding: args.goodStanding,
      ratings: args.ratings,
      rawComment: args.rawComment,
      structuredSummary: args.structuredSummary,
      integrityFlag: args.integrityFlag,
      integrityNote: args.integrityNote,
      vouchScore: score,
      verified: true,
      createdAt: Date.now(),
    });

    return { reviewId, vouchScore: score };
  },
});

export const listByEmployee = query({
  args: {
    employeeEmail: v.string(),
    shareRequestId: v.optional(v.id("shareRequests")),
  },
  handler: async (ctx, { employeeEmail, shareRequestId }) => {
    const userId = await getAuthUserId(ctx);
    const caller = userId ? await ctx.db.get(userId) : null;
    if (!caller || caller.role !== "company" || caller.subscriptionStatus !== "active") {
      return null;
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", employeeEmail))
      .first();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_employeeEmail", (q) => q.eq("employeeEmail", employeeEmail))
      .order("desc")
      .collect();

    if (!employee || reviews.length === 0) return null;

    const avgVouchScore = Math.round(
      reviews.reduce((sum, r) => sum + r.vouchScore, 0) / reviews.length,
    );

    let unlocked = false;
    if (shareRequestId) {
      const shareRequest = await ctx.db.get(shareRequestId);
      unlocked =
        !!shareRequest &&
        shareRequest.employeeEmail === employeeEmail &&
        shareRequest.status === "approved";
    }

    return {
      employee,
      avgVouchScore,
      reviewCount: reviews.length,
      unlocked,
      reviews: reviews.map((r) => ({
        _id: r._id,
        companyName: r.companyName,
        title: r.title,
        startDate: r.startDate,
        endDate: r.endDate,
        rehireable: r.rehireable,
        goodStanding: r.goodStanding,
        integrityFlag: r.integrityFlag,
        vouchScore: r.vouchScore,
        // Gated fields — only sent once the employee has approved the request.
        ratings: unlocked ? r.ratings : null,
        structuredSummary: unlocked ? r.structuredSummary : null,
        integrityNote: unlocked ? r.integrityNote : null,
      })),
    };
  },
});

export const myRecord = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "employee" || !user.email) return null;

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .first();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_employeeEmail", (q) => q.eq("employeeEmail", user.email!))
      .order("desc")
      .collect();

    if (!employee || reviews.length === 0) {
      return { employee: null, avgVouchScore: null, reviewCount: 0, reviews: [] };
    }

    const avgVouchScore = Math.round(
      reviews.reduce((sum, r) => sum + r.vouchScore, 0) / reviews.length,
    );

    return { employee, avgVouchScore, reviewCount: reviews.length, reviews };
  },
});
