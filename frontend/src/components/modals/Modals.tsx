import { useStore } from '../../state/store';
import { ProductsModal } from './ProductsModal';
import { ShelfModal } from './ShelfModal';
import { DeliveryModal } from './DeliveryModal';
import { CsvImportModal } from './CsvImportModal';
import { NewSheetModal } from './NewSheetModal';
import { UnitImageModal } from './UnitImageModal';

export function Modals() {
  const { ui } = useStore();
  switch (ui.modal) {
    case 'products':
      return <ProductsModal />;
    case 'shelf':
      return <ShelfModal />;
    case 'delivery':
      return <DeliveryModal />;
    case 'csv':
      return <CsvImportModal />;
    case 'newsheet':
      return <NewSheetModal />;
    case 'unitimg':
      return <UnitImageModal />;
    default:
      return null;
  }
}

export function ModalShell({ width, children, onClose }: { width: number; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(22,20,16,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 8, width, maxWidth: '94vw', maxHeight: '84vh', overflow: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.25)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, note, onClose }: { title: React.ReactNode; note?: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', fontSize: 14, fontWeight: 700, borderBottom: '1px solid #eceae3', position: 'sticky', top: 0, background: '#fff' }}>
      {title}
      {note && <span style={{ fontSize: 11, fontWeight: 400, color: '#999', marginLeft: 8 }}>{note}</span>}
      <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#999', fontSize: 16, cursor: 'pointer' }}>✕</button>
    </div>
  );
}
