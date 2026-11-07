import { z } from "zod";

/**
 * Request validation schemas for the SPA demo (web form, not OpenAPI).
 * Field names match the Inertia form keys in SpaDemo.vue so the 422 error
 * bag keys line up with the client-side inputs.
 */
export const DemoContactForm = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("A valid email is required"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be at most 500 characters"),
});

export type DemoContactFormInput = z.infer<typeof DemoContactForm>;
