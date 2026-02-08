import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { JsonLoader } from './utils/jsonLoader';
import { DateUtils } from './utils/dateUtils';
import {
  AnniversaryResponse,
  AnniversaryData,
  AllDataResponse,
  SearchResponse,
  HealthResponse,
  ApiInfoResponse,
  ErrorResponse,
  AppConfig
} from './types';

class AnniversaryServer {
  private app: express.Application;
  private jsonLoader: JsonLoader;
  private anniversaryData: Record<string, AnniversaryData> = {};
  private startTime: number;
  private config: AppConfig;

  constructor() {
    this.app = express();
    this.startTime = Date.now();

    // 設定
    this.config = {
      port: parseInt(process.env.PORT || '5000'),
      dataFilePath: path.join(__dirname, '../data/anniversaries.json'),
      corsOrigin: process.env.CORS_ORIGIN || '*'
    };

    this.jsonLoader = new JsonLoader(this.config.dataFilePath);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: this.config.corsOrigin,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json({ limit: '10mb' }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // API情報
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiInfoResponse = {
        name: 'Anniversary API',
        version: '2.0.0',
        description: 'TypeScript製365日記念日API（JSON版）',
        total_records: Object.keys(this.anniversaryData).length,
        endpoints: {
          'GET /': 'API情報',
          'GET /api/health': 'ヘルスチェック',
          'GET /api/today': '今日の記念日',
          'GET /api/date/:mmdd': '特定日付の記念日（例: /api/date/0101）',
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
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString()
      };
      res.json(response);
    });

    // 今日の記念日
    this.app.get('/api/today', (req: Request, res: Response) => {
      const today = new Date();
      const mmdd = DateUtils.formatMMDD(today);
      const data = this.anniversaryData[mmdd];

      if (!data) {
        const errorResponse: ErrorResponse = {
          error: 'Not Found',
          message: `今日(${mmdd})の記念日データが見つかりません`
        };
        return res.status(404).json(errorResponse);
      }

      const response: AnniversaryResponse = {
        date: mmdd,
        anniversary: data.anniversaries[0] // anniv1を返す
      };
      res.json(response);
    });

// 特定日付の記念日
this.app.get('/api/date/:mmdd', (req: Request, res: Response) => {
  const mmdd = req.params.mmdd as string;  // ← as string を追加
  
  // 入力形式を正規化
  const normalizedKey = mmdd.replace('-', '');
      

      // バリデーション
      if (!DateUtils.isValidMMDD(normalizedKey)) {
        const errorResponse: ErrorResponse = {
          error: 'Bad Request',
          message: '日付形式が不正です。MMDD または MM-DD 形式で指定してください（例: 0101 or 01-01）'
        };
        return res.status(400).json(errorResponse);
      }

      const data = this.anniversaryData[normalizedKey];

      if (!data) {
        const errorResponse: ErrorResponse = {
          error: 'Not Found',
          message: `${mmdd}の記念日データが見つかりません`
        };
        return res.status(404).json(errorResponse);
      }

      const response: AnniversaryResponse = {
        date: normalizedKey,
        anniversary: data.anniversaries[0] // anniv1を返す
      };
      res.json(response);
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
      const query = (req.query.q as string) || '';

      if (!query.trim()) {
        const errorResponse: ErrorResponse = {
          error: 'Bad Request',
          message: '検索キーワードを指定してください（例: /api/search?q=記念日）'
        };
        return res.status(400).json(errorResponse);
      }

      const results = Object.values(this.anniversaryData).filter(item =>
        item.anniversaries.some(anniv => anniv.includes(query))
      );

      const response: SearchResponse = {
        query,
        results
      };
      res.json(response);
    });

    // データ再読み込み
    this.app.post('/api/reload', async (req: Request, res: Response) => {
      try {
        await this.loadData();
        res.json({
          success: true,
          message: 'データを再読み込みしました',
          total_records: Object.keys(this.anniversaryData).length
        });
      } catch (error) {
        const errorResponse: ErrorResponse = {
          error: 'Internal Server Error',
          message: 'データの再読み込みに失敗しました'
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
        message: `エンドポイント ${req.path} は存在しません`
      };
      res.status(404).json(errorResponse);
    });

    // エラーハンドラー
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: err.message || 'サーバーエラーが発生しました'
      };
      res.status(500).json(errorResponse);
    });
  }

  private async loadData(): Promise<void> {
    console.log('JSONデータを読み込み中...');
    this.anniversaryData = this.jsonLoader.load();
    console.log(`${Object.keys(this.anniversaryData).length}件のデータを読み込みました`);
  }

  public async start(): Promise<void> {
    await this.loadData();
    
    this.app.listen(this.config.port, () => {
      console.log(`🚀 Anniversary API Server running on port ${this.config.port}`);
      console.log(`📅 Total records: ${Object.keys(this.anniversaryData).length}`);
    });
  }
}

// サーバー起動
const server = new AnniversaryServer();
server.start().catch(console.error);

