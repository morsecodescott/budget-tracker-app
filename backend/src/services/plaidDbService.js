/**
 * Plaid Database Service
 * 
 * Handles all database operations related to Plaid items and accounts
 */

const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');
const PlaidTransaction = require('../models/PlaidTransaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

class PlaidDbService {
    /**
     * Creates or updates a Plaid item
     * @param {string} plaidItemId - Plaid item ID
     * @param {string} userId - User ID
     * @param {string} accessToken - Access token
     * @param {string} institutionName - Institution name
     * @param {string} institutionId - Institution ID
     * @returns {Promise<Object>} Created/updated Plaid item
     */
    static async upsertPlaidItem(plaidItemId, userId, accessToken, institutionName, institutionId, institutionLogoUrl) {
        try {
            return await PlaidItem.findOneAndUpdate(
                { plaidItemId, userId },
                {
                    accessToken,
                    plaidItemId,
                    userId,
                    institutionName,
                    institutionId,
                    institutionLogoUrl
                },
                { new: true, upsert: true }
            );
        } catch (error) {
            throw new Error(`Failed to upsert Plaid item: ${error.message}`);
        }
    }

    /**
     * Creates Plaid accounts and links them to a Plaid item
     * @param {Object} plaidItem - Plaid item document
     * @param {Array} accounts - Array of account objects from Plaid
     * @returns {Promise<Array>} Array of created account IDs
     */
    static async createAccountsForItem(plaidItem, accounts) {
        try {
            const accountIds = accounts.map(async (account) => {
                const newAccount = new PlaidAccount({
                    plaidItemId: plaidItem._id,
                    plaidAccountId: account.account_id,
                    accountName: account.name,
                    accountType: account.type,
                    accountSubType: account.subtype,
                    availableBalance: account.balances.available,
                    currentBalance: account.balances.current,
                    limit: account.balances.limit || null,
                });
                await newAccount.save();
                return newAccount._id;
            });

            return await Promise.all(accountIds);
        } catch (error) {
            throw new Error(`Failed to create accounts: ${error.message}`);
        }
    }

    /**
     * Retrieves all Plaid items for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of Plaid items with populated accounts
     */
    static async getItemsForUser(userId) {
        try {
            return await PlaidItem.find({ userId }).populate('accounts');
        } catch (error) {
            throw new Error(`Failed to get items for user: ${error.message}`);
        }
    }

    /**
     * Retrieves Plaid account IDs for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of account IDs
     */
    static async getAccountIdsForUser(userId) {
        try {
            const items = await PlaidItem.find({ userId }).populate('accounts');
            return items.flatMap(item => item.accounts.map(account => account._id));
        } catch (error) {
            throw new Error(`Failed to get account IDs: ${error.message}`);
        }
    }

    /**
     * Gets account summary by type
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of account summaries by type
     */
    static async getAccountSummary(userId) {
        try {
            return await PlaidAccount.aggregate([
                {
                    $lookup: {
                        from: "plaiditems",
                        localField: "plaidItemId",
                        foreignField: "_id",
                        as: "item"
                    }
                },
                { $unwind: "$item" },
                { $match: { "item.userId": userId } },
                {
                    $group: {
                        _id: "$accountType",
                        totalBalance: { $sum: "$currentBalance" },
                        accountCount: { $sum: 1 }
                    }
                }
            ]);
        } catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }

    /**
     * Retrieves filtered transactions for a user
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Array of filtered transactions
     */
    static async getFilteredTransactions(filters) {
        try {
            const {
                userId,
                startDate,
                endDate,
                page,
                rowsPerPage,
                category,
                budgetFilter,
                transactionType,
                plaidAccountIds
            } = filters;

            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();

            const budgetCategories = await Budget.find({
                user: userId,
                period: { $lte: end, $gte: start },
            }).distinct('category');

            // Build aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        plaidAccountId: { $in: plaidAccountIds },
                        date: { $gte: start, $lte: end },
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category.parentCategory',
                        foreignField: '_id',
                        as: 'category.parentCategoryDetails',
                    },
                },
                { $unwind: { path: '$category.parentCategoryDetails', preserveNullAndEmptyArrays: true } },
            ];

            if (category) {
                if (Array.isArray(category)) {
                    pipeline.push({
                        $match: {
                            'category._id': {
                                $in: category.map((id) => new mongoose.Types.ObjectId(id)),
                            },
                        },
                    });
                } else {
                    pipeline.push({
                        $match: {
                            'category._id': new mongoose.Types.ObjectId(category),
                        },
                    });
                }
            }

            if (transactionType && transactionType !== 'All') {
                pipeline.push({
                    $match: {
                        'category.parentCategoryDetails.name': transactionType === 'Income' ? 'Income' : { $ne: 'Income' },
                    },
                });
            }

            pipeline.push(
                {
                    $set: {
                        budgeted: {
                            $in: ['$category._id', budgetCategories],
                        },
                    },
                },
                { $sort: { date: -1 } }
            );

            const allTransactions = await PlaidTransaction.aggregate(pipeline);

            // Budget filter
            const filteredTransactions = allTransactions.filter((t) =>
                budgetFilter === 'budgeted'
                    ? t.budgeted
                    : budgetFilter === 'unbudgeted'
                        ? !t.budgeted
                        : true
            );

            const totalTransactions = filteredTransactions.length;
            const paginatedTransactions =
                page !== undefined && rowsPerPage !== undefined
                    ? filteredTransactions.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                    : filteredTransactions;

            return {
                transactions: paginatedTransactions,
                total: totalTransactions,
                page: page ? Number(page) : undefined,
                pages: page !== undefined && rowsPerPage !== undefined
                    ? Math.ceil(totalTransactions / rowsPerPage)
                    : undefined,
            };
        } catch (error) {
            throw new Error(`Failed to get filtered transactions: ${error.message}`);
        }
    }

    /**
     * Deletes a Plaid item and its associated accounts
     * @param {string} itemId - Plaid item ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    static async deleteItem(itemId, userId) {
        try {
            // Delete associated accounts first
            await PlaidAccount.deleteMany({ plaidItemId: itemId });

            // Then delete the item
            await PlaidItem.deleteOne({ _id: itemId, userId });
        } catch (error) {
            throw new Error(`Failed to delete item: ${error.message}`);
        }
    }
}

module.exports = PlaidDbService;
