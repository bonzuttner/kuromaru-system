import { useState } from 'react';
import { useStore } from '../../state/store';
import { pById } from '../../lib/grid';
import { compressImage } from '../../lib/image';
import { api } from '../../api';
import { ModalHeader, ModalShell } from './Modals';
import type { DeliveryInfo } from '../../types';

const fieldStyle = (w: number): React.CSSProperties => ({ width: w, fontSize: 11.5, padding: '3px 5px', border: '1px solid #ddd9d0', borderRadius: 3, boxSizing: 'border-box' });

export function DeliveryModal() {
  const { retailerId, data, updateData, ui, setUi } = useStore();
  const [uploading, setUploading] = useState<string | null>(null);
  const D = data!;
  const M = D.masters;
  const si = Math.min(ui.sheetIdx, D.sheets.length - 1);
  const sheet = D.sheets[si];
  const cats = sheet.cats;

  const close = () => setUi({ modal: null });

  const setField = (pid: string, key: keyof DeliveryInfo, v: string) =>
    updateData((d) => {
      const rec = d.sheets[si].delivery[pid] || (d.sheets[si].delivery[pid] = {});
      rec[key] = v;
    });

  const onThumb = async (pid: string, file: File | undefined) => {
    if (!file) return;
    setUploading(pid);
    try {
      const blob = await compressImage(file);
      const { url } = await api.uploadImage(retailerId, blob, pid + '.jpg');
      updateData((d) => { d.productThumbs[pid] = url; });
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(null);
    }
  };
  const onRemoveThumb = (pid: string) => updateData((d) => { delete d.productThumbs[pid]; });

  return (
    <ModalShell width={840} onClose={close}>
      <ModalHeader title="配送情報" note="対象商品ごと・YYYY/MM/DD" onClose={close} />
      <div style={{ padding: '14px 18px' }}>
        {cats.map((c) => (
          <div key={c.name} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e5232', marginBottom: 6 }}>{c.name}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['商品', 'サムネイル', 'CD', '入稿期限', '店舗着', 'ラウンダー', 'JANコード', '帯', '同梱', '備考'].map((h) => (
                      <th key={h} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '5px 10px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', textAlign: h === '商品' ? 'left' : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.productIds.map((pid, i) => {
                    const d = sheet.delivery[pid] || {};
                    const thumbSrc = D.productThumbs[pid] || '';
                    return (
                      <tr key={pid}>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 10px', whiteSpace: 'nowrap', fontWeight: 600 }}>{'①②③④⑤⑥⑦⑧⑨⑩⑪⑫'[i]} {pById(M, pid).name}</td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            {thumbSrc && <img src={thumbSrc} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd9d0', display: 'block' }} />}
                            <label style={{ fontSize: 10.5, color: '#1f6e43', cursor: 'pointer', textDecoration: 'underline' }}>
                              <input type="file" accept="image/*" onChange={(e) => onThumb(pid, e.target.files?.[0])} style={{ display: 'none' }} />
                              {uploading === pid ? '送信中…' : thumbSrc ? '変更' : '＋ 追加'}
                            </label>
                            {thumbSrc && <button onClick={() => onRemoveThumb(pid)} style={{ border: 'none', background: 'transparent', color: '#a88', fontSize: 10.5, cursor: 'pointer' }}>✕</button>}
                          </div>
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.cd || ''} onChange={(e) => setField(pid, 'cd', e.target.value)} style={fieldStyle(76)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.deadline || ''} onChange={(e) => setField(pid, 'deadline', e.target.value)} style={fieldStyle(92)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.arrival || ''} onChange={(e) => setField(pid, 'arrival', e.target.value)} style={fieldStyle(92)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.rounder || ''} onChange={(e) => setField(pid, 'rounder', e.target.value)} style={fieldStyle(92)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.jan || ''} onChange={(e) => setField(pid, 'jan', e.target.value)} style={fieldStyle(118)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.band || ''} onChange={(e) => setField(pid, 'band', e.target.value)} style={fieldStyle(84)} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input type="checkbox" checked={d.doukon === '○'} onChange={(e) => setField(pid, 'doukon', e.target.checked ? '○' : '×')} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                        </td>
                        <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 4px', textAlign: 'center' }}>
                          <input value={d.note || ''} onChange={(e) => setField(pid, 'note', e.target.value)} style={fieldStyle(160)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'right' }}>
          <button onClick={close} style={{ padding: '7px 20px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>完了</button>
        </div>
      </div>
    </ModalShell>
  );
}
