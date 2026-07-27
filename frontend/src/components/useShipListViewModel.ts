import { useMemo } from 'react';
import { useStore } from '../state/store';
import { DEFAULT_CSV_COLS } from '../types';
import { buildShipRows, fmtYMD, valuesFor, CSV_COL_SOURCES } from '../lib/grid';
import { csvCell, downloadCsv } from '../lib/csv';
import { downloadXlsx } from '../lib/xlsx';

const zebra = (i: number) => (i % 2 ? 'background:#fbfaf7;' : 'background:#fff;');

export function useShipListViewModel() {
  const { retailer, data, ui, setUi, updateRetailer } = useStore();

  return useMemo(() => {
    const r = retailer!;
    const D = data!;
    const ship = r.ship;
    const shipRows = buildShipRows(D.masters, D.sheets);
    const csvCols = r.csvCols && r.csvCols.length ? r.csvCols : DEFAULT_CSV_COLS;
    const activeKeys = csvCols.filter((c) => c.on).map((c) => c.key);
    const previewDenymd = fmtYMD(ship.denymd) || '';

    const shHead = activeKeys.map((k) => ({ t: k }));
    const shRows = shipRows.map((row, i) => ({
      style: zebra(i),
      cells: activeKeys.map((k) => ({ t: String(valuesFor(r, row, i, previewDenymd)[k] ?? '') })),
    }));
    const canExport = shipRows.length > 0 && !!fmtYMD(ship.denymd);

    const upShip = (key: keyof typeof ship, v: string) => updateRetailer(r.id, { ship: { ...ship, [key]: v } });

    const exportCsv = () => {
      if (!shipRows.length) { alert('●が1件もありません'); return; }
      const denymd = fmtYMD(ship.denymd);
      if (!denymd) { alert('伝票日付を YYYY/MM/DD 形式で入力してください'); return; }
      if (!activeKeys.length) { alert('出力する項目を1つ以上選んでください'); return; }
      const lines = [activeKeys.join(',')];
      shipRows.forEach((row, i) => {
        const values = valuesFor(r, row, i, denymd);
        lines.push(activeKeys.map((k) => csvCell(values[k])).join(','));
      });
      downloadCsv('発送リスト_' + r.name + '_' + denymd + '.csv', lines.join('\n'));
    };

    const exportXlsx = () => {
      if (!shipRows.length) { alert('●が1件もありません'); return; }
      const denymd = fmtYMD(ship.denymd);
      if (!denymd) { alert('伝票日付を YYYY/MM/DD 形式で入力してください'); return; }
      if (!activeKeys.length) { alert('出力する項目を1つ以上選んでください'); return; }
      const rows = shipRows.map((row, i) => {
        const values = valuesFor(r, row, i, denymd);
        return activeKeys.map((k) => String(values[k] ?? ''));
      });
      downloadXlsx('発送リスト_' + r.name + '_' + denymd + '.xlsx', activeKeys, rows);
    };

    const reorder = (from: number, to: number) => {
      if (from === to) return;
      const arr = csvCols.slice();
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      updateRetailer(r.id, { csvCols: arr });
    };

    const btnStyle = (dis: boolean) =>
      'border:1px solid #ddd9d0;background:' + (dis ? '#f4f3ef' : '#fff') + ';color:' + (dis ? '#ccc' : '#444') +
      ';border-radius:3px;font-size:11px;width:24px;height:24px;line-height:1;cursor:' + (dis ? 'not-allowed' : 'pointer') + ';flex-shrink:0;pointer-events:auto';

    const csvColItems = csvCols.map((c, i) => ({
      key: c.key, on: c.on,
      source: c.custom ? '空の追加項目' : CSV_COL_SOURCES[c.key] || '',
      style: 'display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:4px;background:' + (c.on ? '#f4f7f3' : '#faf9f6'),
      isFirst: i === 0, isLast: i === csvCols.length - 1,
      upStyle: btnStyle(i === 0), downStyle: btnStyle(i === csvCols.length - 1),
      onToggle: () => updateRetailer(r.id, { csvCols: csvCols.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x)) }),
      onKeyChange: (v: string) => updateRetailer(r.id, { csvCols: csvCols.map((x, xi) => (xi === i ? { ...x, key: v } : x)) }),
      onUp: () => { if (i > 0) reorder(i, i - 1); },
      onDown: () => { if (i < csvCols.length - 1) reorder(i, i + 1); },
      onDel: () => {
        if (!confirm('項目「' + c.key + '」を削除しますか？')) return;
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
      csvColsSummary: activeKeys.length + ' / ' + csvCols.length + ' 項目を出力',
      onCsvColsToggleOpen: () => setUi({ csvColsOpen: !ui.csvColsOpen }),
      onCsvColsReset: () => updateRetailer(r.id, { csvCols: DEFAULT_CSV_COLS }),
      onCsvColAdd: () => {
        let n = 1;
        let key = '新規項目';
        while (csvCols.some((c) => c.key === key)) { n++; key = '新規項目' + n; }
        updateRetailer(r.id, { csvCols: csvCols.concat([{ key, on: true, custom: true }]) });
      },
      onShExport: exportCsv,
      onShExportXlsx: exportXlsx,
      canExport,
    };
  }, [retailer, data, ui.csvColsOpen, setUi, updateRetailer]);
}
