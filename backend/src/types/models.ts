/**
 * Backend type definitions for MongoDB/Mongoose models
 */

import { Document, Types } from 'mongoose';

// Built-in system account types; users can add custom ones
export type AccountType = 'deposits' | 'investments' | string;

// Category type document interface
export interface ICategoryType extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | null; // null for shared system types
  name: string;
  displayName: string;
  description?: string;
  color: string;
  icon?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category document interface
export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  typeId: Types.ObjectId | ICategoryType;
  type?: AccountType; // legacy field kept for backward compatibility
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account document interface
export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  typeId: Types.ObjectId | ICategoryType;
  type?: AccountType; // legacy field kept for backward compatibility
  categoryId: Types.ObjectId | ICategory;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Monthly entry document interface
export interface IMonthlyEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
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
}

// Shape returned by IUser.toJSON() (password and refreshTokens stripped)
export type PublicUser = Omit<IUser, 'password' | 'refreshTokens'>;

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
