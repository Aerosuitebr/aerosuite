import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

describe('SheetJS compatibility', () => {
  it('reads a workbook and renders the first sheet as HTML', () => {
    const source = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Peça', 'Quantidade'],
      ['PN-123', 2],
    ]);
    XLSX.utils.book_append_sheet(source, sheet, 'Estoque');

    const bytes = XLSX.write(source, { bookType: 'xlsx', type: 'array' });
    const parsed = XLSX.read(bytes, { type: 'array' });
    const html = XLSX.utils.sheet_to_html(parsed.Sheets['Estoque'], {
      id: 'planilha-biblioteca',
    });

    expect(parsed.SheetNames).toEqual(['Estoque']);
    expect(html).toContain('id="planilha-biblioteca"');
    expect(html).toContain('PN-123');
  });
});
