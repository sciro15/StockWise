import { MovementType, ProductStatus } from '../models/inventory.models';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

export function formatCOP(value: number): string {
  return copFormatter.format(Math.round(value || 0));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value || 0);
}

export function formatDateBogota(isoOrDate: string, includeTime = false): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsed);
}

export function toBogotaInputDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function daysAgoIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function movementTypeLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    ENTRADA: 'Entrada',
    SALIDA: 'Salida',
    AJUSTE_POSITIVO: 'Ajuste positivo',
    AJUSTE_NEGATIVO: 'Ajuste negativo',
  };
  return labels[type];
}

export function isInboundMovement(type: MovementType): boolean {
  return type === 'ENTRADA' || type === 'AJUSTE_POSITIVO';
}

export function productStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    NORMAL: 'Óptimo',
    STOCK_BAJO: 'Stock bajo',
    AGOTADO: 'Agotado',
    EXCESO: 'Exceso',
  };
  return labels[status];
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number): string => {
    const str = String(cell ?? '').replaceAll('"', '""');
    return `"${str}"`;
  };

  const csvLines = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => row.map(escapeCell).join(';')),
  ];

  // BOM UTF-8 para compatibilidad directa con Microsoft Excel en español
  const blob = new Blob(['\ufeff' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

