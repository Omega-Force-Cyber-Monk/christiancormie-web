import { logger } from "@/lib/logger/logger";

export const storage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      logger.debug("Browser storage read unavailable.");
      return null;
    }
  },
  set(key: string, value: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      logger.debug("Browser storage write unavailable.");
      return false;
    }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      logger.debug("Browser storage removal unavailable.");
    }
  },
};
