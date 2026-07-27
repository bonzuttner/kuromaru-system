import { useStore } from '../../state/store';
import { readCsvFile, downloadCsv } from '../../lib/csv';
import { applyCsvImport, csvTemplateFor, processCsvRows, type CsvImportType } from '../../lib/csvImport';
import { ModalHeader, ModalShell } from './Modals';

export function CsvImportModal() {
  const { data, ui, setUi, updateData } = useStore();
  const csv = ui.csv!;
  const D = data!;
  const si = Math.min(ui.sheetIdx, D.sheets.length - 1);
  const sheet = D.sheets[si];

  const close = () => setUi({ modal: null, csv: null });

  const okCount = csv.rows.filter((x) => !x.err).length;
  const ngCount = csv.rows.filter((x) => x.err).length;
  const canApply = !!csv.parsed && okCount > 0;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    readCsvFile(file, (rows) => {
      const result = processCsvRows(csv.type, D.masters, rows);
      setUi({ csv: { ...csv, fileName: file.name, rows: result.rows, errors: result.errors, parsed: result.parsed } });
    });
  };

  const onApply = () => {
    if (!canApply) return;
    updateData((d) => applyCsvImport(csv.type, d, si, csv.parsed));
    close();
  };

  const onTemplate = () => {
    const { name, text } = csvTemplateFor(csv.type, D.masters, sheet);
    downloadCsv(name, text);
  };

  return (
    <ModalShell width={760} onClose={close}>
      <ModalHeader title={csv.title} onClose={close} />
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 10, lineHeight: 1.7 }}>
          {csv.note}<br />文字コードは UTF-8 / Shift-JIS を自動判定。{' '}
          <button onClick={onTemplate} style={{ border: 'none', background: 'transparent', color: '#1f6e43', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>雛形CSVをダウンロード</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: '#faf9f6', border: '1px dashed #b0aca2', padding: 14, borderRadius: 6 }}>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} style={{ fontSize: 12 }} />
          <span style={{ fontSize: 11.5, color: '#999' }}>{csv.fileName}</span>
        </div>
        {csv.errors.length > 0 && (
          <div style={{ background: '#fbf1ef', border: '1px solid #e5c8c1', borderRadius: 4, padding: '8px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a04030', marginBottom: 4 }}>取り込めない行があります（スキップされます）</div>
            {csv.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 11.5, color: '#a04030' }}>{e.t}</div>
            ))}
          </div>
        )}
        {csv.rows.length > 0 && (
          <>
            <div style={{ fontSize: 11.5, color: '#777', marginBottom: 4 }}>プレビュー（{okCount}件 取込可 / {ngCount}件 エラー）</div>
            <div style={{ overflow: 'auto', maxHeight: 280, border: '1px solid #eceae3', borderRadius: 4, marginBottom: 12 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11.5, width: '100%' }}>
                <thead>
                  <tr>
                    {csv.head.map((h) => (
                      <th key={h} style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '3px 10px', fontSize: 10.5, color: '#777', whiteSpace: 'nowrap', position: 'sticky', top: 0 }}>{h}</th>
                    ))}
                    <th style={{ borderBottom: '1px solid #ddd9d0', background: '#faf9f6', padding: '3px 10px', fontSize: 10.5, color: '#777', position: 'sticky', top: 0 }}>判定</th>
                  </tr>
                </thead>
                <tbody>
                  {csv.rows.map((r, i) => (
                    <tr key={i} style={r.err ? { background: '#fbf1ef' } : undefined}>
                      {r.cells.map((c, j) => (
                        <td key={j} style={{ borderBottom: '1px solid #f0eee8', padding: '2px 10px', whiteSpace: 'nowrap' }}>{c}</td>
                      ))}
                      <td style={{ borderBottom: '1px solid #f0eee8', padding: '2px 10px', whiteSpace: 'nowrap', fontSize: 10.5, color: '#a04030' }}>{r.err}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={close} style={{ padding: '7px 14px', border: '1px solid #ddd9d0', background: '#fff', borderRadius: 4, fontSize: 12.5, cursor: 'pointer', color: '#555' }}>キャンセル</button>
          <button
            onClick={onApply}
            disabled={!canApply}
            style={canApply
              ? { padding: '7px 18px', borderRadius: 4, fontSize: 12.5, fontWeight: 600, border: 'none', background: '#1e6a41', color: '#fff', cursor: 'pointer' }
              : { padding: '7px 18px', borderRadius: 4, fontSize: 12.5, fontWeight: 600, border: '1px solid #ddd9d0', background: '#f0efe9', color: '#aaa', cursor: 'not-allowed' }}
          >
            {canApply ? `取り込む（${okCount}件）` : '取り込む'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export type { CsvImportType };
