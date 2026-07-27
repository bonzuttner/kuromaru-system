import { useStore } from '../../state/store';
import type { useSheetViewModel } from './useSheetViewModel';

export function ProductHeaderTable({ vm }: { vm: ReturnType<typeof useSheetViewModel> }) {
  const { setUi } = useStore();

  return (
    <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid #eceae3' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e5232' }}>商品ヘッダー</span>
        <span style={{ fontSize: 11.5, color: '#999' }}>{vm.headerSummary}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e5232', background: '#eef3ec', border: '1px solid #d4e3d4', borderRadius: 4, padding: '2px 10px' }}>送付合計 {vm.grandTotal}</span>
        <button
          onClick={() => setUi({ detailAll: !vm.headerDetailOpen })}
          style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#1f6e43', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}
        >
          {vm.headerDetailOpen ? '詳細を閉じる' : '詳細（CD・JAN・期限・棚割り）'}
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <th className="hc-lbl kedge" style={{ borderBottom: '1px solid #eceae3', background: '#faf9f6', padding: '5px 14px', width: 90, zIndex: 4 }} />
              {vm.colCats.map((cc, i) => (
                <th key={i} colSpan={cc.n} style={{ borderBottom: '1px solid #eceae3', borderLeft: '2px solid #cfcabd', background: '#f4f7f3', padding: 5, fontSize: 12, color: '#1e5232', fontWeight: 700 }}>{cc.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="hc-lbl kedge" style={rowLabelStyle}>商品</td>
              {vm.headerProds.map((c, i) => (
                <td key={i} style={{ borderBottom: '1px solid #f0eee8', borderLeft: c.bl, padding: '5px 8px', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 600, minWidth: 40 }}>
                  {c.thumbUrl && (
                    <img src={c.thumbUrl} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd9d0', margin: '0 auto 4px', display: 'block' }} />
                  )}
                  {c.no}<br />{c.name}
                </td>
              ))}
            </tr>
            <tr>
              <td className="hc-lbl kedge" style={rowLabelStyle}>送付店舗</td>
              {vm.headerProds.map((c, i) => (
                <td key={i} style={{ borderBottom: '1px solid #f0eee8', borderLeft: c.bl, padding: '5px 8px', textAlign: 'center', fontWeight: 700, color: '#1e5232' }}>{c.cnt}</td>
              ))}
            </tr>
            <tr>
              <td className="hc-lbl kedge" style={{ padding: '5px 14px', color: '#777', fontSize: 11, whiteSpace: 'nowrap', background: '#faf9f6', fontWeight: 700 }}>店舗着</td>
              {vm.headerProds.map((c, i) => (
                <td key={i} style={{ borderLeft: c.bl, padding: '5px 8px', textAlign: 'center', fontSize: 11 }}>{c.arrival}</td>
              ))}
            </tr>
          </tbody>
          {vm.headerDetailOpen && (
            <tbody style={{ borderTop: '1px solid #eceae3' }}>
              <DetailRow label="CD" prods={vm.headerProds} field="cd" mono />
              <DetailRow label="JAN" prods={vm.headerProds} field="jan" mono />
              <DetailRow label="入稿期限" prods={vm.headerProds} field="deadline" />
              <DetailRow label="ラウンダー" prods={vm.headerProds} field="rounder" />
              <DetailRow label="帯 / 同梱" prods={vm.headerProds} field="band" shaded />
              <DetailRow label="備考" prods={vm.headerProds} field="note" shaded muted />
            </tbody>
          )}
        </table>
      </div>
      {vm.headerDetailOpen && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '12px 14px', borderTop: '1px solid #eceae3', flexWrap: 'wrap' }}>
          {vm.catShelf.map((cs, i) => (
            <div key={i} style={{ minWidth: 240 }}>
              <div style={{ fontSize: 11.5, color: '#555', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#1e5232' }}>{cs.name}</span> 棚割りルール
              </div>
              {cs.ruleLines.map((rl, j) => (
                <div key={j} style={{ fontSize: 11.5, color: '#555', margin: '2px 0' }}>{rl.t}</div>
              ))}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {cs.images.map((im, k) => (
                  <div key={k} style={{ fontSize: 10.5, color: '#888' }}>
                    <div style={{ marginBottom: 3 }}>{im.label}</div>
                    {im.src ? (
                      <img
                        src={im.src}
                        alt="棚割りイメージ"
                        onClick={() => setUi({ modal: 'unitimg', unitImgStore: { kind: 'count', cat: im.cat, count: im.count, name: im.cat + ' 棚割り数' + im.count } })}
                        style={{ height: 56, maxWidth: 320, objectFit: 'contain', border: '1px solid #e0ddd5', background: '#fff', display: 'block', cursor: 'pointer' }}
                      />
                    ) : (
                      <div
                        onClick={() => setUi({ modal: 'unitimg', unitImgStore: { kind: 'count', cat: im.cat, count: im.count, name: im.cat + ' 棚割り数' + im.count } })}
                        style={{ height: 56, width: 200, border: '1px solid #e0ddd5', background: 'repeating-linear-gradient(45deg,#f5f4ef,#f5f4ef 6px,#ebe9e1 6px,#ebe9e1 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace,Consolas,monospace', fontSize: 10, color: '#999', cursor: 'pointer', textAlign: 'center' }}
                      >
                        見本写真 未登録<br />（クリックでアップロード）
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const rowLabelStyle = { borderBottom: '1px solid #f0eee8', padding: '5px 14px', color: '#777777', fontSize: 11, whiteSpace: 'nowrap' as const, fontWeight: 700 };

function DetailRow({
  label, prods, field, mono, shaded, muted,
}: {
  label: string;
  prods: ReturnType<typeof useSheetViewModel>['headerProds'];
  field: 'cd' | 'jan' | 'deadline' | 'rounder' | 'band' | 'note';
  mono?: boolean;
  shaded?: boolean;
  muted?: boolean;
}) {
  return (
    <tr>
      <td className="hc-lbl kedge" style={shaded ? { padding: '5px 14px', color: '#777777', fontSize: 11, whiteSpace: 'nowrap', background: '#faf9f6', fontWeight: 700 } : rowLabelStyle}>{label}</td>
      {prods.map((c, i) => (
        <td
          key={i}
          style={{
            borderBottom: shaded ? undefined : '1px solid #f0eee8',
            borderLeft: c.bl, padding: '5px 8px', textAlign: 'center',
            fontFamily: mono ? 'ui-monospace,Consolas,monospace' : undefined,
            fontSize: 11, color: muted ? '#555' : undefined,
          }}
        >
          {c[field]}
        </td>
      ))}
    </tr>
  );
}
