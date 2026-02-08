/**
 * Shared type definitions for the Financial Account Tracker
 */

// Account types enum
export type AccountType = 'deposits' | 'investments';

// Category interface
export interface Category {
  _id: string;
  name: string;
  type: AccountType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Account interface
export interface Account {
  _id: string;
  name: string;
  type: AccountType;
  categoryId: Category | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Monthly entry interface
export interface MonthlyEntry {
  _id: string;
  accountId: Account | string;
  month: string; // YYYY-MM format
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// User interface
export interface User {
  _id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create/Update DTOs
export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  categoryId: string;
  description?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  type?: AccountType;
  categoryId?: string;
  description?: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: AccountType;
  description?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: AccountType;
  description?: string;
}

export interface CreateEntryDTO {
  accountId: string;
  month: string;
  amount: number;
}

export interface BatchEntriesDTO {
  entries: CreateEntryDTO[];
}

// Auth DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
