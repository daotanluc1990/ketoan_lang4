export type ImportRowStatus = 'Dòng mới' | 'Dữ liệu trùng' | 'Dữ liệu lệch' | 'Dòng lỗi';

export type ImportRow = {
  maDongDuLieu: string;
  dauVetDong: string;
  sheetDich: string;
  data: Record<string, unknown>;
  status?: ImportRowStatus;
  errors?: string[];
};

export type ImportPreviewResult = {
  maLanImport: string;
  loaiDuLieu: string;
  chiNhanh: string;
  tenFile: string;
  dauVetFile: string;
  rows: ImportRow[];
  summary: {
    dongMoi: number;
    duLieuTrung: number;
    duLieuLech: number;
    dongLoi: number;
  };
};
