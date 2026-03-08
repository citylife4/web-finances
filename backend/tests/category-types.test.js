const request = require('supertest');
const express = require('express');

jest.mock('../src/models', () => {
  const CategoryType = jest.fn(function CategoryType(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });

  CategoryType.find = jest.fn();
  CategoryType.findById = jest.fn();
  CategoryType.findOne = jest.fn();
  CategoryType.findByIdAndDelete = jest.fn();

  return {
    CategoryType,
    Category: {
      countDocuments: jest.fn()
    },
    Account: {
      countDocuments: jest.fn()
    }
  };
});

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', email: 'test@example.com' };
    req.userId = 'test-user-id';
    next();
  }
}));

const { CategoryType, Category, Account } = require('../src/models');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/category-types', require('../src/routes/category-types'));
  return app;
};

describe('Category Type Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/category-types', () => {
    it('should return system and user category types', async () => {
      const mockTypes = [
        { _id: '1', name: 'deposits', displayName: 'Deposits', isSystem: true },
        { _id: '2', name: 'liabilities', displayName: 'Liabilities', isSystem: false }
      ];

      CategoryType.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTypes)
      });

      const response = await request(app).get('/api/category-types');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTypes);
      expect(CategoryType.find).toHaveBeenCalledWith({
        $or: [{ isSystem: true }, { userId: 'test-user-id' }]
      });
    });
  });

  describe('POST /api/category-types', () => {
    it('should create a new custom category type', async () => {
      CategoryType.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/category-types')
        .send({
          name: 'liabilities',
          displayName: 'Liabilities',
          description: 'Debt accounts',
          color: '#123456',
          icon: '💳'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('liabilities');
      expect(response.body.displayName).toBe('Liabilities');
      expect(CategoryType).toHaveBeenCalledWith({
        userId: 'test-user-id',
        name: 'liabilities',
        displayName: 'Liabilities',
        description: 'Debt accounts',
        color: '#123456',
        icon: '💳',
        isSystem: false
      });
    });

    it('should reject duplicate names', async () => {
      CategoryType.findOne.mockResolvedValue({ _id: 'existing' });

      const response = await request(app)
        .post('/api/category-types')
        .send({
          name: 'deposits',
          displayName: 'Deposits'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('A category type with this name already exists');
    });
  });

  describe('PUT /api/category-types/:id', () => {
    it('should update a user-owned category type', async () => {
      const type = {
        _id: '507f1f77bcf86cd799439011',
        name: 'liabilities',
        displayName: 'Liabilities',
        description: 'Old',
        color: '#123456',
        icon: '💳',
        isSystem: false,
        userId: { toString: () => 'test-user-id' },
        save: jest.fn().mockResolvedValue(true)
      };
      CategoryType.findById.mockResolvedValue(type);

      const response = await request(app)
        .put('/api/category-types/507f1f77bcf86cd799439011')
        .send({
          displayName: 'Debt',
          description: 'Updated description',
          color: '#654321',
          icon: '🏦'
        });

      expect(response.status).toBe(200);
      expect(type.displayName).toBe('Debt');
      expect(type.description).toBe('Updated description');
      expect(type.color).toBe('#654321');
      expect(type.icon).toBe('🏦');
      expect(type.save).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/category-types/:id', () => {
    it('should reject deletion of a system type', async () => {
      CategoryType.findById.mockResolvedValue({ _id: '1', isSystem: true });

      const response = await request(app).delete('/api/category-types/507f1f77bcf86cd799439011');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Cannot delete system category types');
    });

    it('should delete an unused custom category type', async () => {
      CategoryType.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        isSystem: false,
        userId: { toString: () => 'test-user-id' }
      });
      Category.countDocuments.mockResolvedValue(0);
      Account.countDocuments.mockResolvedValue(0);
      CategoryType.findByIdAndDelete.mockResolvedValue(true);

      const response = await request(app).delete('/api/category-types/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category type deleted successfully');
      expect(CategoryType.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
