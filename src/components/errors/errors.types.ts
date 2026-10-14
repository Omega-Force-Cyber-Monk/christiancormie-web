import type { ErrorInfo, ReactNode } from "react";

export type ErrorFallbackProps = {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
};

export type AppErrorBoundaryProps = {
  children: ReactNode;
};
