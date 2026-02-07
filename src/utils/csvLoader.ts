import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { CsvRow } from '../types';

export class CsvLoader {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async loadData(): Promise<Record<string, string>> {
    const data: Record<string, string> = {};

    if (!fs.existsSync(this.filePath)) {
      console.warn(`⚠️  CSV file not found: ${this.filePath}`);
      return data;
    }

    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      
      return new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          cast: true
        }, (err, records: CsvRow[]) => {
          if (err) {
            reject(new Error(`CSV parsing error: ${err.message}`));
            return;
          }

          records.forEach((row) => {
            if (row.date && typeof row.date === 'string') {
              const dateKey = row.date.trim();
              const name = row.name ? row.name.trim() : '';
              
              if (dateKey) {
                data[dateKey] = name;
              }
            }
          });

          resolve(data);
        });
      });
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  fileExists(): boolean {
    return fs.existsSync(this.filePath);
  }

  getFileStats() {
    if (!this.fileExists()) {
      return null;
    }

    const stats = fs.statSync(this.filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  }
}

