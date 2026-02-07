import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { CsvLoader } from './utils/csvLoader';
import { DateUtils } from './utils/dateUtils';
import {
  AnniversaryResponse,
  AllDataResponse,
  SearchResponse,
  HealthResponse,
  ApiInfoResponse,
  ErrorResponse,
  AppConfig
} from './types';

class AnniversaryServer {
  private app: express.Application;
  private csvLoader: CsvLoader;
  private anniversaryData: Record<string, string> = {};
  private startTime: number;
  private config: AppConfig;

  constructor() {
    this.app = express();
    this.startTime = Date.now();
    
    // 設定
    this.config = {
      port: parseInt(process.env.PORT || '5000'),
      csvFilePath: path.join(__dirname, '../data/anniversaries.csv'),
      corsOrigin: process.env.CORS_ORIGIN || '*'
    };

    this.csvLoader = new CsvLoader(this.config.csvFilePath);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS設定
    this.app.use(cors({
      origin: this.config.corsOrigin,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSON解析
    this.app.use(express.json({ limit: '10mb' }));

    // リクエストログ
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // ルートエンドポイント - API情報
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiInfoResponse = {
        name: 'Anniversary API',
        version: '1.0.0',
        description: 'TypeScript製365日記念日API',
        total_records: Object.keys(this.anniversaryData).length,
        endpoints: {
          'GET /': 'API情報',
          'GET /api/health': 'ヘルスチェック',
          'GET /api/today': '今日の記念日',
          'GET /api/date/:date': '特定日付の記念日',
          'GET /api/all': '全データ取得',
          'GET /api/search?q=keyword': 'キーワード検索',
          'POST /api/reload': 'データ再読み込み'
        }
      };
      res.json(response);
    });

    // ヘルスチェック
    this.app.get('/api/health', (req: Request, res: Response) => {
      const response: HealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        records_loaded: Object.keys(this.anniversaryData).length,
        uptime: Date.now() - this.startTime
      };
      res.json(response);
    });

    // 今日の記念日
    this.app.get('/api/today', (req: Request, res: Response) => {
      const todayKey = DateUtils.getTodayKey();
      const name = this.anniversaryData[todayKey];

      const response: AnniversaryResponse = {
        date: todayKey,
        name: name || null,
        found: !!name
      };

      res.json(response);
    });

    // 特定日付の記念日
    this.app.get('/api/date/:date', (req: Request, res: Response) => {
      const dateInput = req.params.date;
      const normalizedDate = DateUtils.normalizeDateKey(dateInput);

      if (!normalizedDate) {
        const errorResponse: ErrorResponse = {
          error: 'Invalid date format',
          message: '日付はMM-DD形式またはYYYY-MM-DD形式で指定してください',
          timestamp: new Date().toISOString()
        };
        return res.status(400).json(errorResponse);
      }

      const name = this.anniversaryData[normalizedDate];
      const response: AnniversaryResponse = {
        date: normalizedDate,
        name: name || null,
        found: !!name
      };

      const statusCode = name ? 200 : 404;
      res.status(statusCode).json(response);
    });

    // 全データ取得
    this.app.get('/api/all', (req: Request, res: Response) => {
      const response: AllDataResponse = {
        total: Object.keys(this.anniversaryData).length,
        data: this.anniversaryData
      };
      res.json(response);
    });

    // キーワード検索
    this.app.get('/api/search', (req: Request, res: Response) => {
      const query = req.query.q as string;

      if (!query || typeof query !== 'string') {
        const errorResponse: ErrorResponse = {
          error: 'Missing query parameter',
          message: 'クエリパラメータ q が必要です',
          timestamp: new Date().toISOString()
        };
        return res.status(400).json(errorResponse);
      }

      const searchTerm = query.toLowerCase().trim();
      const results: Record<string, string> = {};

      Object.entries(this.anniversaryData).forEach(([date, name]) => {
        if (name && name.toLowerCase().includes(searchTerm)) {
          results[date] = name;
        }
      });

      const response: SearchResponse = {
        query: query,
        total: Object.keys(results).length,
        results: results
      };

      res.json(response);
    });

    // データ再読み込み
    this.app.post('/api/reload', async (req: Request, res: Response) => {
      try {
        await this.loadData();
        res.json({
          message: 'データを再読み込みしました',
          total_records: Object.keys(this.anniversaryData).length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorResponse: ErrorResponse = {
          error: 'Reload failed',
          message: error instanceof Error ? error.message : 'データの再読み込みに失敗しました',
          timestamp: new Date().toISOString()
        };
        res.status(500).json(errorResponse);
      }
    });
  }

  private setupErrorHandling(): void {
    // 404ハンドラー
    this.app.use((req: Request, res: Response) => {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: `エンドポイント ${req.method} ${req.path} が見つかりません`,
        timestamp: new Date().toISOString()
      };
      res.status(404).json(errorResponse);
    });

    // グローバルエラーハンドラー
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);
      
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: 'サーバ内部エラーが発生しました',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(errorResponse);
    });
  }

  async loadData(): Promise<void> {
    try {
      this.anniversaryData = await this.csvLoader.loadData();
      console.log(`✅ CSV読み込み完了: ${Object.keys(this.anniversaryData).length}件`);
    } catch (error) {
      console.error('❌ CSV読み込みエラー:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // データの初期読み込み
      await this.loadData();

      // サーバ起動
      this.app.listen(this.config.port, () => {
        console.log('='.repeat(60));
        console.log('🚀 Anniversary API Server (TypeScript)');
        console.log('='.repeat(60));
        console.log(`📍 Server URL: http://localhost:${this.config.port}`);
        console.log(`📊 Records loaded: ${Object.keys(this.anniversaryData).length}`);
        console.log(`📁 CSV file: ${this.config.csvFilePath}`);
        console.log('='.repeat(60));
      });
    } catch (error) {
      console.error('❌ サーバ起動エラー:', error);
      process.exit(1);
    }
  }
}

// サーバの起動
const server = new AnniversaryServer();
server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

