import { useMemo } from 'react';
import { useStore } from '../state/store';
import { DEFAULT_CSV_COLS, type CsvCol } from '../types';
import { buildShipRows, fmtYMD, valuesFor, CSV_COL_SOURCES } from '../lib/grid';
import { csvCell, downloadCsv } from '../lib/csv';
import { downloadXlsx } from '../lib/xlsx';

const zebra = (i: number) => (i % 2 ? 'background:#fbfaf7;' : 'background:#fff;');
const hasCsvSource = (key: string) => Object.prototype.hasOwnProperty.call(CSV_COL_SOURCES, key);

type NormalizedCsvCol = CsvCol & {
  placeholderKey: string;
};

function normalizeCsvCol(col: CsvCol): NormalizedCsvCol {
  const key = col.key || '';
  const placeholderKey = col.placeholderKey || col.sourceKey || key || (col.custom ? '新規項目' : '');
  const sourceKey = col.sourceKey || (!col.custom && hasCsvSource(placeholderKey) ? placeholderKey : undefined);
  return { ...col, key, placeholderKey, sourceKey };
}

function normalizeCsvCols(cols: CsvCol[] | undefined): NormalizedCsvCol[] {
  const source = cols && cols.length ? cols : DEFAULT_CSV_COLS;
  return source.map(normalizeCsvCol);
}

function outputKeyFor(col: NormalizedCsvCol): string {
  return col.key.trim() || col.placeholderKey;
}

function sourceLabelFor(col: NormalizedCsvCol): string {
  return col.sourceKey ? CSV_COL_SOURCES[col.sourceKey] || '' : '空欄固定';
}

export function useShipListViewModel() {
  const { retailer, data, ui, setUi, updateRetailer } = useStore();

  return useMemo(() => {
    const r = retailer!;
    const D = data!;
    const ship = r.ship;
    const shipRows = buildShipRows(D.masters, D.sheets);
    const csvCols = normalizeCsvCols(r.csvCols);
    const activeCols = csvCols.filter((c) => c.on);
    const previewDenymd = fmtYMD(ship.denymd) || '';

    const shHead = activeCols.map((c) => ({ t: outputKeyFor(c) }));
    const shRows = shipRows.map((row, i) => {
      const values = valuesFor(r, row, i, previewDenymd);
      return {
        style: zebra(i),
        cells: activeCols.map((c) => ({ t: c.sourceKey ? String(values[c.sourceKey] ?? '') : '' })),
      };
    });
    const canExport = shipRows.length > 0 && !!fmtYMD(ship.denymd);

    const upShip = (key: keyof typeof ship, v: string) => updateRetailer(r.id, { ship: { ...ship, [key]: v } });

    const exportCsv = () => {
      if (!shipRows.length) { alert('●が1件もありません'); return; }
      const denymd = fmtYMD(ship.denymd);
      if (!denymd) { alert('伝票日付を YYYY/MM/DD 形式で入力してください'); return; }
      if (!activeCols.length) { alert('出力する項目を1つ以上選んでください'); return; }
      const lines = [activeCols.map((c) => csvCell(outputKeyFor(c))).join(',')];
      shipRows.forEach((row, i) => {
        const values = valuesFor(r, row, i, denymd);
        lines.push(activeCols.map((c) => csvCell(c.sourceKey ? values[c.sourceKey] : '')).join(','));
      });
      downloadCsv('発送リスト_' + r.name + '_' + denymd + '.csv', lines.join('\n'));
    };

    const exportXlsx = () => {
      if (!shipRows.length) { alert('●が1件もありません'); return; }
      const denymd = fmtYMD(ship.denymd);
      if (!denymd) { alert('伝票日付を YYYY/MM/DD 形式で入力してください'); return; }
      if (!activeCols.length) { alert('出力する項目を1つ以上選んでください'); return; }
      const rows = shipRows.map((row, i) => {
        const values = valuesFor(r, row, i, denymd);
        return activeCols.map((c) => (c.sourceKey ? String(values[c.sourceKey] ?? '') : ''));
      });
      downloadXlsx('発送リスト_' + r.name + '_' + denymd + '.xlsx', activeCols.map(outputKeyFor), rows);
    };

    const reorder = (from: number, to: number) => {
      if (from === to) return;
      const arr = csvCols.slice();
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      updateRetailer(r.id, { csvCols: arr });
    };

    const csvColItems = csvCols.map((c, i) => ({
      key: c.key, on: c.on,
      placeholder: c.placeholderKey,
      source: sourceLabelFor(c),
      style:
        'display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:4px;background:' + (c.on ? '#f4f7f3' : '#faf9f6') +
        ';transition:transform .12s ease, background .12s ease, opacity .12s ease',
      dragHandleStyle:
        'width:18px;flex-shrink:0;color:#999;cursor:grab;text-align:center;font-size:13px;line-height:1;user-select:none;touch-action:none',
      onToggle: () => updateRetailer(r.id, { csvCols: csvCols.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x)) }),
      onKeyChange: (v: string) => updateRetailer(r.id, { csvCols: csvCols.map((x, xi) => (xi === i ? { ...x, key: v } : x)) }),
      onDel: () => {
        if (!confirm('項目「' + outputKeyFor(c) + '」を削除しますか？')) return;
        updateRetailer(r.id, { csvCols: csvCols.filter((_x, xi) => xi !== i) });
      },
    }));

    return {
      shRetailerName: r.name,
      shDenymd: ship.denymd || '', onShDenymd: (v: string) => upShip('denymd', v),
      shDatc: ship.datc || '2', onShDatc: (v: string) => upShip('datc', v),
      shGyono: ship.gyono || '1', onShGyono: (v: string) => upShip('gyono', v),
      shTokcd: ship.tokcd || '', onShTokcd: (v: string) => upShip('tokcd', v),
      shEvent: ship.event || '販促POP', onShEvent: (v: string) => upShip('event', v),
      shMknm: ship.mknm || '', onShMknm: (v: string) => upShip('mknm', v),
      shFixedLine: 'MKCD ' + (r.mkcd || '999') + ' ・ 得意先名 ' + (r.toknm || r.name) + ' ・ ' + (r.zip || '〒未設定') + ' ' + (r.tel || 'TEL未設定') + ' ・ ' + (r.addr || '住所未設定'),
      onGoRetailerMaster: () => setUi({ view: 'master', mtab: 'retailers' }),
      shRowCount: String(shipRows.length),
      shHasRows: shipRows.length > 0, shNoRows: shipRows.length === 0,
      shHead, shRows,
      csvColItems,
      csvColsOpen: ui.csvColsOpen,
      csvColsToggleIcon: ui.csvColsOpen ? '▾' : '▸',
      csvColsSummary: activeCols.length + ' / ' + csvCols.length + ' 項目を出力',
      onCsvColsToggleOpen: () => setUi({ csvColsOpen: !ui.csvColsOpen }),
      onCsvColsReset: () => updateRetailer(r.id, { csvCols: DEFAULT_CSV_COLS }),
      onCsvColAdd: () => {
        let n = 1;
        let key = '新規項目';
        while (csvCols.some((c) => c.key === key)) { n++; key = '新規項目' + n; }
        updateRetailer(r.id, { csvCols: csvCols.concat([{ key, on: true, custom: true, placeholderKey: key }]) });
      },
      onCsvColMove: reorder,
      onShExport: exportCsv,
      onShExportXlsx: exportXlsx,
      canExport,
    };
  }, [retailer, data, ui.csvColsOpen, setUi, updateRetailer]);
}
