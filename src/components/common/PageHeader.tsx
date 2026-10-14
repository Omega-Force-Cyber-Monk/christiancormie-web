type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-normal text-[var(--text)] md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
