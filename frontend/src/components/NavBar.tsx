import type { CSSProperties } from 'react';
import { useStore } from '../state/store';

function navBtnStyle(active: boolean): CSSProperties {
  return {
    border: 'none',
    background: active ? 'rgba(255,255,255,.18)' : 'transparent',
    color: '#fff',
    fontSize: 12.5,
    padding: '7px 12px',
    borderRadius: 5,
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
  };
}

function masterItemStyle(active: boolean): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: active ? '#eef3ec' : 'transparent',
    color: active ? '#1e5232' : '#444',
    fontWeight: active ? 700 : 400,
    fontSize: 12.5,
    padding: '7px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    margin: '1px 0',
  };
}

export function NavBar() {
  const { retailers, retailerId, selectRetailer, ui, setUi } = useStore();

  const closeMenus = () => setUi({ masterMenuOpen: false, modal: null, csv: null });
  const gotoSheet = () => setUi({ view: 'sheet', masterMenuOpen: false, modal: null, csv: null });
  const gotoShipList = () => setUi({ view: 'shiplist', masterMenuOpen: false, modal: null, csv: null });
  const gotoMaster = (mtab: 'retailers' | 'stores' | 'products') => setUi({ view: 'master', mtab, masterMenuOpen: false });

  return (
    <>
      {ui.masterMenuOpen && (
        <div onClick={closeMenus} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />
      )}
      <div
        style={{
          background: '#1e6a41', color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 14px', height: 48, position: 'sticky', top: 0, zIndex: 60,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
          <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#15130f', border: '2px solid #fff', display: 'inline-block' }} />
          黒丸表作成
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>小売店</span>
          <select
            value={retailerId}
            onChange={(e) => selectRetailer(e.target.value)}
            style={{ fontSize: 12.5, padding: '4px 8px', border: '1px solid rgba(255,255,255,.4)', borderRadius: 4, background: '#fff', color: '#1e5232', fontWeight: 600 }}
          >
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.25)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={gotoSheet} style={navBtnStyle(ui.view === 'sheet')}>黒丸表</button>
          <button onClick={gotoShipList} style={navBtnStyle(ui.view === 'shiplist')}>発送リスト</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setUi({ masterMenuOpen: !ui.masterMenuOpen })} style={navBtnStyle(ui.view === 'master')}>
              マスタ ▾
            </button>
            {ui.masterMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 36, right: 0, background: '#fff', borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,.2)', padding: 6, minWidth: 150, zIndex: 80,
                }}
              >
                <button onClick={() => gotoMaster('retailers')} style={masterItemStyle(ui.view === 'master' && ui.mtab === 'retailers')}>小売店マスタ</button>
                <button onClick={() => gotoMaster('stores')} style={masterItemStyle(ui.view === 'master' && ui.mtab === 'stores')}>店舗マスタ</button>
                <button onClick={() => gotoMaster('products')} style={masterItemStyle(ui.view === 'master' && ui.mtab === 'products')}>商品マスタ</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
