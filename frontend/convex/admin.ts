import { query } from "./_generated/server";
import { isAdmin } from "./lib/admin";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;
    const [waitlist, employees, reviews, shareRequests] = await Promise.all([
      ctx.db.query("waitlist").order("desc").collect(),
      ctx.db.query("employees").order("desc").collect(),
      ctx.db.query("reviews").order("desc").collect(),
      ctx.db.query("shareRequests").order("desc").collect(),
    ]);
    return { waitlist, employees, reviews, shareRequests };
  },
});
