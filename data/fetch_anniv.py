#!/usr/bin/env python3
import requests
import csv
import json
import time
from datetime import date, timedelta
from typing import Dict, List

class AnniversaryFetcher:
    def __init__(self, delay: float = 1.0):
        self.base_url = "https://api.whatistoday.cyou/index.cgi/v3/anniv"
        self.delay = delay  # リクエスト間隔（秒）
        self.data: Dict[str, str] = {}
        self.errors: List[str] = []
        self.success_count = 0
    
    def extract_anniversary_text(self, response) -> str:
        """APIレスポンスから記念日テキストを抽出"""
        try:
            # まずJSONとして解析を試行
            json_data = response.json()
            
            # 一般的なJSONパターンに対応
            if isinstance(json_data, list):
                # リスト形式の場合
                names = [str(item) for item in json_data if item]
                return '、'.join(names)
            
            elif isinstance(json_data, dict):
                # 辞書形式の場合、一般的なキーを確認
                for key in ['events', 'data', 'anniv', 'anniversaries', 'items']:
                    if key in json_data:
                        items = json_data[key]
                        if isinstance(items, list):
                            names = [str(item) for item in items if item]
                            return '、'.join(names)
                        else:
                            return str(items)
                
                # 特定のキーがない場合は全体を文字列化
                return json.dumps(json_data, ensure_ascii=False)
            
            else:
                return str(json_data)
                
        except json.JSONDecodeError:
            # JSONでない場合はテキストとして扱う
            return response.text.strip()
        except Exception as e:
            print(f"データ抽出エラー: {e}")
            return response.text.strip()
    
    def fetch_single_date(self, month: int, day: int) -> bool:
        """指定日のデータを取得"""
        mmdd = f"{month:02d}{day:02d}"
        date_key = f"{month:02d}-{day:02d}"
        url = f"{self.base_url}/{mmdd}"
        
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            
            anniversary_text = self.extract_anniversary_text(response)
            self.data[date_key] = anniversary_text
            
            # 進捗表示（文字数制限）
            display_text = anniversary_text[:50] + "..." if len(anniversary_text) > 50 else anniversary_text
            print(f"✓ {date_key}: {display_text}")
            self.success_count += 1
            return True
            
        except requests.exceptions.RequestException as e:
            error_msg = f"{date_key}: {str(e)}"
            self.errors.append(error_msg)
            self.data[date_key] = ""
            print(f"✗ {error_msg}")
            return False
    
    def fetch_all_365_days(self):
        """365日分のデータを取得"""
        print("=== 365日分記念日データ取得開始 ===")
        print(f"リクエスト間隔: {self.delay}秒")
        print(f"予想所要時間: 約{int(365 * self.delay / 60)}分")
        print("※ 外部APIへの配慮として適切な間隔でアクセスします\n")
        
        start_date = date(2024, 1, 1)
        current_date = start_date
        
        for i in range(365):
            self.fetch_single_date(current_date.month, current_date.day)
            
            # 進捗表示
            if (i + 1) % 30 == 0:
                progress = ((i + 1) / 365) * 100
                print(f"\n--- 進捗: {i + 1}/365 ({progress:.1f}%) ---")
                print(f"成功: {self.success_count}, エラー: {len(self.errors)}\n")
            
            # 次の日付へ
            current_date += timedelta(days=1)
            
            # うるう年の2月29日をスキップ
            if current_date.month == 2 and current_date.day == 29:
                current_date += timedelta(days=1)
            
            # サーバ負荷軽減のための待機
            if i < 364:
                time.sleep(self.delay)
        
        print(f"\n=== 取得完了 ===")
        print(f"成功: {self.success_count}/365")
        print(f"エラー: {len(self.errors)}")
        
        if self.errors:
            print(f"\nエラー詳細（最初の3件）:")
            for error in self.errors[:3]:
                print(f"  - {error}")
    
    def save_to_csv(self, filename: str = 'anniversaries.csv'):
        """CSVファイルに保存"""
        try:
            with open(filename, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'name'])
                
                for date_key in sorted(self.data.keys()):
                    writer.writerow([date_key, self.data[date_key]])
            
            print(f"✓ CSVファイル保存: {filename}")
            
        except IOError as e:
            print(f"✗ CSV保存エラー: {e}")
    
    def save_to_json(self, filename: str = 'anniversaries.json'):
        """JSONファイルに保存（サーバ用）"""
        try:
            sorted_data = dict(sorted(self.data.items()))
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(sorted_data, f, ensure_ascii=False, indent=2)
            
            print(f"✓ JSONファイル保存: {filename}")
            
        except IOError as e:
            print(f"✗ JSON保存エラー: {e}")
    
    def print_statistics(self):
        """統計情報を表示"""
        total = len(self.data)
        with_data = sum(1 for v in self.data.values() if v.strip())
        
        print(f"\n=== 統計情報 ===")
        print(f"総日数: {total}日")
        print(f"データ取得成功: {with_data}日")
        print(f"データなし: {total - with_data}日")
        print(f"取得率: {(with_data/total*100):.1f}%")
    
    def show_sample(self, count: int = 10):
        """サンプルデータを表示"""
        print(f"\n=== サンプルデータ（最初の{count}件）===")
        for i, (date_key, name) in enumerate(sorted(self.data.items())[:count]):
            display = name[:80] + "..." if len(name) > 80 else name
            print(f"{date_key}: {display}")

def main():
    print("=== 365日分記念日データ取得ツール ===")
    print("※ 外部APIを利用します。利用規約を遵守し、適切な間隔でアクセスします。\n")
    
    # フェッチャーを初期化
    fetcher = AnniversaryFetcher(delay=1.0)
    
    # データ取得実行
    fetcher.fetch_all_365_days()
    
    # 結果表示
    fetcher.print_statistics()
    fetcher.show_sample(15)
    
    # ファイル保存
    fetcher.save_to_csv()
    fetcher.save_to_json()
    
    print("\n✓ 処理完了しました！")
    print("生成されたファイル:")
    print("  - anniversaries.csv (CSV形式)")
    print("  - anniversaries.json (JSON形式)")

if __name__ == '__main__':
    main()

