import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { ROUTES } from "../../../configs/routes.config.ts";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  createViaJob,
} from "../../../controllers/example/api/crud.controller.ts";
import {
  IdParam,
  CreateBody,
  UpdateBody,
} from "../../../validations/example/crud.ts";

export const crudRoutes = new OpenAPIHono();

crudRoutes.openapi(
  createRoute({
    method: "get",
    path: ROUTES.API.EXAMPLE.CRUDS,
    tags: ["Example CRUD"],
    summary: "List all cruds",
    description:
      "Returns all non-deleted cruds, newest first. The list may be served from cache.",
    responses: {
      200: { description: "List of cruds retrieved successfully" },
    },
  }),
  getAll,
);

crudRoutes.openapi(
  createRoute({
    method: "get",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    tags: ["Example CRUD"],
    summary: "Get a crud by ID",
    description:
      "Returns a single non-deleted crud. Returns 404 if the crud does not exist or was deleted.",
    request: { params: IdParam },
    responses: {
      200: { description: "Crud retrieved successfully" },
      404: { description: "Crud not found" },
    },
  }),
  getById,
);

crudRoutes.openapi(
  createRoute({
    method: "post",
    path: ROUTES.API.EXAMPLE.CRUDS,
    tags: ["Example CRUD"],
    summary: "Create a crud",
    description:
      "Creates a new crud synchronously and returns the created record.",
    request: {
      body: {
        content: { "application/json": { schema: CreateBody } },
      },
    },
    responses: {
      201: { description: "Crud created successfully" },
    },
  }),
  create,
);

crudRoutes.openapi(
  createRoute({
    method: "put",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    tags: ["Example CRUD"],
    summary: "Update a crud",
    description:
      "Updates the title and/or content of an existing crud. Returns 404 if the crud does not exist or was deleted.",
    request: {
      params: IdParam,
      body: {
        content: { "application/json": { schema: UpdateBody } },
      },
    },
    responses: {
      200: { description: "Crud updated successfully" },
      404: { description: "Crud not found" },
    },
  }),
  update,
);

crudRoutes.openapi(
  createRoute({
    method: "post",
    path: ROUTES.API.EXAMPLE.CRUD_CREATE_JOB,
    tags: ["Example CRUD"],
    summary: "Create a crud asynchronously",
    description:
      "Enqueues a BullMQ job to create the crud and returns 202 with the job ID. Requires Redis to be enabled.",
    request: {
      body: {
        content: { "application/json": { schema: CreateBody } },
      },
    },
    responses: {
      202: { description: "Crud creation queued successfully" },
    },
  }),
  createViaJob,
);

crudRoutes.openapi(
  createRoute({
    method: "delete",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    tags: ["Example CRUD"],
    summary: "Delete a crud",
    description:
      "Soft-deletes a crud by setting its deleted_at timestamp. Returns 404 if the crud does not exist or was already deleted.",
    request: { params: IdParam },
    responses: {
      200: { description: "Crud deleted successfully" },
      404: { description: "Crud not found" },
    },
  }),
  remove,
);
