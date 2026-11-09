import { z } from "@hono/zod-openapi";

/**
 * Web login body (dashboard admin — plan D3: POST /admin/login).
 * `password` only requires min(1): credential checks happen in
 * `UserService.verifyCredentials`, which always answers with one generic
 * error so bad-format vs bad-credentials cannot be used to enumerate
 * accounts beyond what the format rule already reveals.
 */
export const LoginBody = z.object({
  email: z
    .string()
    .email()
    .openapi({ example: "admin@example.com", description: "Account email" }),
  password: z
    .string()
    .min(1)
    .openapi({ example: "secret-password", description: "Account password" }),
});

export type LoginBodyInput = z.infer<typeof LoginBody>;
