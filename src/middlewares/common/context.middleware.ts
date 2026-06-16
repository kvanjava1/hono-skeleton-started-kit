import type { Context, Next } from "hono";
import { requestContext } from "../../utils/context.util.ts";

export const contextMiddleware = async (c: Context, next: Next) => {
  const requestId = c.get("requestId") || "unknown";

  await requestContext.run({ requestId }, async () => {
    await next();
  });
};
