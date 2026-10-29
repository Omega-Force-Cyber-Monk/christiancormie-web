import type { ReactNode } from "react";

type AppLoaderProps = {
  variant?: "fullscreen" | "page" | "inline" | "compact";
  label?: string;
  className?: string;
};
const presentation = {
  fullscreen: "grid min-h-dvh w-full place-items-center p-6",
  page: "grid min-h-[50vh] w-full place-items-center p-6",
  inline: "inline-flex items-center",
  compact: "flex items-center justify-center p-4",
};
export function AppLoader({
  variant = "page",
  label = "Loading page",
  className = "",
}: AppLoaderProps) {
  const Element = variant === "inline" ? "span" : "div";
  const content: ReactNode = (
    <span className="inline-flex items-center gap-3 text-sm text-[var(--text-muted)]">
      <span
        aria-hidden="true"
        className={`${variant === "inline" || variant === "compact" ? "size-4" : "size-5"} shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] motion-reduce:animate-none`}
      />
      {label}
    </span>
  );
  return (
    <Element
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${presentation[variant]} ${className}`}
    >
      {content}
    </Element>
  );
}
