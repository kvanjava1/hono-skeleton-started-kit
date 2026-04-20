import { z } from "zod";

const passwordSchema = z.string().min(8).max(100);
const emailSchema = z.email().max(255);
const fullNameSchema = z.string().trim().min(1).max(255);

export const createExampleSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const updateExampleSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const listExamplesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    id: z.coerce.number().int().positive().optional(),
    full_name: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
export type UpdateExampleInput = z.infer<typeof updateExampleSchema>;
export type ListExamplesQuery = z.infer<typeof listExamplesQuerySchema>;
