import { Hono } from "hono";
import { 
  renderLandingPage, 
  renderExample1, 
  renderExample2 
} from "../../../controllers/example/loadView.controller";

export const exampleWebRoutes = new Hono();

/**
 * Web Routing Configuration for Multi-SPA Example
 */

// 1. Pure SSR Landing Page
exampleWebRoutes.get("/", renderLandingPage);

// 2. Example 1 App
exampleWebRoutes.get("/example1", renderExample1);
exampleWebRoutes.get("/example1/*", renderExample1);

// 3. Example 2 App
exampleWebRoutes.get("/example2", renderExample2);
exampleWebRoutes.get("/example2/*", renderExample2);
