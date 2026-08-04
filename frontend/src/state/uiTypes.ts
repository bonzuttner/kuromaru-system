import type { CsvImportState, MasterTab, ModalKind, UnitImgTarget, ViewKind } from '../types';

export interface NewSheetForm {
  name: string;
  mode: 'dup' | 'template' | 'blank';
  tplId: string;
}

export interface ProductForm {
  id: string;
  name: string;
  cat: string;
  maker: string;
  jan: string;
}

export interface StoreForm {
  code: string;
  name: string;
  zip: string;
  addr: string;
  tel: string;
}

export interface UiState {
  view: ViewKind;
  mtab: MasterTab;
  sheetIdx: number;
  modal: ModalKind;
  csv: CsvImportState | null;
  detailAll: boolean;
  masterMenuOpen: boolean;
  hoverCell: { ri: number; ci: number } | null;
  ns: NewSheetForm;
  pf: ProductForm;
  nf: StoreForm;
  nc: string;
  nr: string;
  shelfNewVar: Record<string, string>;
  shelfNewUnit: string;
  csvColsOpen: boolean;
  storeSearch: string;
  productSearch: string;
  unitImgStore: UnitImgTarget | null;
  unitImgFile: File | null;
  unitImgPreviewUrl: string;
  renamingSheet: boolean;
  renameValue: string;
}

export function initialUiState(): UiState {
  return {
    view: 'sheet',
    mtab: 'stores',
    sheetIdx: 0,
    modal: null,
    csv: null,
    detailAll: false,
    masterMenuOpen: false,
    hoverCell: null,
    ns: { name: '', mode: 'dup', tplId: '' },
    pf: { id: '', name: '', cat: '', maker: '', jan: '' },
    nf: { code: '', name: '', zip: '', addr: '', tel: '' },
    nc: '',
    nr: '',
    shelfNewVar: {},
    shelfNewUnit: '',
    csvColsOpen: false,
    storeSearch: '',
    productSearch: '',
    unitImgStore: null,
    unitImgFile: null,
    unitImgPreviewUrl: '',
    renamingSheet: false,
    renameValue: '',
  };
}
