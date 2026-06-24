import type { Status } from '@/lib/report-types';

export type DataStatus = 'complete' | 'partial' | 'missing' | 'needs_review';

export type FormulaEvidence = {
  metric: string;
  source: string;
  rowCount: number;
  formula: string;
  period: string;
  status: DataStatus;
  note: string;
};

export type FinanceKpi = {
  label: string;
  value: number | null;
  formatted: string;
  status: Status;
  evidence: FormulaEvidence;
};

export type FinanceCalculationResult = {
  rows: string[][];
  evidenceRows: string[][];
  limitations: string[];
  status: DataStatus;
};

export type PnlCalculationResult = FinanceCalculationResult & {
  totals: {
    revenue: number;
    storeSales: number;
    appNet: number;
    appGross: number;
    appFees: number;
    appCogs: number;
    knownCogs: number;
    operatingExpenses: number;
    excludedCashOut: number;
    grossProfit: number | null;
    netProfit: number | null;
    appFeePercent: number;
    cogsPercent: number | null;
  };
};

export type BalanceCalculationResult = FinanceCalculationResult & {
  totals: {
    cashNet: number;
    inventoryValue: number;
    negativeStockCount: number;
    payable: number;
    paidDebt: number;
    remainingDebt: number;
    capexOut: number;
    debtPaymentOut: number;
  };
};

export type LossCalculationResult = FinanceCalculationResult & {
  topRows: string[][];
  totalLossValue: number;
  dangerousCount: number;
};
