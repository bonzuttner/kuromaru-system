import { useEffect, useRef, useState } from 'react';
import { css } from '../lib/styleString';
import { useShipListViewModel } from './useShipListViewModel';

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#777', fontFamily: 'ui-monospace,Consolas,monospace' };
const inputStyle = (w: number): React.CSSProperties => ({ width: w, fontSize: 12.5, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 });
const csvKeyInputStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace,Consolas,monospace',
  fontSize: 11.5,
  width: 78,
  flexShrink: 0,
  border: '1px solid #e4e1d9',
  borderRadius: 3,
  padding: '2px 4px',
  background: '#fff',
};

type CsvColItem = ReturnType<typeof useShipListViewModel>['csvColItems'][number];
type CsvColDisplayItem = Pick<CsvColItem, 'key' | 'on' | 'placeholder' | 'source' | 'dragHandleStyle'> &
  Partial<Pick<CsvColItem, 'onToggle' | 'onKeyChange' | 'onDel'>>;
type CsvDragState = {
  index: number;
  pointerY: number;
  offsetY: number;
  left: number;
  width: number;
  height: number;
  item: CsvColDisplayItem;
};

function CsvColRowContents({
  item,
  handleCursor,
  onHandlePointerDown,
}: {
  item: CsvColDisplayItem;
  handleCursor: 'grab' | 'grabbing';
  onHandlePointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <>
      <span
        onPointerDown={onHandlePointerDown}
        title="ドラッグして並び替え"
        style={{ ...css(item.dragHandleStyle), color: handleCursor === 'grabbing' ? '#1e6a41' : undefined, cursor: handleCursor }}
      >
        ⋮⋮
      </span>
      <input type="checkbox" checked={item.on} onChange={item.onToggle} readOnly={!item.onToggle} style={{ cursor: item.onToggle ? 'pointer' : 'default' }} />
      <input
        value={item.key}
        placeholder={item.placeholder}
        onChange={(e) => item.onKeyChange?.(e.target.value)}
        readOnly={!item.onKeyChange}
        style={csvKeyInputStyle}
      />
      <span style={{ fontSize: 11.5, color: '#999', width: 150, flexShrink: 0 }}>{item.source}</span>
      {item.onDel ? (
        <button onClick={item.onDel} style={{ border: 'none', background: 'transparent', color: '#a88', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}>削除</button>
      ) : (
        <span style={{ color: '#a88', fontSize: 11, marginLeft: 4 }}>削除</span>
      )}
    </>
  );
}

export function ShipListView() {
  const vm = useShipListViewModel();
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moveCsvColRef = useRef(vm.onCsvColMove);
  const [csvDrag, setCsvDrag] = useState<CsvDragState | null>(null);
  const isCsvDragging = csvDrag !== null;

  moveCsvColRef.current = vm.onCsvColMove;
  rowRefs.current.length = vm.csvColItems.length;

  useEffect(() => {
    if (!isCsvDragging) return;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      setCsvDrag((prev) => {
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
        if (target !== prev.index) moveCsvColRef.current(prev.index, target);
        return { ...prev, index: target, pointerY: e.clientY };
      });
    };
    const onUp = () => setCsvDrag(null);

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isCsvDragging]);

  const startCsvDrag = (i: number, e: React.PointerEvent<HTMLElement>) => {
    const row = rowRefs.current[i];
    if (!row) return;
    const item = vm.csvColItems[i];
    const rect = row.getBoundingClientRect();
    e.preventDefault();
    setCsvDrag({
      index: i,
      pointerY: e.clientY,
      offsetY: e.clientY - rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      item: {
        key: item.key,
        on: item.on,
        placeholder: item.placeholder,
        source: item.source,
        dragHandleStyle: item.dragHandleStyle,
      },
    });
  };

  return (
    <div style={{ padding: '16px 20px 56px', maxWidth: 1240 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>発送リスト（帳簿CSV）</div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        {vm.shRetailerName} の全黒丸表の●から 1行＝1店舗×1商品 で生成します。CSVは物流帳簿の36項目・UTF-8で出力。
      </div>

      <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>発送リスト作成情報</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={labelStyle}>DENYMD（伝票日付）<span style={{ color: '#a04030', fontFamily: 'inherit' }}>必須</span>
            <input value={vm.shDenymd} onChange={(e) => vm.onShDenymd(e.target.value)} placeholder="2026/01/19" style={inputStyle(110)} />
          </label>
          <label style={labelStyle}>DATC（データ区分）
            <input value={vm.shDatc} onChange={(e) => vm.onShDatc(e.target.value)} style={{ ...inputStyle(56), textAlign: 'center' }} />
          </label>
          <label style={labelStyle}>GYONO（行番号）
            <input value={vm.shGyono} onChange={(e) => vm.onShGyono(e.target.value)} style={{ ...inputStyle(56), textAlign: 'center' }} />
          </label>
          <label style={labelStyle}>TOKCD（得意先コード・空欄可）
            <input value={vm.shTokcd} onChange={(e) => vm.onShTokcd(e.target.value)} style={inputStyle(100)} />
          </label>
          <label style={labelStyle}>イベント名（SYONMに連結）
            <input value={vm.shEvent} onChange={(e) => vm.onShEvent(e.target.value)} placeholder="販促POP" style={{ ...inputStyle(120), fontFamily: 'inherit' }} />
          </label>
          <label style={labelStyle}>MKNM（メーカー名・全行一律）
            <input value={vm.shMknm} onChange={(e) => vm.onShMknm(e.target.value)} placeholder="例 ヘルス" style={{ ...inputStyle(110), fontFamily: 'inherit' }} />
          </label>
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 10 }}>
          小売店の固定値: {vm.shFixedLine}
          <a href="#" onClick={(e) => { e.preventDefault(); vm.onGoRetailerMaster(); }} style={{ fontSize: 11 }}>マスタ &gt; 小売店 で編集</a>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={vm.onCsvColsToggleOpen}>
          <span style={{ fontSize: 11, color: '#999' }}>{vm.csvColsToggleIcon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>CSV出力項目（この小売店ごとに保存）</span>
          <span style={{ fontSize: 10.5, color: '#999' }}>{vm.csvColsSummary}</span>
        </div>
        {vm.csvColsOpen && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 8px' }}>
              <span style={{ fontSize: 10.5, color: '#999' }}>ドラッグで並び替え・チェックで出力有無</span>
              <div style={{ flex: 1 }} />
              <button onClick={vm.onCsvColsReset} style={{ border: 'none', background: 'transparent', color: '#888', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>既定順に戻す</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 360, overflowY: 'auto', border: '1px solid #eceae3', borderRadius: 6, padding: 4 }}>
              {vm.csvColItems.map((cc, i) => (
                <div
                  key={i}
                  ref={(el) => { rowRefs.current[i] = el; }}
                  style={{
                    ...css(cc.style),
                    ...(csvDrag?.index === i
                      ? { opacity: 0.18, background: '#eef4ec', boxShadow: 'inset 0 0 0 1px #d4e3d4' }
                      : {}),
                  }}
                >
                  <CsvColRowContents
                    item={cc}
                    handleCursor={csvDrag?.index === i ? 'grabbing' : 'grab'}
                    onHandlePointerDown={(e) => startCsvDrag(i, e)}
                  />
                </div>
              ))}
            </div>
            {csvDrag && (
              <div
                style={{
                  position: 'fixed',
                  left: csvDrag.left,
                  top: csvDrag.pointerY - csvDrag.offsetY,
                  width: csvDrag.width,
                  height: csvDrag.height,
                  zIndex: 1000,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  borderRadius: 4,
                  background: '#fff',
                  boxShadow: '0 12px 28px rgba(0,0,0,.22)',
                  transform: 'scale(1.01)',
                }}
              >
                <CsvColRowContents item={csvDrag.item} handleCursor="grabbing" />
              </div>
            )}
            <button onClick={vm.onCsvColAdd} style={{ marginTop: 8, padding: '5px 14px', border: '1px dashed #b0aca2', background: '#faf9f6', color: '#777', borderRadius: 4, fontSize: 11.5, cursor: 'pointer' }}>＋ 出力項目を追加（空欄固定）</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: '#555' }}>生成行数 <b style={{ color: '#1e5232', fontSize: 14 }}>{vm.shRowCount}</b> 行（伝票番号 1〜{vm.shRowCount} 自動連番）</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={vm.onShExport}
          disabled={!vm.canExport}
          style={vm.canExport
            ? { padding: '8px 22px', borderRadius: 4, fontSize: 13, fontWeight: 600, border: 'none', background: '#1e6a41', color: '#fff', cursor: 'pointer' }
            : { padding: '8px 22px', borderRadius: 4, fontSize: 13, fontWeight: 600, border: '1px solid #ddd9d0', background: '#f4f3ef', color: '#ccc', cursor: 'not-allowed' }}
        >
          CSV出力（UTF-8）
        </button>
        <button
          onClick={vm.onShExportXlsx}
          disabled={!vm.canExport}
          style={vm.canExport
            ? { padding: '8px 22px', borderRadius: 4, fontSize: 13, fontWeight: 600, border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', cursor: 'pointer' }
            : { padding: '8px 22px', borderRadius: 4, fontSize: 13, fontWeight: 600, border: '1px solid #ddd9d0', background: '#f4f3ef', color: '#ccc', cursor: 'not-allowed' }}
        >
          Excel出力（.xlsx）
        </button>
      </div>

      {vm.shHasRows && (
        <>
          <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
            <div className="tbl-scroll">
              <table style={{ borderCollapse: 'collapse', fontSize: 11.5, width: '100%' }}>
                <thead>
                  <tr className="sticky-head">
                    {vm.shHead.map((h, i) => (
                      <th key={i} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '5px 8px', fontSize: 10, color: '#777', whiteSpace: 'nowrap', fontFamily: 'ui-monospace,Consolas,monospace', fontWeight: 600 }}>{h.t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vm.shRows.map((s, i) => (
                    <tr key={i} style={css(s.style)}>
                      {s.cells.map((v, j) => (
                        <td key={j} style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', whiteSpace: 'nowrap', fontSize: 11 }}>{v.t}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: '#bbb', marginTop: 6 }}>列は上のCSV出力項目の並び・チェックに連動します。</div>
        </>
      )}
      {vm.shNoRows && (
        <div style={{ background: '#fff', border: '1px dashed #b0aca2', borderRadius: 6, padding: 28, textAlign: 'center', color: '#666', fontSize: 13 }}>
          ●が1件もありません。黒丸表で単位・棚割りを設定してください。
        </div>
      )}
    </div>
  );
}
