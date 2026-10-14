import { STORAGE_KEYS } from "@/constants/storage";
import { storedSessionSchema } from "@/features/auth/schemas/session.schema";
import type { StoredSession } from "@/features/auth/types/auth.types";
import { storage } from "@/utils/storage";

export const sessionStorageService = {
  readSession(): StoredSession | null {
    const saved = storage.get(STORAGE_KEYS.AUTH_SESSION);
    if (saved !== null) {
      try {
        const result = storedSessionSchema.safeParse(JSON.parse(saved));
        return result.success ? result.data : null;
      } catch {
        return null;
      }
    }

    // Migrate the existing token keys without changing their storage location.
    const accessToken = storage.get(STORAGE_KEYS.AUTH_TOKEN);
    const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
    if (!accessToken || !refreshToken) return null;

    const session: StoredSession = {
      accessToken,
      refreshToken,
      sessionId: crypto.randomUUID(),
      user: null,
      expiresAt: null,
    };
    this.writeSession(session);
    return session;
  },
  writeSession(session: StoredSession): void {
    // One atomic record prevents tokens and user identity from becoming mismatched.
    if (storage.set(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session))) {
      storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },
  clear(): void {
    storage.remove(STORAGE_KEYS.AUTH_SESSION);
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },
};
