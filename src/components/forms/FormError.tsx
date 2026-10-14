type FormErrorProps = {
  id?: string;
  message?: string;
};

export function FormError({ id, message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className="text-sm text-[var(--danger)]" id={id} role="alert">
      {message}
    </p>
  );
}
