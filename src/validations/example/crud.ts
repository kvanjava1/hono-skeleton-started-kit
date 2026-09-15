import { z } from "@hono/zod-openapi";

export const IdParam = z.object({
  id: z.string().openapi({ example: "1", description: "Crud ID" }),
});

export const CreateBody = z.object({
  title: z
    .string()
    .min(1)
    .openapi({ example: "My Title", description: "Crud title (required)" }),
  content: z
    .string()
    .optional()
    .openapi({ example: "Some content", description: "Optional crud content" }),
});

export const UpdateBody = z.object({
  title: z
    .string()
    .min(1)
    .optional()
    .openapi({ example: "Updated Title", description: "New crud title" }),
  content: z
    .string()
    .optional()
    .openapi({ example: "Updated content", description: "New crud content" }),
});
