import { FileDropzone } from "@/components/forms/FileUpload/FileDropzone";
import { FileUploadItem } from "@/components/forms/FileUpload/FileUploadItem";
import type {
  FileUploadItemValue,
  FileUploadProps,
} from "@/components/forms/FileUpload/file-upload.types";
import { validateFile } from "@/utils/files/validateFile";

const createFileItem = (
  file: File,
  options: Pick<
    FileUploadProps,
    "allowedExtensions" | "allowedMimeTypes" | "maxSizeBytes"
  >,
): FileUploadItemValue => ({
  id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
  file,
  error: validateFile(file, options) ?? undefined,
});

export function FileUpload({
  allowedExtensions,
  allowedMimeTypes,
  disabled = false,
  maxSizeBytes,
  multiple = false,
  onChange,
  value,
}: FileUploadProps) {
  const handleFilesSelected = (files: File[]) => {
    if (disabled) return;
    const nextFiles = files.map((file) =>
      createFileItem(file, {
        allowedExtensions,
        allowedMimeTypes,
        maxSizeBytes,
      }),
    );

    onChange(multiple ? [...value, ...nextFiles] : nextFiles.slice(0, 1));
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <FileDropzone
        disabled={disabled}
        accept={
          [
            ...(allowedMimeTypes ?? []),
            ...(allowedExtensions ?? []).map(
              (extension) => `.${extension.replace(/^\./, "")}`,
            ),
          ].join(",") || undefined
        }
        multiple={multiple}
        onFilesSelected={handleFilesSelected}
      />
      {value.length ? (
        <ul className="space-y-2">
          {value.map((item) => (
            <FileUploadItem
              disabled={disabled}
              item={item}
              key={item.id}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
