import { z } from "@hono/zod-openapi";

export const IdParam = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ example: 1, description: "User ID (positive integer)" }),
});

export const CreateBody = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .openapi({ example: "Budi Santoso", description: "Full name (required)" }),
  email: z
    .string()
    .email()
    .max(255)
    .openapi({ example: "user@example.com", description: "Unique email among active users" }),
  password: z
    .string()
    .min(8)
    .max(128)
    .openapi({ example: "secret-password", description: "Plain password, hashed with Argon2id" }),
  isActive: z
    .boolean()
    .optional()
    .openapi({ example: true, description: "Defaults to true when omitted" }),
});

export const UpdateBody = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .openapi({ example: "Nama Baru", description: "New full name" }),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .openapi({ example: "new@example.com", description: "New unique email" }),
  password: z
    .string()
    .min(8)
    .max(128)
    .optional()
    .openapi({ example: "new-secret-password", description: "Omit to keep the current password" }),
  isActive: z
    .boolean()
    .optional()
    .openapi({ example: false, description: "Activate/deactivate the account" }),
});

export type IdParamInput = z.infer<typeof IdParam>;
export type CreateBodyInput = z.infer<typeof CreateBody>;
export type UpdateBodyInput = z.infer<typeof UpdateBody>;
