export class DateUtils {
  /**
   * DateオブジェクトからMMDD形式の文字列を生成
   */
  static formatMMDD(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}${day}`;
  }

  /**
   * MMDD形式のバリデーション
   */
  static isValidMMDD(mmdd: string): boolean {
    if (!/^\d{4}$/.test(mmdd)) {
      return false;
    }

    const month = parseInt(mmdd.substring(0, 2), 10);
    const day = parseInt(mmdd.substring(2, 4), 10);

    if (month < 1 || month > 12) {
      return false;
    }

    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > daysInMonth[month - 1]) {
      return false;
    }

    return true;
  }
}

