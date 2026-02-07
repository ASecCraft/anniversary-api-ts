// APIレスポンスの型定義
export interface AnniversaryResponse {
  date: string;
  name: string | null;
  found: boolean;
}

export interface AllDataResponse {
  total: number;
  data: Record<string, string>;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: Record<string, string>;
}

export interface HealthResponse {
  status: 'healthy' | 'error';
  timestamp: string;
  records_loaded: number;
  uptime: number;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  total_records: number;
  endpoints: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  timestamp: string;
}

// CSV行の型定義
export interface CsvRow {
  date: string;
  name: string;
}

// アプリケーション設定の型定義
export interface AppConfig {
  port: number;
  csvFilePath: string;
  corsOrigin: string;
}

