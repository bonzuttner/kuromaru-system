import { useState } from 'react';
import { useStore } from '../../state/store';
import { compressImage, readAsDataUrl } from '../../lib/image';
import { api } from '../../api';
import { ModalHeader, ModalShell } from './Modals';

export function UnitImageModal() {
  const { retailerId, data, ui, setUi, updateData } = useStore();
  const [saving, setSaving] = useState(false);
  const target = ui.unitImgStore;
  const file = ui.unitImgFile;
  const previewUrl = ui.unitImgPreviewUrl;

  const close = () => setUi({ modal: null, unitImgFile: null, unitImgPreviewUrl: '' });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2097152) { alert('ファイルサイズが大きすぎます（最大 2MB）'); return; }
    const url = await readAsDataUrl(f);
    setUi({ unitImgFile: f, unitImgPreviewUrl: url });
  };

  const onSave = async () => {
    if (!target || !file || !previewUrl) { alert('画像を選択してください'); return; }
    setSaving(true);
    try {
      const blob = await compressImage(file);
      const { url } = await api.uploadImage(retailerId, blob, target.cat + '_' + target.count + '.jpg');
      const si = Math.min(ui.sheetIdx, data!.sheets.length - 1);
      const sheet = data!.sheets[si];
      const key = sheet.id + ':' + target.cat + ':count:' + target.count;
      updateData((d) => { d.shelfImages[key] = url; });
      close();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!(file && previewUrl) && !saving;

  return (
    <ModalShell width={520} onClose={close}>
      <ModalHeader title="棚割り画像" note={target?.name || ''} onClose={close} />
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 12 }}>この棚割り数の見本画像をアップロードします（最大 2MB）。</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, background: '#faf9f6', border: '1px dashed #b0aca2', padding: 12, borderRadius: 6 }}>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} style={{ fontSize: 12, flex: 1 }} />
          <span style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>{file ? file.name : '画像を選択'}</span>
        </div>
        {previewUrl && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>プレビュー</div>
            <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: 160, border: '1px solid #ddd9d0', borderRadius: 4, objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={close} style={{ padding: '7px 14px', border: '1px solid #ddd9d0', background: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', color: '#555' }}>キャンセル</button>
          <button
            onClick={onSave}
            disabled={!canSave}
            style={canSave
              ? { padding: '7px 18px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }
              : { padding: '7px 18px', border: '1px solid #ddd9d0', background: '#f0efe9', color: '#aaa', borderRadius: 4, fontSize: 12.5, cursor: 'not-allowed', fontWeight: 600 }}
          >
            {saving ? '保存中…' : '保存する'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
