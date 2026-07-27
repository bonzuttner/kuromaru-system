import { useStore } from '../../state/store';
import { RetailersTab } from './RetailersTab';
import { StoresTab } from './StoresTab';
import { ProductsTab } from './ProductsTab';

function tabStyle(on: boolean): React.CSSProperties {
  return {
    padding: '6px 18px', fontSize: 12.5, cursor: 'pointer', borderRadius: 16,
    border: on ? '1px solid #1e6a41' : '1px solid #ddd9d0',
    background: on ? '#1e6a41' : '#fff',
    color: on ? '#fff' : '#666',
    fontWeight: on ? 600 : 400,
  };
}

export function MasterView() {
  const { ui, setUi } = useStore();
  return (
    <div style={{ padding: '16px 20px 56px', maxWidth: 1280 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setUi({ mtab: 'retailers' })} style={tabStyle(ui.mtab === 'retailers')}>小売店</button>
        <button onClick={() => setUi({ mtab: 'stores' })} style={tabStyle(ui.mtab === 'stores')}>店舗</button>
        <button onClick={() => setUi({ mtab: 'products' })} style={tabStyle(ui.mtab === 'products')}>商品</button>
      </div>
      {ui.mtab === 'retailers' && <RetailersTab />}
      {ui.mtab === 'stores' && <StoresTab />}
      {ui.mtab === 'products' && <ProductsTab />}
    </div>
  );
}
