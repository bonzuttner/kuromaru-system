import './App.css';
import { StoreProvider, useStore } from './state/store';
import { NavBar } from './components/NavBar';
import { SheetView } from './components/SheetView/SheetView';
import { ShipListView } from './components/ShipListView';
import { MasterView } from './components/MasterView/MasterView';
import { Modals } from './components/modals/Modals';

function AppShell() {
  const { retailersLoading, loading, error, clearError, retailer, data, ui } = useStore();

  if (retailersLoading) {
    return <CenteredMessage text="読み込み中…" />;
  }
  if (!retailer) {
    return <CenteredMessage text="小売店がありません。バックエンドのシードデータを確認してください。" />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div
          style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: 200, background: '#fbf1ef',
            border: '1px solid #e5c8c1', color: '#a04030', borderRadius: 6, padding: '10px 16px',
            fontSize: 12.5, maxWidth: 360, boxShadow: '0 8px 24px rgba(0,0,0,.15)',
          }}
        >
          通信エラー: {error}
          <button
            onClick={clearError}
            style={{ marginLeft: 10, border: 'none', background: 'transparent', color: '#a04030', cursor: 'pointer', textDecoration: 'underline' }}
          >
            閉じる
          </button>
        </div>
      )}
      <NavBar />
      {loading || !data ? (
        <CenteredMessage text="読み込み中…" />
      ) : (
        <>
          {ui.view === 'sheet' && <SheetView />}
          {ui.view === 'shiplist' && <ShipListView />}
          {ui.view === 'master' && <MasterView />}
          <Modals />
        </>
      )}
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>
      {text}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
