/**
 * API response types
 */

import type { Account, Category, MonthlyEntry, User } from './models';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Error response
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Analytics types
export interface MonthlyTotal {
  month: string;
  deposits: number;
  investments: number;
  total: number;
}

// Paginated response (for future use)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  message: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}
