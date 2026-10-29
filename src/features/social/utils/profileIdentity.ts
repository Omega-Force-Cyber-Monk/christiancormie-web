import { z } from "zod";
import { ROUTES } from "@/constants/routes";
export const isMemberIdentifier = (value: string | undefined) =>
  value === "me" || z.uuid().safeParse(value).success;
export const memberProfilePath = (userId: string) =>
  ROUTES.CUSTOMER_PROFILE.replace(":id", encodeURIComponent(userId));
