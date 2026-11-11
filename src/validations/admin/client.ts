import { z } from "zod";
import { ACCOUNT_STATUSES } from "../../database/schema/common/status.schema.ts";

export const ClientStatusEnum = z.enum([
  ACCOUNT_STATUSES.ACTIVE,
  ACCOUNT_STATUSES.INACTIVE,
  ACCOUNT_STATUSES.SUSPENDED,
  ACCOUNT_STATUSES.PENDING,
]);

export const CreateClientBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens")
    .optional(),
  status: ClientStatusEnum.default(ACCOUNT_STATUSES.ACTIVE),
});

export const UpdateClientBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .optional(),
  status: ClientStatusEnum.optional(),
});

export const IdParam = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform((val) => Number.parseInt(val, 10)),
});

export type CreateClientInput = z.input<typeof CreateClientBody>;
export type UpdateClientInput = z.infer<typeof UpdateClientBody>;
