const request = require('supertest');
const express = require('express');

// Mock the models
jest.mock('../src/models', () => ({
  Category: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  },
  Account: {
    countDocuments: jest.fn()
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

const { Category, Account } = require('../src/models');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/categories', require('../src/routes/categories'));
  return app;
};

describe('Categories Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { _id: '1', name: 'Bank Accounts', type: 'deposits' },
        { _id: '2', name: 'Stocks', type: 'investments' }
      ];

      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
    });
  });

  describe('GET /api/categories/:type', () => {
    it('should return categories by type', async () => {
      const mockCategories = [
        { _id: '1', name: 'Bank Accounts', type: 'deposits' }
      ];

      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await request(app).get('/api/categories/deposits');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app).get('/api/categories/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid category type');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should prevent deletion if accounts use the category', async () => {
      Account.countDocuments.mockResolvedValue(3);

      const response = await request(app).delete('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('3 account(s)');
    });

    it('should delete category if no accounts use it', async () => {
      Account.countDocuments.mockResolvedValue(0);
      Category.findByIdAndDelete.mockResolvedValue({ _id: '1', name: 'Test' });

      const response = await request(app).delete('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
    });

    it('should return 404 if category not found', async () => {
      Account.countDocuments.mockResolvedValue(0);
      Category.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found');
    });
  });
});
