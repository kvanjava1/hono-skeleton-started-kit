import { Hono } from "hono";
import { setupMiddlewares } from "./middlewares/index.ts";
import { registerAllRoutes } from "./routes/index.ts";

import { NotFoundError } from "./utils/errors.util.ts";

const app = new Hono();

setupMiddlewares(app);
registerAllRoutes(app);

// Global 404 Handler
app.notFound((c) => {
  throw new NotFoundError(`Endpoint ${c.req.path} not found`);
});

export { app };
