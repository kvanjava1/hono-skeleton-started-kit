import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  createViaJob,
  sendEmail,
} from "../../../controllers/api/example/crud.controller.ts";
import {
  IdParam,
  CreateBody,
  UpdateBody,
  SendEmailBody,
} from "../../../validations/example/crud.ts";
import { openApiValidationHook } from "../../../utils/openapi.util.ts";

export const crudRoutes = new OpenAPIHono({
  defaultHook: openApiValidationHook,
});

// GET /api/example/cruds
crudRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
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

// GET /api/example/cruds/{id}
crudRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
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

// POST /api/example/cruds
crudRoutes.openapi(
  createRoute({
    method: "post",
    path: "/",
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

// PUT /api/example/cruds/{id}
crudRoutes.openapi(
  createRoute({
    method: "put",
    path: "/{id}",
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

// POST /api/example/cruds/job
crudRoutes.openapi(
  createRoute({
    method: "post",
    path: "/job",
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

// DELETE /api/example/cruds/{id}
crudRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
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

// POST /api/example/cruds/send-email
crudRoutes.openapi(
  createRoute({
    method: "post",
    path: "/send-email",
    tags: ["Example CRUD"],
    summary: "Send example welcome email via queue",
    description:
      "Dispatches a WelcomeMail to the background BullMQ queue to demonstrate email sending in Hono Skeleton.",
    request: {
      body: {
        content: { "application/json": { schema: SendEmailBody } },
      },
    },
    responses: {
      202: { description: "Email queued successfully for delivery" },
    },
  }),
  sendEmail,
);
