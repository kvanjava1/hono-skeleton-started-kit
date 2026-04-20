import { Hono } from "hono";
import { 
  renderLandingPage, 
  renderExample1, 
  renderExample2 
} from "../../../controllers/example/exampleLoadView.controller.ts";

export const exampleLoadViewRoutes = new Hono();

/**
 * Web Routing Configuration for Multi-SPA Example
 */

// 1. Pure SSR Landing Page
exampleLoadViewRoutes.get("/", renderLandingPage);

// 2. Example 1 App
exampleLoadViewRoutes.get("/example1", renderExample1);
exampleLoadViewRoutes.get("/example1/*", renderExample1);

// 3. Example 2 App
exampleLoadViewRoutes.get("/example2", renderExample2);
exampleLoadViewRoutes.get("/example2/*", renderExample2);
