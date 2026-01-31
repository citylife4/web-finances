/**
 * Store types and interfaces
 */

import type { Account, Category, MonthlyEntry, AccountType } from './models';
import type { MonthlyTotal } from './api';

// Store state interface
export interface StoreState {
  accounts: Account[];
  monthlyEntries: MonthlyEntry[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

// Store methods interface
export interface StoreMethods {
  // State management
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  clearError(): void;
  
  // Initialization
  initialize(): Promise<void>;
  
  // Account methods
  loadAccounts(): Promise<void>;
  addAccount(account: Partial<Account>): Promise<Account>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Entry methods
  loadEntries(): Promise<void>;
  addEntries(entries: Array<{ accountId: string; month: string; amount: number }>): Promise<MonthlyEntry[]>;
  updateEntry(id: string, amount: number): Promise<MonthlyEntry>;
  deleteEntry(id: string): Promise<void>;
  getMonthlyTotals(): Promise<MonthlyTotal[]>;
  
  // Category methods
  loadCategories(): Promise<void>;
  addCategory(category: Partial<Category>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  getCategoriesByType(type: AccountType): Category[];
  
  // Computed helpers
  getTotalByType(type: AccountType): number;
  getLatestValue(accountId: string): number;
}

// Full store type
export type Store = StoreState & StoreMethods;
