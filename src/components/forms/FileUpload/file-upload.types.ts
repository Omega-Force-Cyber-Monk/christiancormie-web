import type { FileValidationOptions } from "@/utils/files/validateFile";

export type FileUploadItemValue = {
  id: string;
  file: File;
  error?: string;
};

export type FileUploadProps = FileValidationOptions & {
  disabled?: boolean;
  multiple?: boolean;
  value: FileUploadItemValue[];
  onChange: (files: FileUploadItemValue[]) => void;
};
