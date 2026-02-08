const mongoose = require('mongoose');

// Increase timeout for database operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Suppress console.log during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };
