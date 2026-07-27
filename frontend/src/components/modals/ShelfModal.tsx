import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { CIRC } from '../../types';
import { pById, storesSorted } from '../../lib/grid';
import { ModalHeader, ModalShell } from './Modals';

function useShelfCats() {
  const { data, updateData, ui, setUi } = useStore();
  const D = data!;
  const M = D.masters;
  const si = Math.min(ui.sheetIdx, D.sheets.length - 1);
  const sheet = D.sheets[si];
  const cats = sheet.cats;
  const stores = storesSorted(M);

  return useMemo(() => {
    return cats.map((c) => {
      const variations = Object.keys(c.countProducts || {}).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
      const storeUnits = stores.map((st) => sheet.units[st.code]).filter(Boolean) as number[];
      const unitList = [...new Set((sheet.unitOptions || []).concat(storeUnits))].filter((n) => n > 0).sort((a, b) => a - b);

      const unitRows = unitList.map((u) => {
        const usedByStores = storeUnits.filter((x) => x === u).length;
        return {
          u,
          label: u + '本単位',
          inStore: usedByStores > 0 ? usedByStores + '店で使用' : '',
          countVal: (c.unitCount || {})[u] ? String((c.unitCount || {})[u]) : '',
          onCount: (v: string) => {
            const nn = parseInt(v, 10);
            const val = nn > 0 ? nn : 0;
            updateData((d) => {
              const cc = d.sheets[si].cats.find((x) => x.name === c.name)!;
              if (!cc.unitCount) cc.unitCount = {};
              if (!cc.countProducts) cc.countProducts = {};
              cc.unitCount[u] = val;
              if (val > 0 && !cc.countProducts[val]) cc.countProducts[val] = cc.productIds.slice(0, Math.min(val, cc.productIds.length));
            });
          },
          onDelUnit: () => {
            const used = stores.filter((st) => sheet.units[st.code] === u).length;
            if (!confirm(u + '本単位を削除しますか？' + (used ? '（' + used + '店の割当も解除されます）' : ''))) return;
            updateData((d) => {
              const shx = d.sheets[si];
              shx.unitOptions = (shx.unitOptions || []).filter((x) => x !== u);
              shx.cats.forEach((cc) => { if (cc.unitCount) delete cc.unitCount[u]; });
              Object.keys(shx.units).forEach((code) => { if (shx.units[code] === u) delete shx.units[code]; });
            });
          },
        };
      });

      const countRows = variations.map((n) => {
        const sel = (c.countProducts || {})[n] || [];
        const ik = sheet.id + ':' + c.name + ':count:' + n;
        const img = D.shelfImages[ik] || (c.images && c.images[n]) || '';
        return {
          count: n,
          usedBy: unitList.filter((u) => ((c.unitCount || {})[u] || 0) === n).map((u) => u + '本').join('・') || '（未割当）',
          selLabel: sel.length + ' / ' + n,
          warn: sel.length !== n,
          img,
          openImg: () => setUi({ modal: 'unitimg', unitImgStore: { kind: 'count', cat: c.name, count: n, name: c.name + ' 棚割り数' + n } }),
          onDelVar: () => {
            if (!confirm('棚割り数 ' + n + ' のバリエーションを削除しますか？（この数を割り当てた単位は「送らない」に戻ります）')) return;
            updateData((d) => {
              const cc = d.sheets[si].cats.find((x) => x.name === c.name)!;
              delete cc.countProducts[n];
              Object.keys(cc.unitCount || {}).forEach((u) => { if (cc.unitCount[Number(u)] === n) cc.unitCount[Number(u)] = 0; });
            });
          },
          checks: c.productIds.map((pid, i) => ({
            label: CIRC[i] + ' ' + pById(M, pid).name,
            on: sel.includes(pid),
            onToggle: () =>
              updateData((d) => {
                const cc = d.sheets[si].cats.find((x) => x.name === c.name)!;
                if (!cc.countProducts) cc.countProducts = {};
                let arr = cc.countProducts[n] || [];
                if (arr.includes(pid)) arr = arr.filter((x) => x !== pid);
                else arr.push(pid);
                cc.countProducts[n] = cc.productIds.filter((p2) => arr.includes(p2));
              }),
          })),
        };
      });

      const useShelf = c.useShelf !== false;
      return {
        name: c.name, unitRows, countRows, useShelf, notUseShelf: !useShelf,
        onToggleUse: () =>
          updateData((d) => {
            const cc = d.sheets[si].cats.find((x) => x.name === c.name)!;
            cc.useShelf = !(cc.useShelf !== false);
          }),
        newUnitVal: ui.shelfNewUnit,
        onNewUnit: (v: string) => setUi({ shelfNewUnit: v }),
        onAddUnit: () => {
          const u = parseInt(ui.shelfNewUnit, 10);
          if (!u || u < 1) { alert('1以上の単位（本数）を入力してください'); return; }
          if ((sheet.unitOptions || []).includes(u)) { alert(u + '本単位は既にあります'); return; }
          updateData((d) => { d.sheets[si].unitOptions = [...new Set((d.sheets[si].unitOptions || []).concat(u))].sort((a, b) => a - b); });
          setUi({ shelfNewUnit: '' });
        },
        noVar: variations.length === 0,
        newVarVal: ui.shelfNewVar[c.name] || '',
        onNewVar: (v: string) => setUi({ shelfNewVar: { ...ui.shelfNewVar, [c.name]: v } }),
        onAddVar: () => {
          const n = parseInt(ui.shelfNewVar[c.name] || '', 10);
          if (!n || n < 1) { alert('1以上の棚割り数を入力してください'); return; }
          if ((c.countProducts || {})[n]) { alert('棚割り数 ' + n + ' は既にあります'); return; }
          updateData((d) => {
            const cc = d.sheets[si].cats.find((x) => x.name === c.name)!;
            if (!cc.countProducts) cc.countProducts = {};
            cc.countProducts[n] = cc.productIds.slice(0, Math.min(n, cc.productIds.length));
          });
          setUi({ shelfNewVar: { ...ui.shelfNewVar, [c.name]: '' } });
        },
      };
    });
  }, [cats, stores, sheet, D, M, si, ui.shelfNewUnit, ui.shelfNewVar, updateData, setUi]);
}

export function ShelfModal() {
  const { setUi } = useStore();
  const shelfCats = useShelfCats();
  const close = () => setUi({ modal: null });

  return (
    <ModalShell width={720} onClose={close}>
      <ModalHeader title="棚割り" note="単位 → 棚割り数 → 送る商品・●は即時再計算" onClose={close} />
      <div style={{ padding: '14px 18px' }}>
        {shelfCats.map((sc) => (
          <div key={sc.name} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e5232' }}>{sc.name}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
                <span style={{ fontSize: 11.5, color: '#777' }}>棚割り設定を使う</span>
                <span
                  onClick={sc.onToggleUse}
                  style={{ display: 'inline-block', width: 34, height: 19, borderRadius: 10, position: 'relative', transition: 'background .15s', background: sc.useShelf ? '#1e6a41' : '#d8d5cc' }}
                >
                  <span style={{ position: 'absolute', top: 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .15s', left: sc.useShelf ? 17 : 2 }} />
                </span>
              </label>
            </div>

            {sc.useShelf ? (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#555', marginBottom: 5 }}>STEP 1　単位ごとの棚割り数</div>
                  <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '5px 14px', fontSize: 11, color: '#777', whiteSpace: 'nowrap', textAlign: 'left' }}>単位</th>
                        <th style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '5px 14px', fontSize: 11, color: '#777', whiteSpace: 'nowrap' }}>棚割り数</th>
                        <th style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '5px 6px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {sc.unitRows.map((r) => (
                        <tr key={r.u}>
                          <td style={{ borderBottom: '1px solid #f0eee8', padding: '4px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {r.label}<span style={{ fontWeight: 400, color: '#bbb', fontSize: 10, marginLeft: 5 }}>{r.inStore}</span>
                          </td>
                          <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 14px', textAlign: 'center' }}>
                            <input
                              type="number" min={0} step={1} value={r.countVal}
                              onChange={(e) => r.onCount(e.target.value)}
                              onKeyDown={numGuard}
                              placeholder="送らない"
                              style={{ width: 82, fontSize: 12, padding: '2px 5px', border: '1px solid #ddd9d0', borderRadius: 3, background: '#fffdf2', color: '#333', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ borderBottom: '1px solid #f0eee8', padding: '3px 6px', textAlign: 'center' }}>
                            <button onClick={r.onDelUnit} title="この単位を削除" style={{ border: 'none', background: 'transparent', color: '#c3a0a0', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#999' }}>単位を追加:</span>
                    <input
                      type="number" min={1} step={1} value={sc.newUnitVal}
                      onChange={(e) => sc.onNewUnit(e.target.value)} onKeyDown={numGuard} placeholder="本"
                      style={{ width: 56, fontSize: 12, padding: '4px 6px', border: '1px solid #ddd9d0', borderRadius: 4 }}
                    />
                    <span style={{ fontSize: 11, color: '#999' }}>本</span>
                    <button onClick={sc.onAddUnit} style={{ padding: '4px 12px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>追加</button>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 340 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#555', marginBottom: 5 }}>STEP 2　棚割り数ごとに送る商品・棚割り表画像</div>
                  {sc.noVar && <div style={{ fontSize: 11.5, color: '#999', padding: '8px 0' }}>棚割り数のバリエーションがまだありません。下の欄から追加してください。</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sc.countRows.map((r) => (
                      <div key={r.count} style={{ border: '1px solid #eceae3', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <b style={{ color: '#1e5232', fontSize: 12.5 }}>棚割り数 {r.count}</b>
                          <span style={{ color: '#aaa', fontSize: 10.5 }}>割当: {r.usedBy}</span>
                          <span style={{ fontSize: 10.5, color: r.warn ? '#a86a1f' : '#999', fontWeight: r.warn ? 700 : 400 }}>送る商品 {r.selLabel}</span>
                          <button onClick={r.onDelVar} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#a88', fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline' }}>このバリエーションを削除</button>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', flex: 1, minWidth: 200 }}>
                            {r.checks.map((c, i) => (
                              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, cursor: 'pointer', color: '#444' }}>
                                <input type="checkbox" checked={c.on} onChange={c.onToggle} style={{ cursor: 'pointer' }} />{c.label}
                              </label>
                            ))}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            {r.img ? (
                              <img src={r.img} title="クリックで差し替え" onClick={r.openImg} style={{ height: 52, maxWidth: 150, objectFit: 'contain', border: '1px solid #ddd9d0', borderRadius: 4, background: '#fff', display: 'block', cursor: 'pointer' }} />
                            ) : (
                              <button onClick={r.openImg} style={{ height: 52, width: 120, border: '1px dashed #b0aca2', borderRadius: 4, background: '#faf9f6', color: '#888', fontSize: 10.5, cursor: 'pointer' }}>＋ 棚割り表画像</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#999' }}>棚割り数を追加:</span>
                    <input
                      type="number" min={1} step={1} value={sc.newVarVal}
                      onChange={(e) => sc.onNewVar(e.target.value)} onKeyDown={numGuard} placeholder="例 4"
                      style={{ width: 64, fontSize: 12, padding: '4px 6px', border: '1px solid #ddd9d0', borderRadius: 4 }}
                    />
                    <button onClick={sc.onAddVar} style={{ padding: '4px 14px', border: '1px solid #1e6a41', background: '#fff', color: '#1e6a41', borderRadius: 4, fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>追加</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: '#aaa', padding: '6px 0' }}>この商品カテゴリは棚割り設定を使いません（全店舗、単位に関わらず対象外）。</div>
            )}
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>棚割り数を空欄にするとその単位の店舗には●が付きません。棚割り表画像は STEP 2 の各バリエーションで登録します。</div>
        <div style={{ textAlign: 'right' }}>
          <button onClick={close} style={{ padding: '7px 20px', border: 'none', background: '#1e6a41', color: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>完了</button>
        </div>
      </div>
    </ModalShell>
  );
}

function numGuard(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
}
