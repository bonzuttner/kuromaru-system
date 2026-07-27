import { useSheetViewModel } from './useSheetViewModel';
import { ProductHeaderTable } from './ProductHeaderTable';
import { GridTable } from './GridTable';

export function SheetView() {
  const vm = useSheetViewModel();

  return (
    <div style={{ padding: '16px 20px 56px', maxWidth: 1240 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: '#888' }}>黒丸表</span>
        <select
          value={String(vm.si)}
          onChange={(e) => vm.onSheetSel(Number(e.target.value))}
          style={{ fontSize: 13, fontWeight: 600, padding: '7px 10px', border: '1px solid #c9c5bc', borderRadius: 6, background: '#fff', color: '#1e5232', maxWidth: 340 }}
        >
          {vm.sheetOpts.map((o) => (
            <option key={o.v} value={o.v}>{o.t}</option>
          ))}
        </select>
        <span style={{ fontSize: 11.5, color: '#bbb' }}>{vm.sheetCountLabel}</span>
        <div style={{ flex: 1 }} />
        <button onClick={vm.onNewSheet} style={{ padding: '7px 14px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', fontSize: 12, cursor: 'pointer', borderRadius: 6, fontWeight: 600 }}>＋ 新規作成</button>
        <button onClick={vm.onDupSheet} style={{ padding: '7px 14px', border: '1px solid #c9c5bc', background: '#fff', color: '#555', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>この表を複製</button>
        <button onClick={vm.onSaveTemplate} style={{ padding: '7px 14px', border: '1px solid #c9c5bc', background: '#fff', color: '#555', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>テンプレート保存</button>
        <button onClick={vm.onDelSheet} style={{ padding: '7px 12px', border: '1px solid #e0cccc', background: '#fff', color: '#a05050', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>削除</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: '#888' }}>この表の設定:</span>
        <button onClick={vm.onOpenProducts} style={{ padding: '6px 14px', border: '1px solid #c9c5bc', background: '#fff', color: '#333', borderRadius: 4, fontSize: 12.5, cursor: 'pointer' }}>1. 商品を選ぶ</button>
        <button
          onClick={vm.onOpenShelf}
          style={vm.hasUnitCol
            ? { padding: '6px 14px', border: '1px solid #c9c5bc', background: '#fff', color: '#333', borderRadius: 4, fontSize: 12.5, cursor: 'pointer' }
            : { padding: '6px 14px', border: '1px solid #e4e1d9', background: '#f4f3ef', color: '#aaa', borderRadius: 4, fontSize: 12.5, cursor: 'pointer' }}
        >
          2. 棚割り
        </button>
        <button onClick={vm.onOpenDelivery} style={{ padding: '6px 14px', border: '1px solid #c9c5bc', background: '#fff', color: '#333', borderRadius: 4, fontSize: 12.5, cursor: 'pointer' }}>3. 配送情報</button>
        <button onClick={vm.onGoShipList} style={{ padding: '6px 14px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>発送リスト作成</button>
        <span style={{ fontSize: 11.5, color: '#999', marginLeft: 6 }}>{vm.summaryLine} ・ 単位を変えると●は自動再計算（自動保存）</span>
      </div>

      {vm.noCats && (
        <div style={{ background: '#fff', border: '1px dashed #b0aca2', borderRadius: 6, padding: 32, textAlign: 'center', color: '#666', fontSize: 13 }}>
          まだ商品が選ばれていません。<br />
          <button onClick={vm.onOpenProducts} style={{ marginTop: 14, padding: '8px 20px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>商品を選ぶ</button>
        </div>
      )}

      {vm.hasCats && (
        <>
          <ProductHeaderTable vm={vm} />
          <GridTable vm={vm} />
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
            単位が未設定の店舗は「展開」に数字を手入力し、●をクリックしてチェックできます（展開数と●の数を一致させてください）。住所・電話などの店舗情報は「マスタ &gt; 店舗」で管理しています。●が確定したら「発送リスト」画面でCSVを出力できます。
          </div>
        </>
      )}
    </div>
  );
}
