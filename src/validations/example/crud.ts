import { z } from "@hono/zod-openapi";

export const IdParam = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ example: 1, description: "Crud ID (positive integer)" }),
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

export const SendEmailBody = z.object({
  email: z
    .string()
    .email()
    .openapi({ example: "user@example.com", description: "Target recipient email address" }),
  name: z
    .string()
    .min(1)
    .default("Teman")
    .openapi({ example: "Budi Santoso", description: "Recipient name" }),
});

export type IdParamInput = z.infer<typeof IdParam>;
export type CreateBodyInput = z.infer<typeof CreateBody>;
export type UpdateBodyInput = z.infer<typeof UpdateBody>;
export type SendEmailBodyInput = z.infer<typeof SendEmailBody>;
