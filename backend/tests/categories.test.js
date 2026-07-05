const request = require('supertest');
const express = require('express');

// Mock the models
jest.mock('../src/models', () => ({
  Category: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  },
  CategoryType: {
    findOne: jest.fn()
  },
  Account: {
    countDocuments: jest.fn(),
    updateMany: jest.fn()
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

const { Category, CategoryType, Account } = require('../src/models');

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
    it('should return the categories of the authenticated user', async () => {
      const mockCategories = [
        { _id: '1', name: 'Bank Accounts', type: 'deposits' },
        { _id: '2', name: 'Stocks', type: 'investments' }
      ];

      Category.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockCategories)
        })
      });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(Category.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });
  });

  describe('GET /api/categories/type/:typeId', () => {
    it('should return categories for a visible type', async () => {
      const mockCategories = [
        { _id: '1', name: 'Bank Accounts', type: 'deposits' }
      ];

      CategoryType.findOne.mockResolvedValue({ _id: 'type-1', name: 'deposits' });
      Category.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockCategories)
        })
      });

      const response = await request(app).get('/api/categories/type/type-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(Category.find).toHaveBeenCalledWith({ userId: 'test-user-id', typeId: 'type-1' });
    });

    it('should return 404 for an unknown type', async () => {
      CategoryType.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/categories/type/unknown');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category type not found');
    });
  });

  describe('POST /api/categories', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for an invalid type', async () => {
      CategoryType.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test', typeId: 'bad-type' });

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
      expect(Account.countDocuments).toHaveBeenCalledWith({
        categoryId: '507f1f77bcf86cd799439011',
        userId: 'test-user-id'
      });
    });

    it('should delete category if no accounts use it', async () => {
      Account.countDocuments.mockResolvedValue(0);
      Category.findOneAndDelete.mockResolvedValue({ _id: '1', name: 'Test' });

      const response = await request(app).delete('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
      expect(Category.findOneAndDelete).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        userId: 'test-user-id'
      });
    });

    it('should return 404 if category not found', async () => {
      Account.countDocuments.mockResolvedValue(0);
      Category.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found');
    });
  });
});
