export function parseCsv(text: string): string[][] {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length)
    .map((l) => l.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1')));
}

export function readCsvFile(file: File, cb: (rows: string[][]) => void) {
  const r = new FileReader();
  r.onload = () => {
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(r.result as ArrayBuffer);
    } catch {
      text = new TextDecoder('shift_jis').decode(r.result as ArrayBuffer);
    }
    cb(parseCsv(text));
  };
  r.readAsArrayBuffer(file);
}

export function downloadCsv(name: string, text: string) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function csvCell(value: unknown): string {
  const x = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x;
}
