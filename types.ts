export interface ProcessedImageResult {
  imageUrl: string;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessingError {
  message: string;
  details?: string;
}
