import { DEFAULT_MAX_FILE_SIZE_BYTES } from "@/utils/files/file.constants";

export type FileValidationOptions = {
  allowedMimeTypes?: readonly string[];
  allowedExtensions?: readonly string[];
  maxSizeBytes?: number;
};

export const validateFile = (
  file: File,
  {
    allowedExtensions,
    allowedMimeTypes,
    maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
  }: FileValidationOptions,
) => {
  if (file.size > maxSizeBytes) {
    return "File is too large.";
  }

  if (allowedMimeTypes?.length && !allowedMimeTypes.includes(file.type)) {
    return "File type is not allowed.";
  }

  if (allowedExtensions?.length) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return "File extension is not allowed.";
    }
  }

  return null;
};
