import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

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
    paid: v.boolean(),
    createdAt: v.number(),
  }).index("by_employeeEmail", ["employeeEmail"]),

  waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
