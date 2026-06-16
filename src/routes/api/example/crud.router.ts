import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { ROUTES } from "../../../configs/routes.config.ts";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  createViaJob,
} from "../../../controllers/example/crud.controller.ts";
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
    responses: {
      200: { description: "List all cruds" },
    },
  }),
  getAll,
);

crudRoutes.openapi(
  createRoute({
    method: "get",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    request: { params: IdParam },
    responses: {
      200: { description: "Get a crud by ID" },
      404: { description: "Crud not found" },
    },
  }),
  getById,
);

crudRoutes.openapi(
  createRoute({
    method: "post",
    path: ROUTES.API.EXAMPLE.CRUDS,
    request: {
      body: {
        content: { "application/json": { schema: CreateBody } },
      },
    },
    responses: {
      201: { description: "Crud created" },
    },
  }),
  create,
);

crudRoutes.openapi(
  createRoute({
    method: "put",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    request: {
      params: IdParam,
      body: {
        content: { "application/json": { schema: UpdateBody } },
      },
    },
    responses: {
      200: { description: "Crud updated" },
      404: { description: "Crud not found" },
    },
  }),
  update,
);

crudRoutes.openapi(
  createRoute({
    method: "post",
    path: ROUTES.API.EXAMPLE.CRUD_CREATE_JOB,
    request: {
      body: {
        content: { "application/json": { schema: CreateBody } },
      },
    },
    responses: {
      202: { description: "Crud creation queued" },
    },
  }),
  createViaJob,
);

crudRoutes.openapi(
  createRoute({
    method: "delete",
    path: ROUTES.API.EXAMPLE.CRUD_BY_ID,
    request: { params: IdParam },
    responses: {
      200: { description: "Crud deleted" },
      404: { description: "Crud not found" },
    },
  }),
  remove,
);


