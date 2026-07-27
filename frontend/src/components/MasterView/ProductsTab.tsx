import { useStore } from '../../state/store';
import { makeCsvImportState } from '../../lib/csvImport';

const cellInput = (w: number): React.CSSProperties => ({ width: w, fontSize: 12, padding: '3px 6px', border: '1px solid #e4e1d9', borderRadius: 3 });

export function ProductsTab() {
  const { retailer, data, updateData, ui, setUi } = useStore();
  const D = data!;
  const M = D.masters;

  const onNcAdd = () => {
    const v = ui.nc.trim();
    if (!v) return;
    if (M.categories.some((c) => c.name === v)) { alert('同名のカテゴリが既にあります'); return; }
    updateData((d) => { d.masters.categories.push({ name: v }); });
    setUi({ nc: '' });
  };

  const onCatDel = (name: string) => updateData((d) => { d.masters.categories = d.masters.categories.filter((x) => x.name !== name); });

  const onPfAdd = () => {
    const pf = ui.pf;
    if (!pf.id || !pf.name) { alert('商品コードと商品名は必須です'); return; }
    if (M.products.some((p) => p.id === pf.id)) { alert('商品コード ' + pf.id + ' は既に登録されています'); return; }
    const cat = pf.cat || (M.categories[0] ? M.categories[0].name : '未分類');
    updateData((d) => {
      if (!d.masters.categories.some((c) => c.name === cat)) d.masters.categories.push({ name: cat });
      d.masters.products.push({ id: pf.id, name: pf.name, cat, maker: pf.maker, jan: pf.jan });
    });
    setUi({ pf: { id: '', name: '', cat, maker: '', jan: '' } });
  };

  const setProdField = (id: string, key: 'name' | 'maker' | 'jan' | 'cat', v: string) =>
    updateData((d) => {
      const idx = d.masters.products.findIndex((x) => x.id === id);
      if (idx >= 0) (d.masters.products[idx] as unknown as Record<string, string>)[key] = v;
    });

  const q = ui.productSearch.trim().toLowerCase();
  const shown = q ? M.products.filter((p) => [p.id, p.name, p.cat, p.maker, p.jan].join(' ').toLowerCase().includes(q)) : M.products;
  const pfCat = ui.pf.cat || (M.categories[0]?.name ?? '');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          商品マスタ<span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>　{retailer!.name}・{M.products.length}商品・商品コードキーで上書き／追加（自動採番なし）</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setUi({ modal: 'csv', csv: makeCsvImportState('products') })}
          style={{ padding: '6px 16px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}
        >
          CSV取込
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 2px' }}>商品カテゴリ</div>
      <div style={{ fontSize: 11.5, color: '#999', marginBottom: 10 }}>商品との紐付けは下の商品一覧の「カテゴリ」列で設定します。</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, background: '#faf9f6', border: '1px solid #eceae3', borderRadius: 6, padding: '10px 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>追加:</span>
        <input value={ui.nc} onChange={(e) => setUi({ nc: e.target.value })} placeholder="新しいカテゴリ名" style={{ width: 220, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <button onClick={onNcAdd} style={{ padding: '5px 16px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>追加</button>
      </div>
      <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, overflow: 'hidden', maxWidth: 520 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <tbody>
            {M.categories.map((c, i) => {
              const count = M.products.filter((p) => p.cat === c.name).length;
              const usedInSheet = D.sheets.some((sh) => sh.cats.some((x) => x.name === c.name));
              const canDel = count === 0 && !usedInSheet;
              return (
                <tr key={c.name} style={{ background: i % 2 ? '#fbfaf7' : '#fff' }}>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '6px 14px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '6px 14px', color: '#999', whiteSpace: 'nowrap' }}>{count}商品</td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '4px 14px', textAlign: 'right' }}>
                    {canDel && <button onClick={() => onCatDel(c.name)} style={{ border: 'none', background: 'transparent', color: '#a88', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}>削除</button>}
                    {!canDel && <span style={{ fontSize: 10.5, color: '#bbb' }}>使用中</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: '22px 0 2px' }}>商品一覧</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', background: '#faf9f6', border: '1px solid #eceae3', borderRadius: 6, padding: '10px 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>追加:</span>
        <input value={ui.pf.id} onChange={(e) => setUi({ pf: { ...ui.pf, id: e.target.value } })} placeholder="商品コード" style={{ width: 100, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <input value={ui.pf.name} onChange={(e) => setUi({ pf: { ...ui.pf, name: e.target.value } })} placeholder="商品名" style={{ width: 180, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <select value={pfCat} onChange={(e) => setUi({ pf: { ...ui.pf, cat: e.target.value } })} style={{ fontSize: 12, padding: 5, border: '1px solid #ddd9d0', borderRadius: 4, background: '#fff' }}>
          {M.categories.map((o) => (
            <option key={o.name} value={o.name}>{o.name}</option>
          ))}
        </select>
        <input value={ui.pf.maker} onChange={(e) => setUi({ pf: { ...ui.pf, maker: e.target.value } })} placeholder="製造業者" style={{ width: 110, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <input value={ui.pf.jan} onChange={(e) => setUi({ pf: { ...ui.pf, jan: e.target.value } })} placeholder="JANコード" style={{ width: 126, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        <button onClick={onPfAdd} style={{ padding: '5px 16px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>追加</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input value={ui.productSearch} onChange={(e) => setUi({ productSearch: e.target.value })} placeholder="🔍 商品コード・商品名・カテゴリ・製造業者・JANで検索" style={{ width: 340, fontSize: 12, padding: '6px 10px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        {!!q && (
          <span style={{ fontSize: 11, color: '#999' }}>{M.products.length}件中 {shown.length}件表示
            <span onClick={() => setUi({ productSearch: '' })} style={{ color: '#1f6e43', cursor: 'pointer', textDecoration: 'underline' }}>クリア</span>
          </span>
        )}
      </div>
      <div className="tbl-scroll" style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, maxWidth: 980 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr className="sticky-head">
              {['商品コード（SYOCD1）', '商品名（SYONMの元）', 'カテゴリ', '製造業者', 'JANコード（JAN）'].map((h) => (
                <th key={h} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '6px 12px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', textAlign: h === '商品名（SYONMの元）' || h === '製造業者' ? 'left' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? '#fbfaf7' : '#fff' }}>
                <td style={{ borderBottom: '1px solid #f0eee8', padding: '4px 12px', fontFamily: 'ui-monospace,Consolas,monospace', color: '#777' }}>{p.id}</td>
                <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={p.name} onChange={(e) => setProdField(p.id, 'name', e.target.value)} style={{ ...cellInput(190), fontWeight: 600 }} /></td>
                <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center' }}>
                  <select value={p.cat} onChange={(e) => setProdField(p.id, 'cat', e.target.value)} style={{ fontSize: 11.5, padding: '2px 3px', border: '1px solid #ddd9d0', borderRadius: 3, background: '#fff', color: '#555' }}>
                    {M.categories.map((o) => (
                      <option key={o.name} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={p.maker} onChange={(e) => setProdField(p.id, 'maker', e.target.value)} style={cellInput(110)} /></td>
                <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px' }}><input value={p.jan || ''} onChange={(e) => setProdField(p.id, 'jan', e.target.value)} style={{ ...cellInput(126), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>JANコードは帳簿CSVのJAN列に出力されます。商品名は「商品コード＋イベント名＋カテゴリ＋黒丸表番号＋商品名」に連結されます。</div>
    </div>
  );
}
