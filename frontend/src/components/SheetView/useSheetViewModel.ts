import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { CIRC } from '../../types';
import type { DeliveryInfo, Sheet, SheetCat, Store } from '../../types';
import { cell, cntFor, markedManual, pById, storesForSheet, storesSorted } from '../../lib/grid';

const zebra = (i: number) => (i % 2 ? 'background:#fbfaf7;' : 'background:#fff;');
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function useSheetViewModel() {
  const { retailer, data, ui, setUi, updateData } = useStore();

  return useMemo(() => {
    const r = retailer!;
    const D = data!;
    const M = D.masters;
    const sheets = D.sheets;
    const si = Math.max(0, Math.min(ui.sheetIdx, sheets.length - 1));
    const sheet: Sheet =
      sheets[si] || { id: 'X', name: '', cats: [], delivery: {}, units: {}, unitOptions: [4, 5, 6, 7, 8] };
    const stores: Store[] = storesForSheet(M, sheet);
    const ascStoreCodes = storesSorted(M).map((st) => st.code);
    const descStoreCodes = [...ascStoreCodes].reverse();
    const currentStoreCodes = stores.map((st) => st.code);
    const hidden = sheet.hiddenStores || {};
    const cats = sheet.cats;
    const manual = sheet.manual || {};
    const hv = ui.hoverCell;

    const setHover = (ri: number, ci: number) => {
      const cur = ui.hoverCell;
      if (!cur || cur.ri !== ri || cur.ci !== ci) setUi({ hoverCell: { ri, ci } });
    };
    const clearHover = () => {
      if (ui.hoverCell) setUi({ hoverCell: null });
    };

    const colCats = cats.map((c) => ({ name: c.name, n: c.productIds.length }));
    const hvCol = hv ? hv.ci : -1;
    let cpIdx = -1;
    const colProds = cats.flatMap((c) =>
      c.productIds.map((pid, i) => {
        cpIdx++;
        const p = pById(M, pid);
        return {
          no: CIRC[i],
          name: p.name,
          bl: i === 0 ? '2px solid #cfcabd' : '1px solid #f0eee8',
          bg: cpIdx === hvCol ? '#dbe9db' : '#faf9f6',
        };
      })
    );
    let totalIdx = -1;
    const totals = cats.flatMap((c) =>
      c.productIds.map((pid, i) => {
        totalIdx++;
        const ci = totalIdx;
        return {
          v: String(cntFor(sheet, M, c, pid)),
          bl: i === 0 ? '2px solid #cfcabd' : '1px solid #f0eee8',
          bg: ci === hvCol ? '#dbe9db' : '#faf9f6',
          onMouseEnter: () => setHover(-1, ci),
          onMouseLeave: clearHover,
        };
      })
    );
    const grandTotal = totals.reduce((a, t) => a + Number(t.v), 0);

    const hasUnitCol = cats.length === 0 || cats.some((c) => c.useShelf !== false);
    const storeColSpan = hasUnitCol ? 4 : 3;
    const storeColSpanFull = storeColSpan + 1;
    const firstCols: Record<number, boolean> = {};
    {
      let k = -1;
      cats.forEach((c) => c.productIds.forEach((_pid, i) => { k++; if (i === 0) firstCols[k] = true; }));
    }
    const catDivOf = (ci: number) => (firstCols[ci] ? 'border-left:2px solid #cfcabd;' : '');

    const onStoreRowMove = (from: number, to: number) => {
      if (from === to) return;
      const next = currentStoreCodes.slice();
      const [code] = next.splice(from, 1);
      if (!code) return;
      next.splice(to, 0, code);
      updateData((d) => {
        d.sheets[si].storeOrder = next;
      });
    };
    const sortStoresByCode = (dir: 'asc' | 'desc') => {
      updateData((d) => {
        d.sheets[si].storeOrder = dir === 'asc' ? ascStoreCodes : descStoreCodes;
      });
    };
    const setDeliveryField = (pid: string, key: keyof DeliveryInfo, value: string) =>
      updateData((d) => {
        const rec = d.sheets[si].delivery[pid] || (d.sheets[si].delivery[pid] = {});
        rec[key] = value;
      });

    const gridRows = stores.map((st, ri) => {
      const u = hasUnitCol ? sheet.units[st.code] : undefined;
      const mrow = manual[st.code] || { expand: '', marks: {} };
      const rowHot = !!hv && hv.ri === ri;
      const hoverBg = (ci: number) => {
        const colHot = !!hv && hv.ci === ci;
        if (rowHot && colHot) return 'background:#dbe9db;';
        if (rowHot || colHot) return 'background:#eef4ec;';
        return '';
      };

      let ci = -1;
      type Cell = { m: string; style: string; onClick?: () => void; onMouseEnter: () => void; onMouseLeave: () => void };
      let cellsList: Cell[];
      if (u) {
        cellsList = cats.flatMap((c) =>
          c.productIds.map((pid) => {
            ci++;
            const cc = ci;
            return {
              m: cell(c, pid, u) ? '●' : '',
              onMouseEnter: () => setHover(ri, cc),
              onMouseLeave: clearHover,
              style: catDivOf(cc) + hoverBg(cc),
            };
          })
        );
      } else {
        cellsList = cats.flatMap((c) =>
          c.productIds.map((pid) => {
            ci++;
            const cc = ci;
            const on = markedManual(manual, st.code, pid);
            return {
              m: on ? '●' : '',
              style: 'cursor:pointer;' + catDivOf(cc) + hoverBg(cc) + (on ? 'color:#1e5232' : 'color:#ddd'),
              onMouseEnter: () => setHover(ri, cc),
              onMouseLeave: clearHover,
              onClick: () =>
                updateData((d) => {
                  const shx = d.sheets[si];
                  if (!shx.manual) shx.manual = {};
                  if (!shx.manual[st.code]) shx.manual[st.code] = { expand: '', marks: {} };
                  if (!shx.manual[st.code].marks) shx.manual[st.code].marks = {};
                  shx.manual[st.code].marks[pid] = !shx.manual[st.code].marks[pid];
                }),
            };
          })
        );
      }
      const marks = cellsList.filter((x) => x.m).length;
      const expandNum = u ? marks : mrow.expand === '' || mrow.expand === undefined ? null : Number(mrow.expand);
      const mismatch = !u && expandNum !== null && expandNum !== marks;

      return {
        code: st.code,
        name: st.name,
        rowTotal: u ? String(marks) : expandNum !== null ? String(expandNum) : marks ? String(marks) : '—',
        unitVal: u ? String(u) : '',
        expand: u ? String(marks) : mrow.expand !== '' && mrow.expand !== undefined ? String(mrow.expand) : '—',
        manual: !u,
        notManual: !!u,
        expandVal: mrow.expand !== undefined ? String(mrow.expand) : '',
        expandStyle: mismatch ? 'color:#a04030;font-weight:700' : 'color:#777',
        onExpand: (v: string) =>
          updateData((d) => {
            const shx = d.sheets[si];
            if (!shx.manual) shx.manual = {};
            if (!shx.manual[st.code]) shx.manual[st.code] = { expand: '', marks: {} };
            shx.manual[st.code].expand = v;
          }),
        style: (rowHot ? 'background:#eef4ec;' : zebra(ri)) + (hidden[st.code] ? 'opacity:.45;' : ''),
        fixBg: rowHot ? '#eef4ec' : ri % 2 ? '#fbfaf7' : '#fff',
        onUnit: (v: string) =>
          updateData((d) => {
            if (v) d.sheets[si].units[st.code] = Number(v);
            else delete d.sheets[si].units[st.code];
          }),
        cells: cellsList,
        visChecked: !hidden[st.code],
        dimStyle: hidden[st.code] ? 'color:#bbb' : '',
        onToggleHide: () =>
          updateData((d) => {
            const shx = d.sheets[si];
            if (!shx.hiddenStores) shx.hiddenStores = {};
            if (shx.hiddenStores[st.code]) delete shx.hiddenStores[st.code];
            else shx.hiddenStores[st.code] = true;
          }),
      };
    });

    const headerProds: {
      pid: string; no: string; name: string; cd: string; jan: string; janPlaceholder: string; cnt: string; deadline: string; arrival: string;
      rounder: string; band: string; doukon: string; note: string; bl: string; thumbUrl: string;
      onDeliveryChange: (key: keyof DeliveryInfo, value: string) => void;
    }[] = [];
    cats.forEach((c) => {
      c.productIds.forEach((pid, i) => {
        const p = pById(M, pid);
        const d = sheet.delivery[pid] || {};
        const thumbUrl = D.productThumbs[pid] || '';
        headerProds.push({
          pid, no: CIRC[i], name: p.name, cd: d.cd || '', jan: d.jan || '', janPlaceholder: p.jan || '', cnt: cntFor(sheet, M, c, pid) + '店',
          deadline: d.deadline || '', arrival: d.arrival || '', rounder: d.rounder || '',
          band: d.band || '', doukon: d.doukon || '', note: d.note || '',
          bl: i === 0 ? '2px solid #cfcabd' : '1px solid #f7f5f0', thumbUrl,
          onDeliveryChange: (key, value) => setDeliveryField(pid, key, value),
        });
      });
    });

    const catShelf = cats.map((c: SheetCat) => {
      const groups: { key: string; units: number[]; count: number; ids: string[] }[] = [];
      (sheet.unitOptions || [4, 5, 6, 7, 8]).forEach((u) => {
        const n = (c.unitCount || {})[u] || 0;
        const key = String(n);
        const g = groups.find((x) => x.key === key);
        if (g) g.units.push(u);
        else groups.push({ key, units: [u], count: n, ids: (c.countProducts || {})[n] || [] });
      });
      const ruleLines = groups.map((g) => ({
        t: g.units.join('・') + '本単位 → 棚割り数 ' + g.count + '（' + g.ids.map((id) => CIRC[c.productIds.indexOf(id)]).join('') + '）',
      }));
      const images = groups
        .filter((g) => g.count > 0)
        .map((g) => {
          const imgKey = sheet.id + ':' + c.name + ':count:' + g.count;
          const src = D.shelfImages[imgKey] || (c.images && c.images[g.count]) || '';
          return { label: '棚割り数' + g.count + '（' + g.units.join('・') + '本）', src, cat: c.name, count: g.count };
        });
      return { name: c.name, ruleLines, images };
    });

    const noCats = cats.length === 0;
    const hasCats = cats.length > 0;
    const unitSet = Object.keys(sheet.units).filter((c) => stores.some((s) => s.code === c)).length;
    const summaryLine = (cats.map((c) => c.name).join('・') || '商品未選択') + ' ' + colProds.length + '商品 ・ ' + stores.length + '店中 ' + unitSet + '店 設定済';
    const headerSummary = (cats.map((c) => c.name).join('・') || '商品未選択') + ' ' + headerProds.length + '商品';
    const headerDetailOpen = ui.detailAll;

    return {
      retailer: r, sheets, si, sheet, cats, gridRows, colCats, colProds, totals, grandTotal,
      hasUnitCol, storeColSpan, storeColSpanFull, noCats, hasCats, summaryLine, headerSummary, headerDetailOpen,
      headerProds, catShelf,
      onStoreRowMove,
      onSortStoresAsc: () => sortStoresByCode('asc'),
      onSortStoresDesc: () => sortStoresByCode('desc'),
      storeSortDir: sameOrder(currentStoreCodes, ascStoreCodes) ? 'asc' : sameOrder(currentStoreCodes, descStoreCodes) ? 'desc' : null,
      sheetOpts: sheets.map((sh, i) => ({ v: String(i), t: sh.name })),
      sheetCountLabel: sheets.length + '表',
      unitOpts: [...(sheet.unitOptions || [])].sort((a, b) => a - b).map((v) => ({ v: String(v), t: v + '本' })),

      isRenaming: ui.renamingSheet,
      renameValue: ui.renameValue,

      onSheetSel: (idx: number) => setUi({ sheetIdx: idx, modal: null, csv: null }),
      onStartRename: () => {
        setUi({ renamingSheet: true, renameValue: sheet.name });
      },
      onRenameChange: (value: string) => {
        setUi({ renameValue: value });
      },
      onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const trimmed = ui.renameValue.trim();
          if (!trimmed) {
            alert('シート名を入力してください');
            return;
          }
          const isDuplicate = sheets.some((sh, i) => i !== si && sh.name === trimmed);
          if (isDuplicate) {
            alert('同名のシートが既にあります');
            return;
          }
          updateData((d) => {
            d.sheets[si].name = trimmed;
          });
          setUi({ renamingSheet: false, renameValue: '' });
        } else if (e.key === 'Escape') {
          setUi({ renamingSheet: false, renameValue: '' });
        }
      },
      onRenameSave: () => {
        const trimmed = ui.renameValue.trim();
        if (!trimmed) {
          alert('シート名を入力してください');
          return;
        }
        const isDuplicate = sheets.some((sh, i) => i !== si && sh.name === trimmed);
        if (isDuplicate) {
          alert('同名のシートが既にあります');
          return;
        }
        updateData((d) => {
          d.sheets[si].name = trimmed;
        });
        setUi({ renamingSheet: false, renameValue: '' });
      },
      onRenameCancel: () => {
        setUi({ renamingSheet: false, renameValue: '' });
      },
      onNewSheet: () => setUi({ modal: 'newsheet', ns: { name: '', mode: 'dup', tplId: '' } }),
      onDupSheet: () => {
        const newIdx = sheets.length;
        updateData((d) => {
          const copy = structuredClone(d.sheets[si]);
          copy.id = 'S' + Date.now();
          copy.name = d.sheets[si].name + '（複製）';
          d.sheets.push(copy);
        });
        setUi({ sheetIdx: newIdx });
      },
      onDelSheet: () => {
        if (sheets.length <= 1) { alert('最後の1枚は削除できません'); return; }
        if (!confirm('「' + sheet.name + '」を削除しますか？')) return;
        updateData((d) => { d.sheets.splice(si, 1); });
        setUi({ sheetIdx: 0 });
      },
      onOpenProducts: () => setUi({ modal: 'products' }),
      onOpenShelf: () => setUi({ modal: 'shelf' }),
      onOpenDelivery: () => setUi({ modal: 'delivery' }),
      onGoShipList: () => setUi({ view: 'shiplist' }),
      onToggleHeaderDetail: () => setUi({ detailAll: !ui.detailAll }),
      onSaveTemplate: () => {
        const def = (sheet.name || '黒丸表') + ' テンプレート';
        const nm = window.prompt('テンプレート名を入力してください（配送情報の日付は引き継がれません）', def);
        if (nm === null) return;
        const name = nm.trim() || def;
        updateData((d) => {
          if (!d.templates) d.templates = [];
          const tplSheet = structuredClone(d.sheets[si]);
          const tplId = tplSheet.id;
          Object.values(tplSheet.delivery || {}).forEach((rec) => { rec.deadline = ''; rec.arrival = ''; rec.rounder = ''; });
          d.templates.push({ id: 'T' + Date.now(), name, sheet: { ...tplSheet, id: tplId } });
        });
        alert('テンプレート「' + name + '」を保存しました。新規作成時に選べます。');
      },
    };
  }, [retailer, data, ui.sheetIdx, ui.hoverCell, ui.detailAll, ui.renamingSheet, ui.renameValue, setUi, updateData]);
}
