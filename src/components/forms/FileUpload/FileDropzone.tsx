import type { ChangeEvent, DragEvent } from "react";

type FileDropzoneProps = {
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function FileDropzone({
  disabled = false,
  accept,
  multiple = false,
  onFilesSelected,
}: FileDropzoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;
    onFilesSelected(Array.from(files));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  return (
    <label
      className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-[var(--surface-muted)]"
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="font-medium text-[var(--text)]">Choose files</span>
      <span>or drag and drop them here</span>
      <input
        className="sr-only"
        accept={accept}
        disabled={disabled}
        multiple={multiple}
        onChange={handleInputChange}
        type="file"
      />
    </label>
  );
}
