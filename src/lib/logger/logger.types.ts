export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = Record<LogLevel, (message: string, context?: unknown) => void>;
