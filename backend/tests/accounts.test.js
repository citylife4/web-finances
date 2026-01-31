const request = require('supertest');
const express = require('express');

// Mock the models
jest.mock('../src/models', () => ({
  Account: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
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

const { Account, MonthlyEntry } = require('../src/models');

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
      expect(Account.find).toHaveBeenCalled();
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

    it('should return 400 if type is invalid', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          type: 'invalid',
          categoryId: '507f1f77bcf86cd799439011'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('deposits or investments');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account and related entries', async () => {
      Account.findByIdAndDelete.mockResolvedValue({ _id: '1', name: 'Test' });
      MonthlyEntry.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const response = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
      expect(MonthlyEntry.deleteMany).toHaveBeenCalled();
    });

    it('should return 404 if account not found', async () => {
      Account.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Account not found');
    });
  });
});
