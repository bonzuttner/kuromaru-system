import { useStore } from '../../state/store';

const cellInput = (w: number): React.CSSProperties => ({ width: w, fontSize: 12, padding: '3px 6px', border: '1px solid #e4e1d9', borderRadius: 3 });

export function RetailersTab() {
  const { retailers, retailerId, ui, setUi, updateRetailer, addRetailer, deleteRetailer } = useStore();

  const onAdd = async () => {
    const v = ui.nr.trim();
    if (!v) { alert('小売店名を入力してください'); return; }
    if (retailers.some((x) => x.name === v)) { alert('同名の小売店が既にあります'); return; }
    try {
      await addRetailer(v);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const onDel = async (id: string, name: string) => {
    if (retailers.length <= 1) return;
    if (!confirm('「' + name + '」を削除しますか？（店舗・商品・黒丸表もすべて削除されます）')) return;
    await deleteRetailer(id);
  };

  const AddForm = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, background: '#faf9f6', border: '1px solid #eceae3', borderRadius: 6, padding: '10px 12px' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>追加:</span>
      <input value={ui.nr} onChange={(e) => setUi({ nr: e.target.value })} placeholder="新しい小売店名（例: ○○ドラッグ）" style={{ width: 240, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
      <button onClick={onAdd} style={{ padding: '5px 16px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>追加</button>
      <span style={{ fontSize: 11, color: '#999' }}>追加すると空の店舗・商品・黒丸表がその小売店用に作られます。</span>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>小売店マスタ</div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>帳簿CSVの得意先情報（MKCD・TOKNM・TKPOST 等）の参照元。店舗・商品・黒丸表は小売店ごとに管理されます。</div>
      {AddForm}
      <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
        <div className="tbl-scroll">
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr className="sticky-head">
                {['小売店名', '得意先名（TOKNM）', '部署名（任意）', 'メーカーコード', '郵便番号', '電話番号', 'FAX（任意）', '住所1', ''].map((h) => (
                  <th key={h} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '6px 12px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', textAlign: h === '小売店名' || h === '得意先名（TOKNM）' || h === '住所1' ? 'left' : undefined }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retailers.map((x, i) => (
                <tr key={x.id} style={{ background: i % 2 ? '#fbfaf7' : '#fff', outline: x.id === retailerId ? '2px solid #dfe9df' : undefined, outlineOffset: x.id === retailerId ? -2 : undefined }}>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.name} onChange={(e) => updateRetailer(x.id, { name: e.target.value })} style={{ ...cellInput(110), fontWeight: 600 }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.toknm} onChange={(e) => updateRetailer(x.id, { toknm: e.target.value })} style={cellInput(140)} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.dept} onChange={(e) => updateRetailer(x.id, { dept: e.target.value })} style={cellInput(90)} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center' }}><input value={x.mkcd} onChange={(e) => updateRetailer(x.id, { mkcd: e.target.value })} style={{ ...cellInput(56), textAlign: 'center', fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.zip} onChange={(e) => updateRetailer(x.id, { zip: e.target.value })} style={{ ...cellInput(78), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.tel} onChange={(e) => updateRetailer(x.id, { tel: e.target.value })} style={{ ...cellInput(104), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.fax} onChange={(e) => updateRetailer(x.id, { fax: e.target.value })} style={{ ...cellInput(104), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={x.addr} onChange={(e) => updateRetailer(x.id, { addr: e.target.value })} style={cellInput(230)} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center' }}>
                    {retailers.length > 1 && (
                      <button onClick={() => onDel(x.id, x.name)} style={{ border: 'none', background: 'transparent', color: '#a88', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>削除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <input value={ui.nr} onChange={(e) => setUi({ nr: e.target.value })} placeholder="新しい小売店名（例: ○○ドラッグ）" style={{ width: 240, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <button onClick={onAdd} style={{ padding: '5px 16px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>追加</button>
        <span style={{ fontSize: 11, color: '#999' }}>追加すると空の店舗・商品・黒丸表がその小売店用に作られます。</span>
      </div>
    </div>
  );
}
