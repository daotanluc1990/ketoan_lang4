import {
  normalizeText,
  pickNumber,
  pickText,
  toIsoDate,
  type DataRow,
} from "./row-normalizers";

export type WeekComparison = {
  currentWeekCode?: string;
  previousWeekCode?: string;
  currentRows: DataRow[];
  previousRows: DataRow[];
};

export function previousIsoWeekCode(weekCode?: string) {
  const match = String(weekCode ?? "").match(/^(\d{4})-W(\d{1,2})$/i);
  if (!match) return undefined;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return undefined;
  if (week > 1) return `${year}-W${String(week - 1).padStart(2, "0")}`;
  return `${year - 1}-W52`;
}

export function filterRowsByWeek(rows: DataRow[], weekCode?: string) {
  if (!weekCode) return [];
  const target = normalizeText(weekCode);
  return rows.filter((row) =>
    normalizeText(pickText(row, ["Mã tuần", "Tuần"])).includes(target),
  );
}

export function buildWeekComparison(
  rows: DataRow[],
  weekCode?: string,
): WeekComparison {
  const previousWeek = previousIsoWeekCode(weekCode);
  return {
    currentWeekCode: weekCode,
    previousWeekCode: previousWeek,
    currentRows: filterRowsByWeek(rows, weekCode),
    previousRows: filterRowsByWeek(rows, previousWeek),
  };
}

export function sumPositive(rows: DataRow[], columns: string[]) {
  return rows.reduce((total, row) => {
    const amount = pickNumber(row, columns);
    return amount > 0 ? total + amount : total;
  }, 0);
}

export function sumNegativeAbs(rows: DataRow[], columns: string[]) {
  return Math.abs(
    rows.reduce((total, row) => {
      const amount = pickNumber(row, columns);
      return amount < 0 ? total + amount : total;
    }, 0),
  );
}

export function formatDelta(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "—";
  const delta = current - previous;
  if (!previous) return current ? "Mới phát sinh" : "—";
  const ratio = delta / Math.abs(previous);
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Math.round(delta).toLocaleString("vi-VN")}đ (${sign}${(ratio * 100).toFixed(1).replace(".", ",")}%)`;
}

export function groupCashbookByWeek(rows: DataRow[]) {
  const map = new Map<
    string,
    {
      cashIn: number;
      cashOut: number;
      rows: number;
      from?: string;
      to?: string;
    }
  >();
  for (const row of rows) {
    const week = pickText(row, ["Mã tuần", "Tuần"]) || "Chưa rõ tuần";
    const amount = pickNumber(row, ["Số tiền", "Giá trị"]);
    const item = map.get(week) ?? { cashIn: 0, cashOut: 0, rows: 0 };
    if (amount >= 0) item.cashIn += amount;
    if (amount < 0) item.cashOut += Math.abs(amount);
    item.rows += 1;
    const date = toIsoDate(pickText(row, ["Ngày"]));
    if (date && (!item.from || date < item.from)) item.from = date;
    if (date && (!item.to || date > item.to)) item.to = date;
    map.set(week, item);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, item]) => ({
      week,
      ...item,
      cashNet: item.cashIn - item.cashOut,
    }));
}
