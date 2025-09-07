/**
 * Plaid API Service
 * 
 * Handles all direct interactions with the Plaid API
 */

const { client: plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } = require('../config/plaidClient');

class PlaidApiService {
    /**
     * Creates a link token for initializing Plaid Link
     * @param {string} userId - User ID
     * @param {string} [accessToken] - Optional existing access token
     * @param {string} [webhook] - Optional webhook URL
     * @returns {Promise<Object>} Link token data
     */
    static async createLinkToken(userId, accessToken, webhook) {
        try {
            const config = {
                user: { client_user_id: userId },
                client_name: 'ChaChing',
                country_codes: PLAID_COUNTRY_CODES,
                language: 'en',
                webhook,
                access_token: accessToken,
            };

            if (!accessToken) {
                config.products = PLAID_PRODUCTS;
            }

            const response = await plaidClient.linkTokenCreate(config);
            console.log("LINK Country CODES:", PLAID_COUNTRY_CODES);
            return response.data;
        } catch (error) {
            console.log("CreateLinkToken error:", error.message);
            throw new Error(`Failed to create link token: ${error.message}`);
        }
    }

    /**
     * Exchanges a public token for an access token
     * @param {string} publicToken - Public token from Plaid Link
     * @returns {Promise<Object>} Access token and item ID
     */
    static async exchangePublicToken(publicToken) {
        try {
            const response = await plaidClient.itemPublicTokenExchange({
                public_token: publicToken,
            });
            return {
                accessToken: response.data.access_token,
                itemId: response.data.item_id,
            };
        } catch (error) {
            throw new Error(`Failed to exchange public token: ${error.message}`);
        }
    }

    /**
     * Retrieves item information from Plaid
     * @param {string} accessToken - Access token for the item
     * @returns {Promise<Object>} Item information
     */
    static async getItemInfo(accessToken) {
        try {
            const response = await plaidClient.itemGet({ access_token: accessToken });
            return response.data.item;
        } catch (error) {
            throw new Error(`Failed to get item info: ${error.message}`);
        }
    }

    /**
     * Retrieves institution information
     * @param {string} institutionId - Plaid institution ID
     * @returns {Promise<Object>} Institution information
     */
    static async getInstitutionInfo(institutionId) {
        try {
            const response = await plaidClient.institutionsGetById({
                institution_id: institutionId,
                country_codes: PLAID_COUNTRY_CODES,
            });
            return response.data.institution;
        } catch (error) {
            throw new Error(`Failed to get institution info: ${error.message}`);
        }
    }

    /**
     * Retrieves accounts for an item
     * @param {string} accessToken - Access token for the item
     * @returns {Promise<Array>} Array of account objects
     */
    static async getAccounts(accessToken) {
        try {
            const response = await plaidClient.accountsGet({ access_token: accessToken });
            return response.data.accounts;
        } catch (error) {
            throw new Error(`Failed to get accounts: ${error.message}`);
        }
    }
}

module.exports = PlaidApiService;
