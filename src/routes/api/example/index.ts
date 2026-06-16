import { Hono } from "hono";
import { crudRoutes } from "./crud.router.ts";

export const exampleApiRoutes = new Hono();
exampleApiRoutes.route("/", crudRoutes);
