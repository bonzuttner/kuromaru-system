import { useStore } from '../../state/store';
import { toggleCatInSheet, toggleProdInSheet } from '../../lib/grid';
import { ModalHeader, ModalShell } from './Modals';

export function ProductsModal() {
  const { data, updateData, ui, setUi } = useStore();
  const D = data!;
  const M = D.masters;
  const si = Math.min(ui.sheetIdx, D.sheets.length - 1);
  const sheet = D.sheets[si];
  const cats = sheet.cats;

  const close = () => setUi({ modal: null });

  return (
    <ModalShell width={600} onClose={close}>
      <ModalHeader title="商品を選ぶ" note="この黒丸表のみ・即時反映" onClose={close} />
      <div style={{ padding: '14px 18px' }}>
        {M.categories.map((mc) => {
          const inSheet = cats.find((c) => c.name === mc.name);
          const prods = M.products.filter((p) => p.cat === mc.name);
          return (
            <div key={mc.name} style={{ border: '1px solid #eceae3', borderRadius: 6, marginBottom: 10, overflow: 'hidden' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#faf9f6', padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#333', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!inSheet}
                  onChange={() => updateData((d) => toggleCatInSheet(d, si, mc.name))}
                />
                {mc.name}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', padding: '8px 16px' }}>
                {prods.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: '#444' }}>
                    <input
                      type="checkbox"
                      checked={!!(inSheet && inSheet.productIds.includes(p.id))}
                      disabled={!inSheet}
                      onChange={() => updateData((d) => toggleProdInSheet(d, si, mc.name, p.id))}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: 'right' }}>
          <button onClick={close} style={{ padding: '7px 20px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>完了</button>
        </div>
      </div>
    </ModalShell>
  );
}
