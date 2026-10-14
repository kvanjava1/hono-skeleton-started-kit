import { Hono } from "hono";
import { renderLandingPage } from "../../../controllers/example/web/view.controller.ts";

export const exampleWebRoutes = new Hono();

/** Hono JSX server-rendered example page. */
exampleWebRoutes.get("/jsx", renderLandingPage);
