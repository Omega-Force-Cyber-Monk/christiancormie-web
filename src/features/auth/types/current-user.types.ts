import type { z } from "zod";

import type { currentUserResponseSchema } from "@/features/auth/schemas/current-user.schema";

export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;
