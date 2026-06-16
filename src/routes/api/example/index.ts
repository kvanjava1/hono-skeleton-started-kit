import { OpenAPIHono } from "@hono/zod-openapi";
import { crudRoutes } from "./crud.router.ts";

export const exampleApiRoutes = new OpenAPIHono();
exampleApiRoutes.route("/", crudRoutes);
