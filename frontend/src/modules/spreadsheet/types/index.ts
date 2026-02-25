export interface SpreadsheetCell {
    value: any;
    formula?: string;
    format?: 'number' | 'currency' | 'percent' | 'date' | 'text';
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
}

export interface SpreadsheetRow {
    height?: number;
    cells: Record<string, SpreadsheetCell>; // Column key (A, B, C...) -> Cell
}

export interface SpreadsheetData {
    rows: Record<number, SpreadsheetRow>; // Row index (1, 2, 3...) -> Row
    columnWidths: Record<string, number>;
}

export interface Spreadsheet {
    id: number;
    name: string;
    data: SpreadsheetData;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

export interface SpreadsheetMetadata {
    id: number;
    name: string;
    updatedAt: string;
}
