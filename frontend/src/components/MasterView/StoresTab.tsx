import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { storesSorted } from '../../lib/grid';
import { makeCsvImportState } from '../../lib/csvImport';

const cellInput = (w: number): React.CSSProperties => ({ width: w, fontSize: 12, padding: '3px 6px', border: '1px solid #e4e1d9', borderRadius: 3 });

export function StoresTab() {
  const { retailer, data, updateData, ui, setUi } = useStore();
  const D = data!;
  const M = D.masters;
  const stores = useMemo(() => storesSorted(M), [M]);

  const setField = (code: string, key: 'name' | 'zip' | 'addr' | 'tel' | 'fax' | 'haicd' | 'dept', v: string) =>
    updateData((d) => {
      const idx = d.masters.stores.findIndex((x) => x.code === code);
      if (idx >= 0) (d.masters.stores[idx] as unknown as Record<string, string>)[key] = v;
    });

  const onCode = (oldCode: string, v: string) => {
    const val = v.trim();
    if (!val) return;
    if (val !== oldCode && M.stores.some((x) => x.code === val)) { alert('店番 ' + val + ' は既に使われています'); return; }
    updateData((d) => {
      const idx = d.masters.stores.findIndex((x) => x.code === oldCode);
      if (idx < 0) return;
      d.masters.stores[idx].code = val;
      d.sheets.forEach((sh) => {
        if (sh.units[oldCode] !== undefined) { sh.units[val] = sh.units[oldCode]; delete sh.units[oldCode]; }
      });
    });
  };

  const onDel = (code: string, name: string) => {
    if (!confirm('店舗「' + name + '」（店番 ' + code + '）を削除しますか？各黒丸表の単位割当も解除されます。')) return;
    updateData((d) => {
      d.masters.stores = d.masters.stores.filter((x) => x.code !== code);
      d.sheets.forEach((sh) => { delete sh.units[code]; });
    });
  };

  const onAdd = () => {
    const nf = ui.nf;
    if (!nf.code.trim() || !nf.name.trim()) { alert('店番と店舗名称は必須です'); return; }
    if (M.stores.some((x) => x.code === nf.code.trim())) { alert('店番 ' + nf.code + ' は既に登録されています'); return; }
    updateData((d) => {
      d.masters.stores.push({ code: nf.code.trim(), name: nf.name.trim(), zip: nf.zip, addr: nf.addr, tel: nf.tel, fax: '', haicd: '0', dept: '', area: '', bl: '' });
    });
    setUi({ nf: { code: '', name: '', zip: '', addr: '', tel: '' } });
  };

  const q = ui.storeSearch.trim().toLowerCase();
  const shown = q ? stores.filter((s) => [s.code, s.name, s.addr, s.area, s.bl, s.zip, s.tel].join(' ').toLowerCase().includes(q)) : stores;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          店舗マスタ<span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>　{retailer!.name}・{stores.length}店・店番キーで上書き／追加</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setUi({ modal: 'csv', csv: makeCsvImportState('stores') })}
          style={{ padding: '6px 16px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}
        >
          CSV取込
        </button>
      </div>

      <div style={{ border: '1px solid #eceae3', background: '#faf9f6', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>店舗を追加</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={ui.nf.code} onChange={(e) => setUi({ nf: { ...ui.nf, code: e.target.value } })} placeholder="店番" style={{ width: 80, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4, fontFamily: 'ui-monospace,Consolas,monospace' }} />
          <input value={ui.nf.name} onChange={(e) => setUi({ nf: { ...ui.nf, name: e.target.value } })} placeholder="店舗名称" style={{ width: 180, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
          <input value={ui.nf.zip} onChange={(e) => setUi({ nf: { ...ui.nf, zip: e.target.value } })} placeholder="郵便番号" style={{ width: 88, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
          <input value={ui.nf.addr} onChange={(e) => setUi({ nf: { ...ui.nf, addr: e.target.value } })} placeholder="住所" style={{ width: 220, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
          <input value={ui.nf.tel} onChange={(e) => setUi({ nf: { ...ui.nf, tel: e.target.value } })} placeholder="電話番号" style={{ width: 110, fontSize: 12, padding: '5px 8px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
          <button onClick={onAdd} style={{ padding: '5px 16px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>追加</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input value={ui.storeSearch} onChange={(e) => setUi({ storeSearch: e.target.value })} placeholder="🔍 店番・店舗名称・住所・エリア・BL名で検索" style={{ width: 320, fontSize: 12, padding: '6px 10px', border: '1px solid #ddd9d0', borderRadius: 4 }} />
        {!!q && (
          <span style={{ fontSize: 11, color: '#999' }}>{stores.length}件中 {shown.length}件表示
            <span onClick={() => setUi({ storeSearch: '' })} style={{ color: '#1f6e43', cursor: 'pointer', textDecoration: 'underline' }}>クリア</span>
          </span>
        )}
      </div>

      <div style={{ border: '1px solid #ddd9d0', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
        <div className="tbl-scroll">
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr className="sticky-head">
                {['店番', '店舗名称（HAINM）', '郵便番号（HAPOST）', '住所（HAIADD1）', '電話番号（HATEL）', 'FAX（HAFAX・任意）', '配送先コード1（HAICD_1）', '部署名（HAIBNM・任意）', 'エリア', 'BL名', ''].map((h) => (
                  <th key={h} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '6px 10px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', textAlign: h === '店舗名称（HAINM）' || h === '住所（HAIADD1）' || h === 'エリア' || h === 'BL名' ? 'left' : undefined }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s, i) => (
                <tr key={s.code} style={{ background: i % 2 ? '#fbfaf7' : '#fff' }}>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}>
                    <input defaultValue={s.code} onBlur={(e) => onCode(s.code, e.target.value)} style={{ ...cellInput(58), fontFamily: 'ui-monospace,Consolas,monospace', color: '#555' }} />
                  </td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.name} onChange={(e) => setField(s.code, 'name', e.target.value)} style={{ ...cellInput(150), fontWeight: 600 }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.zip} onChange={(e) => setField(s.code, 'zip', e.target.value)} style={{ ...cellInput(74), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.addr} onChange={(e) => setField(s.code, 'addr', e.target.value)} style={{ ...cellInput(220), fontSize: 11.5 }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.tel} onChange={(e) => setField(s.code, 'tel', e.target.value)} style={{ ...cellInput(100), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.fax || ''} onChange={(e) => setField(s.code, 'fax', e.target.value)} style={{ ...cellInput(100), fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px', textAlign: 'center' }}><input value={s.haicd || '0'} onChange={(e) => setField(s.code, 'haicd', e.target.value)} style={{ ...cellInput(52), textAlign: 'center', fontFamily: 'ui-monospace,Consolas,monospace' }} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px' }}><input value={s.dept || ''} onChange={(e) => setField(s.code, 'dept', e.target.value)} style={cellInput(80)} /></td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '4px 10px', whiteSpace: 'nowrap', color: '#999', fontSize: 11 }}>{s.area || '—'}</td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '4px 10px', whiteSpace: 'nowrap', color: '#999', fontSize: 11 }}>{s.bl || '—'}</td>
                  <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center' }}>
                    <button onClick={() => onDel(s.code, s.name)} style={{ border: 'none', background: 'transparent', color: '#a88', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#888', margin: '8px 0 0' }}>店舗名称は帳簿CSVの配送先名（HAINM）にそのまま出力されます（例: サツドラめむろ店）。配送先コード1の既定は 0。店番は重複しないようにしてください。</div>
    </div>
  );
}
