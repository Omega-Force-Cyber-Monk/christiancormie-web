type EnvironmentConfig = {
  apiBaseUrl: string;
  socketUrl: string;
  enableMockAuth: boolean;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const env: EnvironmentConfig = {
  enableMockAuth:
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH === "true",
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? ""),
  socketUrl: trimTrailingSlash(import.meta.env.VITE_SOCKET_URL ?? ""),
};
