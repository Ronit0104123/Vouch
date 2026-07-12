import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const role = params.role as string;
        const email = params.email as string;
        return {
          email,
          role,
          ...(role === "employee" ? { name: params.name as string } : {}),
          ...(role === "company" ? { companyName: params.companyName as string } : {}),
        };
      },
    }),
  ],
});
