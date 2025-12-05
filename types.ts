export enum PointType {
  POSITIVE = 'POSITIVE', // Keep/Add
  NEGATIVE = 'NEGATIVE', // Remove/Subtract
}

export interface Point {
  id: string;
  x: number; // Percentage 0-1
  y: number; // Percentage 0-1
  type: PointType;
}

export interface SegmentationRequest {
  imageBase64: string;
  points: Point[];
}

export interface SegmentationResponse {
  resultImageBase64: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}