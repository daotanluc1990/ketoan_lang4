export type DataRow = Record<string, unknown>;

export type DataStore = {
  read(sheetName: string): Promise<DataRow[]>;
  append(sheetName: string, rows: DataRow[]): Promise<void>;
  replace(sheetName: string, rows: DataRow[]): Promise<void>;
};
