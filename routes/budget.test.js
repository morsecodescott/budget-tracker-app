const request = require('supertest');
const app = require('../app');
const server = require('../server');
const { afterAll, beforeAll } = require('@jest/globals');
const { TEST_USERNAME, TEST_PASSWORD } = process.env;

let authToken;
let createdItemId;

beforeAll(async () => {
  authToken = await loginUser(TEST_USERNAME, TEST_PASSWORD);
  console.log(authToken);
});

afterAll(async () => {
  // Perform cleanup tasks, if needed
  server.close(); // Close the server after tests
});

describe('Authentication Tests', () => {
  it('should successfully log in and retrieve auth token', async () => {
    expect(authToken).toBeDefined();
  });
});

describe('Budget Routes Tests', () => {
  it('should add a new budget item and store the ID', async () => {
    createdItemId = await createBudgetItem(app);
  });

  it('should update the budget item created in the POST method', async () => {
    await updateBudgetItem(app, createdItemId);
  });

  it('should delete the budget item created in the POST method', async () => {
    await deleteBudgetItem(app, createdItemId);
  });
});

async function loginUser(username, password) {
  const res = await request(app)
    .post('/auth/login')
    .send({ username, password });

  return res.headers['authorization'];
}

async function createBudgetItem(app) {
  const newBudgetItem = {
    type: 'Expense',
    amount: 100,
    frequency: 'Monthly',
    description: 'Groceries',
  };

  const res = await request(app)
    .post('/budget')
    .send(newBudgetItem);

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('_id');

  return res.body._id;
}

async function updateBudgetItem(app, itemId) {
  const updatedBudgetItem = {
    type: 'Income',
    amount: 200,
    frequency: 'Yearly',
    description: 'Bonus',
  };

  const res = await request(app)
    .put(`/budget/${itemId}`)
    .send(updatedBudgetItem);

  expect(res.statusCode).toBe(200);
}

async function deleteBudgetItem(app, itemId) {
  const res = await request(app)
    .delete(`/budget/${itemId}`);

  expect(res.statusCode).toBe(200);
}
