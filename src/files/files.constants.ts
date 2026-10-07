export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  '.csv': [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'text/plain',
  ],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};