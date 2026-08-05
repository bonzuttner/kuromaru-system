import type { DeliveryInfo, ManualRow, Masters, Product, RetailerData, RetailerRow, Sheet, SheetCat, Store } from '../types';
import { CIRC } from '../types';

export function pById(masters: Masters, id: string): Product {
  return masters.products.find((p) => p.id === id) || { id, name: id, cat: '', maker: '', jan: '' };
}

export function storesSorted(masters: Masters): Store[] {
  return [...masters.stores].sort((a, b) => a.code.localeCompare(b.code));
}

export function storesForSheet(masters: Masters, sheet: Pick<Sheet, 'storeOrder'> | undefined): Store[] {
  const sorted = storesSorted(masters);
  const byCode = new Map(sorted.map((st) => [st.code, st]));
  const ordered: Store[] = [];
  (sheet?.storeOrder || []).forEach((code) => {
    const st = byCode.get(code);
    if (!st) return;
    ordered.push(st);
    byCode.delete(code);
  });
  return ordered.concat(sorted.filter((st) => byCode.has(st.code)));
}

// Products marked to ship for a given category at a given unit count `u`.
export function prodsForUnit(c: SheetCat, u: number | undefined): string[] {
  if (c.useShelf === false) return [];
  if (!u) return [];
  const n = (c.unitCount || {})[u] || 0;
  return n ? (c.countProducts || {})[n] || [] : [];
}

export function cell(c: SheetCat, pid: string, u: number | undefined): boolean {
  return prodsForUnit(c, u).includes(pid);
}

export function markedManual(manual: Record<string, ManualRow> | undefined, code: string, pid: string): boolean {
  const row = manual?.[code];
  return !!(row && row.marks && row.marks[pid]);
}

export function cellAny(sheet: Sheet, c: SheetCat, pid: string, code: string): boolean {
  const u = sheet.units[code];
  if (u) return cell(c, pid, u);
  return markedManual(sheet.manual, code, pid);
}

export function cntFor(sheet: Sheet, masters: Masters, c: SheetCat, pid: string): number {
  const hidden = sheet.hiddenStores || {};
  return storesSorted(masters).filter((st) => !hidden[st.code] && cellAny(sheet, c, pid, st.code)).length;
}

export function fmtYMD(s: string | undefined): string {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec((s || '').trim());
  return m ? m[1] + m[2].padStart(2, '0') + m[3].padStart(2, '0') : '';
}

export interface ShipRow {
  st: Store;
  p: Product;
  circ: string;
  cat: string;
  sheetName: string;
  arrival: string;
  jan: string;
}

export function buildShipRows(masters: Masters, sheets: Sheet[]): ShipRow[] {
  const rows: ShipRow[] = [];
  sheets.forEach((sh) => {
    const stores = storesForSheet(masters, sh);
    sh.cats.forEach((c) => {
      c.productIds.forEach((pid, pi) => {
        const p = pById(masters, pid);
        const dl: DeliveryInfo = sh.delivery[pid] || {};
        stores.forEach((st) => {
          const u = sh.units[st.code];
          let ok: boolean;
          if (u) {
            const n = (c.unitCount || {})[u] || 0;
            ok = n > 0 && ((c.countProducts || {})[n] || []).includes(pid);
          } else {
            const mrow = (sh.manual || {})[st.code];
            ok = !!(mrow && mrow.marks && mrow.marks[pid]);
          }
          if (!ok) return;
          rows.push({ st, p, circ: CIRC[pi], cat: c.name, sheetName: sh.name, arrival: dl.arrival || '', jan: dl.jan || p.jan || '' });
        });
      });
    });
  });
  return rows;
}

export function syonmFor(row: ShipRow, event: string): string {
  return row.p.id + (event || '販促POP') + ' ' + row.cat + row.circ + row.p.name;
}

export type CsvValues = Record<string, string>;

export function valuesFor(retailer: RetailerRow, row: ShipRow, i: number, denymd: string): CsvValues {
  const st = row.st;
  const ship = retailer.ship;
  return {
    MKCD: retailer.mkcd || '999',
    DATC: ship.datc || '2',
    DENYMD: denymd,
    DENNO: String(i + 1),
    GYONO: ship.gyono || '1',
    TOKCD: ship.tokcd || '',
    TOKNM: retailer.toknm || retailer.name,
    TOKBNM: retailer.dept || '',
    TKPOST: retailer.zip || '',
    TKTEL: retailer.tel || '',
    TKFAX: retailer.fax || '',
    TKADD1: retailer.addr || '',
    TKADD2: '',
    TKADD3: '',
    HAICD_1: '0',
    HAICD_2: st.haicd || '0',
    HAINM: st.name,
    HAIBNM: st.dept || '',
    HAPOST: st.zip || '',
    HATEL: st.tel || '',
    HAFAX: st.fax || '',
    HAIADD1: st.addr || '',
    HAIADD2: '',
    HAIADD3: '',
    SYOCD1: row.p.id,
    SYOCD2: '',
    SYONM: syonmFor(row, ship.event),
    JAN: row.jan,
    ITF: '',
    IRISU: '',
    PRICE: '',
    GENKA: '',
    SKSU: '1',
    SYUYMD: fmtYMD(row.arrival),
    MKNM: ship.mknm || '',
    CR: 'CR',
  };
}

export function toggleCatInSheet(d: RetailerData, sheetIdx: number, catName: string) {
  const sh = d.sheets[sheetIdx];
  const ix = sh.cats.findIndex((c) => c.name === catName);
  if (ix >= 0) {
    sh.cats[ix].productIds.forEach((pid) => delete sh.delivery[pid]);
    sh.cats.splice(ix, 1);
  } else {
    const pids = d.masters.products.filter((p) => p.cat === catName).map((p) => p.id);
    const n = pids.length;
    const unitCount: Record<string, number> = {};
    (sh.unitOptions || [4, 5, 6, 7, 8]).forEach((u) => (unitCount[u] = n));
    const countProducts: Record<string, string[]> = {};
    countProducts[n] = pids.slice();
    sh.cats.push({ name: catName, productIds: pids, unitCount, countProducts });
    pids.forEach((pid) => {
      if (!sh.delivery[pid]) sh.delivery[pid] = { cd: '', jan: '', deadline: '', arrival: '', rounder: '', band: '', doukon: '' };
    });
  }
}

export function toggleProdInSheet(d: RetailerData, sheetIdx: number, catName: string, pid: string) {
  const sh = d.sheets[sheetIdx];
  const c = sh.cats.find((x) => x.name === catName);
  if (!c) return;
  const masterIds = d.masters.products.filter((p) => p.cat === catName).map((p) => p.id);
  const set = new Set(c.productIds);
  if (set.has(pid)) {
    set.delete(pid);
    delete sh.delivery[pid];
  } else {
    set.add(pid);
    if (!sh.delivery[pid]) sh.delivery[pid] = { cd: '', jan: '', deadline: '', arrival: '', rounder: '', band: '', doukon: '' };
  }
  c.productIds = masterIds.filter((id) => set.has(id));
  if (!c.countProducts) c.countProducts = {};
  Object.keys(c.countProducts).forEach((k) => {
    c.countProducts[k] = c.productIds.filter((id) => c.countProducts[k].includes(id));
  });
}

export const CSV_COL_SOURCES: Record<string, string> = {
  MKCD: '小売店マスタ・固定', DATC: 'この画面で入力', DENYMD: 'この画面で入力', DENNO: '自動連番', GYONO: 'この画面で入力', TOKCD: 'この画面で入力',
  TOKNM: '小売店マスタ・得意先名', TOKBNM: '小売店マスタ・部署名', TKPOST: '小売店マスタ・郵便番号', TKTEL: '小売店マスタ・電話番号', TKFAX: '小売店マスタ・FAX',
  TKADD1: '小売店マスタ・住所1', TKADD2: '空欄固定', TKADD3: '空欄固定',
  HAICD_1: '固定値 0', HAICD_2: '店舗マスタ', HAINM: '店舗マスタ', HAIBNM: '店舗マスタ', HAPOST: '店舗マスタ', HATEL: '店舗マスタ', HAFAX: '店舗マスタ',
  HAIADD1: '店舗マスタ', HAIADD2: '空欄固定', HAIADD3: '空欄固定',
  SYOCD1: '商品マスタ', SYOCD2: '空欄固定', SYONM: '商品名+イベント名等 連結', JAN: '商品マスタ/配送情報', ITF: '空欄固定', IRISU: '空欄固定', PRICE: '空欄固定',
  GENKA: '空欄固定', SKSU: '固定値 1', SYUYMD: '黒丸表の配送情報「店舗着」', MKNM: 'この画面で入力', CR: '固定値 CR',
};
