import { Hono } from "hono";
import { 
  renderLandingPage, 
  renderExample1, 
  renderExample2 
} from "../../../controllers/example/web/view.controller";

export const exampleWebRoutes = new Hono();

/**
 * Web Routing Configuration for Multi-SPA Example
 */

// 1. Pure SSR Landing Page
exampleWebRoutes.get("/jsx", renderLandingPage);

// 2. Example 1 App
exampleWebRoutes.get("/vuejs/app/example1", renderExample1);
exampleWebRoutes.get("/vuejs/app/example1/*", renderExample1);

// 3. Example 2 App
exampleWebRoutes.get("/vuejs/app/example2", renderExample2);
exampleWebRoutes.get("/vuejs/app/example2/*", renderExample2);
