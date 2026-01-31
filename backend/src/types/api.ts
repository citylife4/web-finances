/**
 * Backend API request/response types
 */

import { Request } from 'express';
import { IUser } from './models';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

// API response types
export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  message?: string;
  data?: T;
}

// Auth responses
export interface AuthResponse {
  message: string;
  user: Partial<IUser>;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// Analytics types
export interface MonthlyTotal {
  month: string;
  deposits: number;
  investments: number;
  total: number;
}
