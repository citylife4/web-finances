const request = require('supertest');
const express = require('express');

// Mock the models
jest.mock('../src/models', () => ({
  Account: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  },
  CategoryType: {
    findOne: jest.fn()
  },
  Category: {
    findOne: jest.fn()
  },
  MonthlyEntry: {
    deleteMany: jest.fn()
  }
}));

// Mock the auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', email: 'test@example.com' };
    req.userId = 'test-user-id';
    next();
  }
}));

const { Account, CategoryType, Category, MonthlyEntry } = require('../src/models');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', require('../src/routes/accounts'));
  return app;
};

describe('Accounts Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('should return the accounts of the authenticated user', async () => {
      const mockAccounts = [
        { _id: '1', name: 'Savings', type: 'deposits' },
        { _id: '2', name: 'Stocks', type: 'investments' }
      ];

      Account.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockAccounts)
        })
      });

      const response = await request(app).get('/api/accounts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccounts);
      expect(Account.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });

    it('should return 500 on database error', async () => {
      Account.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const response = await request(app).get('/api/accounts');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch accounts');
    });
  });

  describe('POST /api/accounts', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({ name: 'Test Account' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if the category type is not visible to the user', async () => {
      CategoryType.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          typeId: '507f1f77bcf86cd799439012',
          categoryId: '507f1f77bcf86cd799439011'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid category type');
    });

    it('should return 400 if the category belongs to another user', async () => {
      CategoryType.findOne.mockResolvedValue({ _id: '507f1f77bcf86cd799439012', name: 'deposits' });
      Category.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          typeId: '507f1f77bcf86cd799439012',
          categoryId: '507f1f77bcf86cd799439011'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid category');
      expect(Category.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        userId: 'test-user-id'
      });
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account and related entries', async () => {
      Account.findOneAndDelete.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', name: 'Test' });
      MonthlyEntry.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const response = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
      expect(Account.findOneAndDelete).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        userId: 'test-user-id'
      });
      expect(MonthlyEntry.deleteMany).toHaveBeenCalled();
    });

    it('should return 404 if account not found', async () => {
      Account.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Account not found');
    });
  });
});
