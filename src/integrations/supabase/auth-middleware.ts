import { createMiddleware } from "@tanstack/react-start";

export const attachSupabaseAuth = createMiddleware().server(async ({ next, request }) => {
  const auth = request.headers.get("authorization");
  return next({ context: { accessToken: auth?.replace(/^Bearer\s+/i, "") || null } });
});
