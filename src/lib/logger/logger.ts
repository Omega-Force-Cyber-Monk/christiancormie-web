import type { Logger, LogLevel } from "@/lib/logger/logger.types";

const write = (level: LogLevel, message: string, context?: unknown) => {
  if (import.meta.env.PROD && level === "debug") return;

  const payload = context ? [message, context] : [message];
  console[level](...payload);
};

export const logger: Logger = {
  debug: (message, context) => write("debug", message, context),
  info: (message, context) => write("info", message, context),
  warn: (message, context) => write("warn", message, context),
  error: (message, context) => write("error", message, context),
};
