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
    find: jest.fn(),
    findById: jest.fn()
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
  },
  optionalAuth: (req, res, next) => next()
}));

const { Account, CategoryType, MonthlyEntry } = require('../src/models');

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
    it('should return all accounts', async () => {
      const mockAccounts = [
        { _id: '1', name: 'Savings' },
        { _id: '2', name: 'Stocks' }
      ];

      Account.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAccounts)
          })
        })
      });
      CategoryType.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      const response = await request(app).get('/api/accounts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccounts);
      expect(Account.find).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      Account.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database error'))
          })
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

    it('should return 400 if typeId is invalid', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          typeId: 'invalid',
          categoryId: '507f1f77bcf86cd799439011'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid typeId or categoryId');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account and related entries', async () => {
      Account.findOneAndDelete.mockResolvedValue({ _id: '1', name: 'Test' });
      MonthlyEntry.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const response = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
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
