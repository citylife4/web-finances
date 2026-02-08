/**
 * Backend type definitions for MongoDB/Mongoose models
 */

import { Document, Types } from 'mongoose';

// Account types enum
export type AccountType = 'deposits' | 'investments';

// Category document interface
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  type: AccountType;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account document interface
export interface IAccount extends Document {
  _id: Types.ObjectId;
  name: string;
  type: AccountType;
  categoryId: Types.ObjectId | ICategory;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Monthly entry document interface
export interface IMonthlyEntry extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId | IAccount;
  month: string; // YYYY-MM format
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh token subdocument
export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

// User document interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  refreshTokens: IRefreshToken[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  cleanExpiredTokens(): void;
  addRefreshToken(token: string, expiresInDays?: number): void;
  removeRefreshToken(token: string): void;
  removeAllRefreshTokens(): void;
  toJSON(): Omit<IUser, 'password' | 'refreshTokens'>;
}

// Create/Update DTOs
export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  categoryId: string;
  description?: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: AccountType;
  description?: string;
}

export interface CreateEntryDTO {
  accountId: string;
  month: string;
  amount: number;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
