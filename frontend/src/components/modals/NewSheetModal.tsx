import { useStore } from '../../state/store';
import { ModalHeader, ModalShell } from './Modals';

function modeBtnStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '9px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
    border: active ? '2px solid #1e6a41' : '1px solid #ddd9d0',
    background: active ? '#f4f7f3' : '#fff',
    color: active ? '#1e5232' : '#666',
    fontWeight: active ? 700 : 400,
  };
}

export function NewSheetModal() {
  const { data, ui, setUi, updateData } = useStore();
  const D = data!;
  const sheets = D.sheets;
  const si = Math.min(ui.sheetIdx, sheets.length - 1);
  const templates = D.templates || [];
  const ns = ui.ns;

  const close = () => setUi({ modal: null });

  const onCreate = () => {
    const name = ns.name.trim() || '黒丸表' + String.fromCharCode(65 + sheets.length);
    if (ns.mode === 'template' && !ns.tplId) { alert('使用するテンプレートを選んでください'); return; }
    const newIdx = sheets.length;
    updateData((d) => {
      let sheetNew;
      if (ns.mode === 'dup') {
        sheetNew = structuredClone(d.sheets[si]);
        sheetNew.name = name;
      } else if (ns.mode === 'template') {
        const tpl = (d.templates || []).find((t) => t.id === ns.tplId);
        if (!tpl) return;
        sheetNew = structuredClone(tpl.sheet);
        sheetNew.name = name;
      } else {
        sheetNew = { id: '', cats: [], delivery: {}, units: {}, manual: {}, name, unitOptions: [4, 5, 6, 7, 8] };
      }
      sheetNew.id = 'S' + Date.now();
      d.sheets.push(sheetNew);
    });
    setUi({ sheetIdx: newIdx, modal: ns.mode === 'blank' ? 'products' : null });
  };

  return (
    <ModalShell width={440} onClose={close}>
      <ModalHeader title="黒丸表の新規作成" onClose={close} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>名称</div>
        <input
          value={ns.name}
          onChange={(e) => setUi({ ns: { ...ns, name: e.target.value } })}
          placeholder="例: 黒丸表C 胃腸薬（4月着）"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '7px 9px', border: '1px solid #ddd9d0', borderRadius: 4, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setUi({ ns: { ...ns, mode: 'dup' } })} style={modeBtnStyle(ns.mode === 'dup')}>現在の表を複製</button>
          <button onClick={() => setUi({ ns: { ...ns, mode: 'template' } })} style={modeBtnStyle(ns.mode === 'template')}>テンプレートから</button>
          <button onClick={() => setUi({ ns: { ...ns, mode: 'blank' } })} style={modeBtnStyle(ns.mode === 'blank')}>空から作成</button>
        </div>
        {ns.mode === 'template' && (
          <div style={{ marginBottom: 14 }}>
            {templates.length > 0 ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>使用するテンプレート</div>
                <select
                  value={ns.tplId}
                  onChange={(e) => setUi({ ns: { ...ns, tplId: e.target.value } })}
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '7px 9px', border: '1px solid #ddd9d0', borderRadius: 4, background: '#fff' }}
                >
                  <option value="">— 選択してください —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#999', marginTop: 5 }}>商品構成・棚割り・単位・店舗割当・●を引き継ぎます（配送情報の日付は空になります）。</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#999', background: '#faf9f6', border: '1px solid #eceae3', borderRadius: 4, padding: '10px 12px' }}>
                保存済みのテンプレートがありません。黒丸表ツールバーの「テンプレート保存」で作成できます。
              </div>
            )}
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <button onClick={onCreate} style={{ padding: '8px 22px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>作成する</button>
        </div>
      </div>
    </ModalShell>
  );
}
