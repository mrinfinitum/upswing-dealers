export type BatchImportState = {
  message?: string;
  success?: boolean;
  imported?: number;
  errors?: string[];
};

export const initialBatchImportState: BatchImportState = {};
