// 既存の型に追加

// JSONデータの生データ形式
export interface AnniversaryRawData {
  id: number;
  mmdd: string;
  anniv1: string;
  anniv2?: string;
  anniv3?: string;
  anniv4?: string;
  anniv5?: string;
}

// パース済みの記念日データ
export interface AnniversaryData {
  id: number;
  mmdd: string;
  anniversaries: string[];
}

// 既存の型はそのまま維持
export interface AnniversaryResponse {
  date: string;
  anniversary: string;
}

export interface AllDataResponse {
  total: number;
  data: Record<string, AnniversaryData>;
}

export interface SearchResponse {
  query: string;
  results: AnniversaryData[];
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
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
  message: string;
}

export interface AppConfig {
  port: number;
  dataFilePath: string;
  corsOrigin: string;
}

