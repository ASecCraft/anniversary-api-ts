import * as fs from 'fs';
import { AnniversaryRawData, AnniversaryData } from '../types';

export class JsonLoader {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * JSONファイルを読み込み、パースしたデータを返す
   */
  load(): Record<string, AnniversaryData> {
    const rawContent = fs.readFileSync(this.filePath, 'utf-8');
    const rawData: Record<string, string> = JSON.parse(rawContent);
    
    const result: Record<string, AnniversaryData> = {};

    for (const [key, value] of Object.entries(rawData)) {
      // value は JSON文字列なのでパースする
      const parsed: AnniversaryRawData = JSON.parse(value);
      
      // anniv1〜anniv5 を配列にまとめる
      const anniversaries: string[] = [];
      if (parsed.anniv1) anniversaries.push(parsed.anniv1);
      if (parsed.anniv2) anniversaries.push(parsed.anniv2);
      if (parsed.anniv3) anniversaries.push(parsed.anniv3);
      if (parsed.anniv4) anniversaries.push(parsed.anniv4);
      if (parsed.anniv5) anniversaries.push(parsed.anniv5);

      // キーを正規化 ("01-01" -> "0101" に統一)
      const normalizedKey = key.replace('-', '');

      result[normalizedKey] = {
        id: parsed.id,
        mmdd: parsed.mmdd,
        anniversaries
      };
    }

    return result;
  }

  /**
   * 特定日付のanniv1を取得
   */
  getAnniv1(data: Record<string, AnniversaryData>, mmdd: string): string | null {
    const normalizedKey = mmdd.replace('-', '');
    const entry = data[normalizedKey];
    return entry?.anniversaries[0] ?? null;
  }
}

