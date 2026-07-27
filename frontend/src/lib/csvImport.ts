import type { Masters, RetailerData, Sheet } from '../types';

export type CsvImportType = 'units' | 'stores' | 'products';

export const CSV_IMPORT_DEFS: Record<CsvImportType, { title: string; note: string; head: string[] }> = {
  units: {
    title: '単位CSV取込（この黒丸表のみ）',
    note: '形式: 店舗コード,店舗名称,4本,5本,6本,7本,8本 — 該当する単位の列にのみ「1」。複数列に1がある行・どの列にも1がない行・店舗マスタに無い店番はエラーとしてスキップします。',
    head: ['店舗コード', '店舗名称', '4本', '5本', '6本', '7本', '8本'],
  },
  stores: {
    title: '店舗マスタ CSV取込',
    note: '形式: 店番,店舗名称,郵便番号,住所,電話番号,FAX,配送先コード1,部署名,エリア,BL名 — 店番をキーに既存は上書き、新規は追加します（FAX以降は省略可）。',
    head: ['店番', '店舗名称', '郵便番号', '住所', '電話番号', 'FAX', '配送先コード1', '部署名', 'エリア', 'BL名'],
  },
  products: {
    title: '商品マスタ CSV取込',
    note: '形式: 商品コード,商品名,商品カテゴリ,製造業者,JANコード — 商品コードをキーに既存は上書き、新規は追加。未登録カテゴリは自動作成します。',
    head: ['商品コード', '商品名', '商品カテゴリ', '製造業者', 'JANコード'],
  },
};

export function makeCsvImportState(type: CsvImportType) {
  const d = CSV_IMPORT_DEFS[type];
  return { type, title: d.title, note: d.note, head: d.head, fileName: 'ファイル未選択', rows: [], errors: [], parsed: null };
}

export interface CsvPreviewRow {
  cells: string[];
  err: string;
}

export function processCsvRows(type: CsvImportType, masters: Masters, rows: string[][]) {
  let body = rows;
  if (body.length && body[0].some((c) => /店番|店舗コード|商品コード|商品ID/.test(c))) body = body.slice(1);

  const prev: CsvPreviewRow[] = [];
  const errors: { t: string }[] = [];

  if (type === 'units') {
    const parsed: Record<string, number> = {};
    body.forEach((r, li) => {
      const code = (r[0] || '').padStart(4, '0');
      const flags = [0, 1, 2, 3, 4].map((i) => String(r[i + 2] || ''));
      const ones = flags.map((f, i) => (f === '1' ? i : -1)).filter((i) => i >= 0);
      let err = '';
      if (!masters.stores.some((s) => s.code === code)) err = '店舗マスタに無い店番';
      else if (ones.length > 1) err = '複数の単位列に「1」';
      else if (ones.length === 0) err = '単位列に「1」がない';
      if (!err) parsed[code] = ones[0] + 4;
      prev.push({ cells: [code, r[1] || '', ...flags], err });
      if (err) errors.push({ t: li + 2 + '行目（店番 ' + code + '）: ' + err });
    });
    return { rows: prev, errors, parsed };
  }

  if (type === 'stores') {
    const parsed: { code: string; name: string; zip: string; addr: string; tel: string; fax: string; haicd: string; dept: string; area: string; bl: string }[] = [];
    body.forEach((r, li) => {
      const code = (r[0] || '').padStart(4, '0');
      let err = '';
      if (!r[0] || !r[1]) err = '店番または店舗名称が空';
      if (!err) parsed.push({ code, name: r[1] || '', zip: r[2] || '', addr: r[3] || '', tel: r[4] || '', fax: r[5] || '', haicd: r[6] || '0', dept: r[7] || '', area: r[8] || '', bl: r[9] || '' });
      prev.push({ cells: [code, r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || '', r[7] || '', r[8] || '', r[9] || ''], err });
      if (err) errors.push({ t: li + 2 + '行目: ' + err });
    });
    return { rows: prev, errors, parsed };
  }

  const parsed: { id: string; name: string; cat: string; maker: string; jan: string }[] = [];
  body.forEach((r, li) => {
    let err = '';
    if (!r[0] || !r[1]) err = '商品コードまたは商品名が空';
    if (!err) parsed.push({ id: r[0], name: r[1], cat: r[2] || '未分類', maker: r[3] || '', jan: r[4] || '' });
    prev.push({ cells: [r[0] || '', r[1] || '', r[2] || '', r[3] || '', r[4] || ''], err });
    if (err) errors.push({ t: li + 2 + '行目: ' + err });
  });
  return { rows: prev, errors, parsed };
}

export function applyCsvImport(type: CsvImportType, d: RetailerData, sheetIdx: number, parsed: unknown) {
  if (type === 'units') {
    Object.assign(d.sheets[sheetIdx].units, parsed as Record<string, number>);
  } else if (type === 'stores') {
    (parsed as Masters['stores']).forEach((row) => {
      const i = d.masters.stores.findIndex((x) => x.code === row.code);
      if (i >= 0) d.masters.stores[i] = row;
      else d.masters.stores.push(row);
    });
  } else {
    (parsed as Masters['products']).forEach((row) => {
      if (!d.masters.categories.some((c) => c.name === row.cat)) d.masters.categories.push({ name: row.cat });
      const i = d.masters.products.findIndex((x) => x.id === row.id);
      if (i >= 0) d.masters.products[i] = row;
      else d.masters.products.push(row);
    });
  }
}

export function csvTemplateFor(type: CsvImportType, masters: Masters, sheet: Sheet | undefined): { name: string; text: string } {
  if (type === 'units') {
    const lines = ['店舗コード,店舗名称,4本,5本,6本,7本,8本'];
    [...masters.stores].sort((a, b) => a.code.localeCompare(b.code)).forEach((st) => {
      const u = sheet?.units[st.code];
      const flags = [4, 5, 6, 7, 8].map((x) => (u === x ? '1' : ''));
      lines.push([st.code, st.name, ...flags].join(','));
    });
    return { name: '単位設定_雛形.csv', text: lines.join('\n') };
  }
  if (type === 'stores') {
    const lines = ['店番,店舗名称,郵便番号,住所,電話番号,FAX,配送先コード1,部署名,エリア,BL名'];
    masters.stores.forEach((s) => lines.push([s.code, s.name, s.zip, s.addr, s.tel, s.fax || '', s.haicd || '0', s.dept || '', s.area || '', s.bl || ''].join(',')));
    return { name: '店舗マスタ_雛形.csv', text: lines.join('\n') };
  }
  const lines = ['商品コード,商品名,商品カテゴリ,製造業者,JANコード'];
  masters.products.forEach((p) => lines.push([p.id, p.name, p.cat, p.maker, p.jan || ''].join(',')));
  return { name: '商品マスタ_雛形.csv', text: lines.join('\n') };
}
