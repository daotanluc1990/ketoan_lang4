import type { DataRow } from '@/lib/reports/row-normalizers';
import { classifyCashbookExpense } from '@/lib/reports/cashbook-analysis';
import { pickNumber } from '@/lib/reports/row-normalizers';

export type ExpenseBucket = 'operating' | 'debt_payment' | 'capex' | 'unclassified' | 'review';

export type ClassifiedCashExpense = {
  row: DataRow;
  amount: number;
  category: string;
  bucket: ExpenseBucket;
  reason: string;
};

export function bucketFromCategory(category: string): ExpenseBucket {
  if (category === 'Trả NCC/công nợ') return 'debt_payment';
  if (category === 'Đầu tư/Capex') return 'capex';
  if (category === 'Khác cần phân loại') return 'unclassified';
  if (['Nhân sự', 'Thuê mặt bằng', 'Sửa chữa/bảo trì'].includes(category)) return 'review';
  return 'operating';
}

export function classifyCashExpenses(rows: DataRow[]): ClassifiedCashExpense[] {
  return rows
    .map((row) => ({ row, rawAmount: pickNumber(row, ['Số tiền', 'Giá trị']) }))
    .filter(({ rawAmount }) => rawAmount < 0)
    .map(({ row, rawAmount }) => {
      const classified = classifyCashbookExpense(row);
      const bucket = bucketFromCategory(classified.category);
      return {
        row,
        amount: Math.abs(rawAmount),
        category: classified.category,
        bucket,
        reason: classified.action
      };
    });
}

export function sumExpenseBucket(items: ClassifiedCashExpense[], buckets: ExpenseBucket[]) {
  return items.filter((item) => buckets.includes(item.bucket)).reduce((total, item) => total + item.amount, 0);
}
