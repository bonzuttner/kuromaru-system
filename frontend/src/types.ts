export interface ShipInfo {
  datc: string;
  denymd: string;
  gyono: string;
  tokcd: string;
  event: string;
  mknm: string;
}

export interface CsvCol {
  key: string;
  on: boolean;
  custom?: boolean;
  placeholderKey?: string;
  sourceKey?: string;
}

export interface RetailerRow {
  id: string;
  name: string;
  toknm: string;
  dept: string;
  mkcd: string;
  zip: string;
  tel: string;
  fax: string;
  addr: string;
  ship: ShipInfo;
  csvCols: CsvCol[];
}

export interface Store {
  code: string;
  name: string;
  zip: string;
  addr: string;
  tel: string;
  fax: string;
  haicd: string;
  dept: string;
  area: string;
  bl: string;
}

export interface Category {
  name: string;
}

export interface Product {
  id: string;
  name: string;
  cat: string;
  maker: string;
  jan: string;
}

export interface DeliveryInfo {
  cd?: string;
  jan?: string;
  deadline?: string;
  arrival?: string;
  rounder?: string;
  band?: string;
  doukon?: string;
  note?: string;
}

export interface SheetCat {
  name: string;
  productIds: string[];
  unitCount: Record<string, number>;
  countProducts: Record<string, string[]>;
  images?: Record<string, string>;
  useShelf?: boolean;
}

export interface ManualRow {
  expand: string;
  marks: Record<string, boolean>;
}

export interface Sheet {
  id: string;
  name: string;
  unitOptions: number[];
  cats: SheetCat[];
  delivery: Record<string, DeliveryInfo>;
  units: Record<string, number>;
  manual?: Record<string, ManualRow>;
  hiddenStores?: Record<string, boolean>;
  storeOrder?: string[];
}

export interface Template {
  id: string;
  name: string;
  sheet: Sheet;
}

export interface Masters {
  stores: Store[];
  categories: Category[];
  products: Product[];
}

export interface RetailerData {
  masters: Masters;
  sheets: Sheet[];
  templates: Template[];
  shelfImages: Record<string, string>;
  productThumbs: Record<string, string>;
}

export const DEFAULT_CSV_COLS: CsvCol[] = [
  'MKCD', 'DATC', 'DENYMD', 'DENNO', 'GYONO', 'TOKCD', 'TOKNM', 'TOKBNM', 'TKPOST', 'TKTEL', 'TKFAX',
  'TKADD1', 'TKADD2', 'TKADD3', 'HAICD_1', 'HAICD_2', 'HAINM', 'HAIBNM', 'HAPOST', 'HATEL', 'HAFAX',
  'HAIADD1', 'HAIADD2', 'HAIADD3', 'SYOCD1', 'SYOCD2', 'SYONM', 'JAN', 'ITF', 'IRISU', 'PRICE',
  'GENKA', 'SKSU', 'SYUYMD', 'MKNM', 'CR',
].map((key) => ({ key, on: true, placeholderKey: key, sourceKey: key }));

export const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];

export type ModalKind = 'products' | 'shelf' | 'delivery' | 'csv' | 'newsheet' | 'unitimg' | null;
export type ViewKind = 'sheet' | 'shiplist' | 'master';
export type MasterTab = 'retailers' | 'stores' | 'products';

export interface CsvImportState {
  type: 'units' | 'stores' | 'products';
  title: string;
  note: string;
  head: string[];
  fileName: string;
  rows: { cells: string[]; err: string }[];
  errors: { t: string }[];
  parsed: unknown;
}

export interface UnitImgTarget {
  kind: 'count';
  cat: string;
  count: number;
  name: string;
}
