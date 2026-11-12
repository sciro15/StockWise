/**
 * Contratos base preparados para la futura integración con la API REST en NestJS + Prisma + MySQL.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BackendApiConfig {
  baseUrl: string;
  useLocalPersistence: boolean;
  timezone: 'America/Bogota';
  currency: 'COP';
}

export const FUTURE_API_CONFIG: BackendApiConfig = {
  baseUrl: '/api/v1',
  useLocalPersistence: true,
  timezone: 'America/Bogota',
  currency: 'COP',
};

