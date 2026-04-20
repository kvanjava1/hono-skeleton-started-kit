import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createExample,
  deleteExample,
  getExample,
  getExamples,
  updateExample,
} from "../../../controllers/example/crudWithJob.controller.ts";
import {
  createExampleSchema,
  listExamplesQuerySchema,
  updateExampleSchema,
} from "../../../schemas/example/crudWithJob.schema.ts";

const exampleRoutes = new Hono();

exampleRoutes.post("/", zValidator("json", createExampleSchema), async (c) => {
  return createExample(c, c.req.valid("json"));
});

exampleRoutes.get("/", zValidator("query", listExamplesQuerySchema), async (c) => {
  return getExamples(c, c.req.valid("query"));
});

exampleRoutes.get("/:id", getExample);

exampleRoutes.put("/:id", zValidator("json", updateExampleSchema), async (c) => {
  return updateExample(c, c.req.valid("json"));
});

exampleRoutes.delete("/:id", deleteExample);

export { exampleRoutes };
