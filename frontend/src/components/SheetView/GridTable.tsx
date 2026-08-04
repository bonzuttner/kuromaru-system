import { css } from '../../lib/styleString';
import type { useSheetViewModel } from './useSheetViewModel';

export function GridTable({ vm }: { vm: ReturnType<typeof useSheetViewModel> }) {
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
              <th className="fxh k2 w2" style={{ padding: '5px 14px', fontSize: 11, color: '#777', textAlign: 'left', whiteSpace: 'nowrap', backgroundColor: '#FAF9F6' }}>店番</th>
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
            {vm.gridRows.map((r) => (
              <tr key={r.code} style={css(r.style)}>
                <td className="fxb k1 w1" style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center', background: r.fixBg }}>
                  <input type="checkbox" checked={r.visChecked} onChange={r.onToggleHide} title="発送対象" style={{ cursor: 'pointer' }} />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
