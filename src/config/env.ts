type EnvironmentConfig = {
  apiBaseUrl: string;
  socketUrl: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const env: EnvironmentConfig = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? ""),
  socketUrl: trimTrailingSlash(import.meta.env.VITE_SOCKET_URL ?? ""),
};
