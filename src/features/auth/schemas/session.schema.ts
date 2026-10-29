import { z } from "zod";

import { ALL_USER_ROLES } from "@/constants/roles";

export const logoutResponseSchema = z.object({ success: z.literal(true) });

export const authenticatedUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  roles: z.array(z.string()).default([]),
  role: z.enum(ALL_USER_ROLES).nullable(),
  avatarUrl: z.string().nullable().optional(),
});

export const sessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().nullable().optional(),
  user: authenticatedUserSchema.optional(),
});

export const storedSessionSchema = sessionResponseSchema.extend({
  sessionId: z.string().min(1),
  user: authenticatedUserSchema.nullable(),
});

export const sourceLoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    email: z.string(),
    displayName: z.string(),
    roles: z.array(z.string()),
  }),
});
