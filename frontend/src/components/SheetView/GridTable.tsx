import { forwardRef, useEffect, useRef, useState } from 'react';
import { css } from '../../lib/styleString';
import type { useSheetViewModel } from './useSheetViewModel';

type GridVm = ReturnType<typeof useSheetViewModel>;
type GridRow = GridVm['gridRows'][number];
type RowDragState = {
  index: number;
  pointerY: number;
  offsetY: number;
  left: number;
  width: number;
  height: number;
  row: GridRow;
};

const sortButtonStyle = (active: boolean): React.CSSProperties => ({
  display: 'block',
  width: 11,
  height: 8,
  border: 'none',
  background: 'transparent',
  color: active ? '#555' : '#b8b8b8',
  fontSize: 8,
  lineHeight: '8px',
  padding: 0,
  cursor: 'pointer',
});

type GridBodyRowProps = {
  r: GridRow;
  vm: GridVm;
  isDragging?: boolean;
  handleCursor: 'grab' | 'grabbing';
  onHandlePointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
};

const GridBodyRow = forwardRef<HTMLTableRowElement, GridBodyRowProps>(function GridBodyRow({
  r,
  vm,
  isDragging,
  handleCursor,
  onHandlePointerDown,
}, ref) {
  return (
    <tr ref={ref} style={{ ...css(r.style), ...(isDragging ? { opacity: 0.18 } : {}) }}>
      <td className="fxb k1 w1" style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center', background: r.fixBg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span
            onPointerDown={onHandlePointerDown}
            title="ドラッグして並び替え"
            style={{ color: handleCursor === 'grabbing' ? '#1e6a41' : '#999', cursor: handleCursor, fontSize: 12, lineHeight: 1, userSelect: 'none', touchAction: 'none' }}
          >
            ⋮⋮
          </span>
          <input type="checkbox" checked={r.visChecked} onChange={r.onToggleHide} title="発送対象" style={{ cursor: 'pointer', margin: 0 }} />
        </div>
      </td>
      <td className="fxb k2 w2" style={{ borderBottom: '1px solid #f0eee8', padding: '3px 14px', whiteSpace: 'nowrap', fontFamily: 'ui-monospace,Consolas,monospace', background: r.fixBg, ...css(r.dimStyle) }}>{r.code}</td>
      <td className="fxb k3 w3" style={{ borderBottom: '1px solid #f0eee8', padding: '3px 10px', whiteSpace: 'nowrap', fontWeight: 600, background: r.fixBg, ...css(r.dimStyle) }}>{r.name}</td>
      {vm.hasUnitCol && (
        <td className="fxb k4 w4" style={{ borderBottom: '1px solid #f0eee8', padding: '2px 6px', textAlign: 'center', whiteSpace: 'nowrap', background: r.fixBg }}>
          <select
            value={r.unitVal}
            onChange={(e) => r.onUnit(e.target.value)}
            style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #ddd9d0', borderRadius: 3, background: '#fffdf2', color: '#333' }}
          >
            <option value="">—</option>
            {vm.unitOpts.map((o) => (
              <option key={o.v} value={o.v}>{o.t}</option>
            ))}
          </select>
        </td>
      )}
      <td className="fxb k5 w5" style={{ borderBottom: '1px solid #f0eee8', padding: '3px 10px', textAlign: 'center', background: r.fixBg, ...css(r.expandStyle) }}>
        {r.manual ? (
          <input
            type="number" min={0} value={r.expandVal}
            onChange={(e) => r.onExpand(e.target.value)}
            placeholder="—"
            style={{ width: 44, fontSize: 12, padding: '2px 4px', border: '1px solid #ddd9d0', borderRadius: 3, textAlign: 'center', background: '#fffdf2' }}
          />
        ) : (
          r.expand
        )}
      </td>
      <td className="fxb k6 w6 kedge" style={{ borderBottom: '1px solid #f0eee8', padding: '2px 6px', textAlign: 'center', fontWeight: 400, color: '#777777', background: r.fixBg }}>{r.rowTotal}</td>
      {r.cells.map((c, ci) => (
        <td
          key={ci}
          onClick={c.onClick}
          onMouseEnter={c.onMouseEnter}
          onMouseLeave={c.onMouseLeave}
          style={{ borderBottom: '1px solid #f0eee8', borderLeft: '1px solid #f7f5f0', padding: '2px 4px', textAlign: 'center', fontSize: 13.5, lineHeight: 1.1, ...css(c.style) }}
        >
          {c.m}
        </td>
      ))}
    </tr>
  );
});

export function GridTable({ vm }: { vm: ReturnType<typeof useSheetViewModel> }) {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const moveRowRef = useRef(vm.onStoreRowMove);
  const [drag, setDrag] = useState<RowDragState | null>(null);
  const isDragging = drag !== null;

  moveRowRef.current = vm.onStoreRowMove;
  rowRefs.current.length = vm.gridRows.length;

  useEffect(() => {
    if (!isDragging) return;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      setDrag((prev) => {
        if (!prev) return prev;
        let target = prev.index;
        for (let i = 0; i < rowRefs.current.length; i++) {
          const row = rowRefs.current[i];
          if (!row) continue;
          const rect = row.getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            target = i;
            break;
          }
          target = i;
        }
        if (target !== prev.index) moveRowRef.current(prev.index, target);
        return { ...prev, index: target, pointerY: e.clientY };
      });
    };
    const onUp = () => setDrag(null);

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  const startDrag = (i: number, e: React.PointerEvent<HTMLElement>) => {
    const row = rowRefs.current[i];
    if (!row) return;
    const rect = row.getBoundingClientRect();
    e.preventDefault();
    setDrag({
      index: i,
      pointerY: e.clientY,
      offsetY: e.clientY - rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      row: vm.gridRows[i],
    });
  };

  return (
    <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
      <div className="tbl-scroll">
        <table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: '100%' }}>
          <thead>
            <tr className="sticky-cat">
              <th colSpan={vm.storeColSpanFull} className="fxh k1" style={{ borderBottom: '1px solid #ddd9d0', padding: '6px 14px', fontSize: 11, textAlign: 'left', color: '#999', fontWeight: 600, left: 0, backgroundColor: '#FAF9F6' }}>店舗</th>
              <th className="fxh k6 w6 kedge" style={{ borderBottom: '1px solid #ddd9d0', padding: 6, fontSize: 11, color: '#1e5232', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', left: 377, backgroundColor: '#FAF9F6' }}><br /></th>
              {vm.colCats.map((cc, i) => (
                <th key={i} colSpan={cc.n} style={{ borderBottom: '1px solid #ddd9d0', borderLeft: '2px solid #cfcabd', background: '#f4f7f3', padding: 6, fontSize: 11, color: '#1e5232' }}>{cc.name}</th>
              ))}
            </tr>
            <tr className="sticky-col">
              <th className="fxh k1 w1" style={{ background: '#faf9f6', padding: '5px 6px', fontSize: 11, color: '#777', textAlign: 'center' }}>対象</th>
              <th className="fxh k2 w2" style={{ padding: '3px 6px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', backgroundColor: '#FAF9F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <span>店番</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <button
                      type="button"
                      title="店番で昇順"
                      onClick={(e) => { e.stopPropagation(); vm.onSortStoresAsc(); }}
                      style={sortButtonStyle(vm.storeSortDir === 'asc')}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      title="店番で降順"
                      onClick={(e) => { e.stopPropagation(); vm.onSortStoresDesc(); }}
                      style={sortButtonStyle(vm.storeSortDir === 'desc')}
                    >
                      ▼
                    </button>
                  </span>
                </div>
              </th>
              <th className="fxh k3 w3" style={{ background: '#faf9f6', padding: '5px 10px', fontSize: 11, color: '#777', textAlign: 'left', whiteSpace: 'nowrap' }}>店舗名称</th>
              {vm.hasUnitCol && (
                <th className="fxh k4 w4" style={{ background: '#faf9f6', padding: '5px 10px', fontSize: 11, color: '#777', whiteSpace: 'nowrap' }}>単位</th>
              )}
              <th className="fxh k5 w5" style={{ background: '#faf9f6', padding: '5px 10px', fontSize: 11, color: '#777', whiteSpace: 'nowrap' }}>展開本数</th>
              <th className="fxh k6 w6 kedge" style={{ padding: '5px 6px', fontSize: 11, color: '#777', textAlign: 'center', left: 377, backgroundColor: '#FAF9F6' }}>合計</th>
              {vm.colProds.map((cp, i) => (
                <th key={i} title={cp.name} style={{ borderLeft: cp.bl, background: cp.bg, padding: '5px 4px', fontSize: 12.5, minWidth: 36, color: '#555' }}>{cp.no}</th>
              ))}
            </tr>
            <tr className="sticky-total">
              <th className="fxh k1 w1" style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '2px 6px' }} />
              <th className="fxh k2 w2" style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '2px 6px' }} />
              <th className="fxh k3 w3" style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '2px 6px' }} />
              {vm.hasUnitCol && (
                <th className="fxh k4 w4" style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '2px 6px' }} />
              )}
              <th className="fxh k5 w5" style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '2px 6px' }} />
              <th className="fxh k6 w6 kedge grid-total-cell" style={{ left: 377 }}>{vm.grandTotal}</th>
              {vm.totals.map((tt, i) => (
                <th
                  key={i}
                  className="grid-total-cell"
                  onMouseEnter={tt.onMouseEnter}
                  onMouseLeave={tt.onMouseLeave}
                  style={{ borderLeft: tt.bl, background: tt.bg }}
                >
                  {tt.v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vm.gridRows.map((r, i) => (
              <GridBodyRow
                key={r.code}
                r={r}
                vm={vm}
                ref={(el) => { rowRefs.current[i] = el; }}
                isDragging={drag?.index === i}
                handleCursor={drag?.index === i ? 'grabbing' : 'grab'}
                onHandlePointerDown={(e) => startDrag(i, e)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.left,
            top: drag.pointerY - drag.offsetY,
            width: drag.width,
            height: drag.height,
            zIndex: 1000,
            pointerEvents: 'none',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 12px 28px rgba(0,0,0,.22)',
            transform: 'scale(1.01)',
          }}
        >
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: drag.width }}>
            <tbody>
              <GridBodyRow r={drag.row} vm={vm} handleCursor="grabbing" />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
