export class DateUtils {
  /**
   * 今日の日付をMM-DD形式で取得
   */
  static getTodayKey(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
   * 日付文字列のバリデーション
   */
  static isValidDateKey(dateKey: string): boolean {
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    return regex.test(dateKey);
  }

  /**
   * 日付文字列の正規化
   */
  static normalizeDateKey(dateInput: string): string | null {
    // YYYY-MM-DD形式からMM-DD形式に変換
    if (dateInput.length === 10 && dateInput.includes('-')) {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}`;
      }
    }

    // MM-DD形式の場合はそのまま
    if (this.isValidDateKey(dateInput)) {
      return dateInput;
    }

    return null;
  }
}

