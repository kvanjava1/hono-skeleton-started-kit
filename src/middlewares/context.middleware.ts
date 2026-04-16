import type { Context, Next } from "hono";
import { requestContext } from "../utils/context.util.ts";

export const contextMiddleware = async (c: Context, next: Next) => {
  const requestId = c.get("requestId") || "unknown";
  const clientId = c.get("clientId");

  const store = {
    requestId,
    clientId,
  };

  await requestContext.run(store, async () => {
    await next();
  });
};
