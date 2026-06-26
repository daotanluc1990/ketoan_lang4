export type DataRow = Record<string, unknown>;

export type DataStore = {
  read(sheetName: string): Promise<DataRow[]>;
  readMany?(sheetNames: string[]): Promise<Record<string, DataRow[]>>;
  append(sheetName: string, rows: DataRow[]): Promise<void>;
  replace(sheetName: string, rows: DataRow[]): Promise<void>;
};
