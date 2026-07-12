import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    role: v.optional(v.string()), // "company" | "employee"
    companyName: v.optional(v.string()),
    // Dodo subscription state for company accounts — raw Dodo subscription
    // status ("active" | "on_hold" | "cancelled" | "failed" | "expired" | "pending").
    // Access to /review and /r/{email} is gated on this being "active".
    subscriptionStatus: v.optional(v.string()),
    dodoSubscriptionId: v.optional(v.string()),
  }).index("email", ["email"]),

  employees: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.string(), // "developer"
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  reviews: defineTable({
    employeeEmail: v.string(),
    companyName: v.string(),
    reviewerName: v.string(),
    reviewerEmail: v.string(),
    title: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    rehireable: v.boolean(),
    goodStanding: v.boolean(),
    ratings: v.object({
      technical: v.number(),
      ownership: v.number(),
      collaboration: v.number(),
      delivery: v.number(),
      communication: v.number(),
      growth: v.number(),
    }),
    rawComment: v.string(),
    structuredSummary: v.string(),
    integrityFlag: v.boolean(),
    integrityNote: v.optional(v.string()),
    vouchScore: v.number(),
    verified: v.boolean(),
    createdAt: v.number(),
  }).index("by_employeeEmail", ["employeeEmail"]),

  shareRequests: defineTable({
    employeeEmail: v.string(),
    requestingCompany: v.string(),
    status: v.string(), // "pending" | "approved" | "denied"
    // Deprecated: per-record payment gating was replaced by company
    // subscriptions. Kept optional so pre-existing rows stay valid.
    paid: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_employeeEmail", ["employeeEmail"]),
});
