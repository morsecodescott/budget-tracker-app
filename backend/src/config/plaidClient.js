// backend/src/config/plaidClient.js
require('dotenv').config();
const { Configuration, PlaidApi, Products, PlaidEnvironments } = require('plaid');

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';



// Supported Plaid products and country codes
const PLAID_PRODUCTS = [Products.Transactions];
const PLAID_COUNTRY_CODES = ['US'];

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

const client = new PlaidApi(configuration);


module.exports = {
  client,
  PLAID_PRODUCTS,
  PLAID_COUNTRY_CODES
};
