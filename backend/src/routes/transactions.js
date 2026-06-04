const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Item = require('../models/Item');
const CsvMappingTemplate = require('../models/CsvMappingTemplate');

// ----------------------------------------
// FETCH TRANSACTIONS
// ----------------------------------------

router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all items belonging to the user to get their accounts
        const items = await Item.find({ userId }).populate('accounts');

        if (!items || items.length === 0) {
            return res.json({ transactions: [], total: 0, totalPages: 0 });
        }

        // Extract all account IDs
        const accountIds = items.flatMap(item => item.accounts.map(acc => acc._id));

        // Basic query: all transactions for user's accounts
        let query = { accountId: { $in: accountIds } };

        // Handle filtering (similar to PlaidDbService.getFilteredTransactions)
        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        if (req.query.accountId) {
             query.accountId = req.query.accountId;
        }

        if (req.query.categoryId) {
             query.category = req.query.categoryId;
        }

        if (req.query.search) {
             query.merchant_name = { $regex: req.query.search, $options: 'i' };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 0;
        const rowsPerPage = parseInt(req.query.rowsPerPage, 10) || 10;

        // Execute query
        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .skip(page * rowsPerPage)
            .limit(rowsPerPage)
            .populate('category')
            .populate('accountId');

        res.json({
            transactions,
            total,
            totalPages: Math.ceil(total / rowsPerPage)
        });

    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// ----------------------------------------
// MAPPING TEMPLATES
// ----------------------------------------

// Get all mapping templates for the user
router.get('/templates', async (req, res) => {
    try {
        const templates = await CsvMappingTemplate.find({ userId: req.user._id });
        res.json(templates);
    } catch (err) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Create a new mapping template
router.post('/templates', async (req, res) => {
    try {
        const { name, mapping, dateFormat, isDefault } = req.body;
        const newTemplate = new CsvMappingTemplate({
            userId: req.user._id,
            name,
            mapping,
            dateFormat,
            isDefault
        });
        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (err) {
        console.error('Error creating template:', err);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Delete a mapping template
router.delete('/templates/:id', async (req, res) => {
    try {
        await CsvMappingTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting template:', err);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// ----------------------------------------
// MANUAL ACCOUNTS/ITEMS
// ----------------------------------------

// Create a manual Item and Account
router.post('/manual-account', async (req, res) => {
    try {
        const { institutionName, accountName, accountType, accountSubType } = req.body;

        // 1. Create the manual Item
        const newItem = new Item({
            source: 'manual',
            institutionName,
            userId: req.user._id,
        });
        await newItem.save();

        // 2. Create the manual Account
        const newAccount = new Account({
            source: 'manual',
            itemId: newItem._id,
            accountName,
            accountType: accountType || 'depository',
            accountSubType: accountSubType || 'checking',
        });
        await newAccount.save();

        // 3. Link account to item
        newItem.accounts.push(newAccount._id);
        await newItem.save();

        res.status(201).json({ item: newItem, account: newAccount });
    } catch (err) {
        console.error('Error creating manual account:', err);
        res.status(500).json({ error: 'Failed to create manual account' });
    }
});

// ----------------------------------------
// CSV UPLOAD & PROCESSING
// ----------------------------------------

router.post('/upload', async (req, res) => {
    try {
        const { accountId, transactions, templateId } = req.body;

        if (!accountId || !transactions || transactions.length === 0) {
            return res.status(400).json({ error: 'Missing accountId or transactions' });
        }

        const template = await CsvMappingTemplate.findById(templateId);
        if (!template) {
             return res.status(404).json({ error: 'Template not found' });
        }

        const mapping = template.mapping;
        const savedTransactions = [];

        for (const row of transactions) {
            // Apply mapping
            const rawDate = row[mapping.date];
            const rawAmount = mapping.amount ? row[mapping.amount] : undefined;
            const rawAmountIn = mapping.amount_in ? row[mapping.amount_in] : undefined;
            const rawAmountOut = mapping.amount_out ? row[mapping.amount_out] : undefined;
            const rawMerchant = row[mapping.merchant_name];
            const rawName = mapping.name && row[mapping.name] ? row[mapping.name] : rawMerchant;

            const rawMerchantRef = mapping.merchant_reference_number && row[mapping.merchant_reference_number] ? row[mapping.merchant_reference_number] : undefined;
            const rawMerchantCategory = mapping.merchant_category_description && row[mapping.merchant_category_description] ? row[mapping.merchant_category_description] : undefined;
            const rawMerchantCity = mapping.merchant_city && row[mapping.merchant_city] ? row[mapping.merchant_city] : undefined;
            const rawMerchantState = mapping.merchant_state_or_province && row[mapping.merchant_state_or_province] ? row[mapping.merchant_state_or_province] : undefined;
            const rawMerchantCountry = mapping.merchant_country_code && row[mapping.merchant_country_code] ? row[mapping.merchant_country_code] : undefined;

            if (!rawDate || !rawMerchant) continue; // Skip invalid rows
            if (!rawAmount && !rawAmountIn && !rawAmountOut) continue; // Must have some amount mapping

            let amount;

            if (rawAmountIn || rawAmountOut) {
                // Dual column logic
                let amountIn = rawAmountIn ? parseFloat(String(rawAmountIn).replace(/[^\d.-]/g, '')) : NaN;
                let amountOut = rawAmountOut ? parseFloat(String(rawAmountOut).replace(/[^\d.-]/g, '')) : NaN;

                // If both are present, we subtract in from out to get net expense.
                // Usually they are mutually exclusive.
                if (isNaN(amountIn)) amountIn = 0;
                if (isNaN(amountOut)) amountOut = 0;

                if (amountIn === 0 && amountOut === 0) continue;

                // Plaid Convention: positive is expense (out), negative is income (in).
                amount = amountOut - amountIn;
            } else {
                // Single column logic
                let amountStr = String(rawAmount).replace(/[^\d.-]/g, '');
                amount = parseFloat(amountStr);
                if (isNaN(amount)) continue;

                // Plaid convention: positive amount is an expense, negative is income/refund
                // For standard bank CSVs, withdrawals/expenses are often negative. We need to invert it for our DB if so.
                amount = -amount;
            }

            const date = new Date(rawDate);

            // Generate unique hash based on fields
            const hashString = `${accountId}-${date.toISOString()}-${amount}-${rawMerchant}`;
            const uniqueId = crypto.createHash('sha256').update(hashString).digest('hex');

            // Find existing to avoid duplicates
            const existing = await Transaction.findOne({ uniqueId, accountId });
            if (existing) continue;

            let internalCategoryId = undefined;
            // Apply category rules
            try {
                const CategoryRule = require('../models/CategoryRule');
                const rules = await CategoryRule.find({ userId: req.user._id });
                for (const rule of rules) {
                    const escapedMerchantName = rule.merchantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    let isMatch = false;
                    const mName = rawMerchant || rawName || "";

                    switch (rule.matchType) {
                        case 'exact':
                            isMatch = new RegExp(`^${escapedMerchantName}$`, 'i').test(mName);
                            break;
                        case 'startsWith':
                            isMatch = new RegExp(`^${escapedMerchantName}`, 'i').test(mName);
                            break;
                        case 'endsWith':
                            isMatch = new RegExp(`${escapedMerchantName}$`, 'i').test(mName);
                            break;
                        case 'contains':
                        default:
                            isMatch = new RegExp(escapedMerchantName, 'i').test(mName);
                            break;
                    }

                    if (isMatch) {
                        internalCategoryId = rule.categoryId;
                        break; // Apply first matched rule
                    }
                }
            } catch (ruleErr) {
                console.error('Error applying category rules during csv upload:', ruleErr);
            }

            const newTx = new Transaction({
                source: 'manual',
                accountId,
                uniqueId,
                amount,
                date,
                name: rawName,
                merchant_name: rawMerchant,
                merchant_reference_number: rawMerchantRef,
                merchant_category_description: rawMerchantCategory,
                merchant_city: rawMerchantCity,
                merchant_state_or_province: rawMerchantState,
                merchant_country_code: rawMerchantCountry,
                ...(internalCategoryId && { category: internalCategoryId })
            });
            await newTx.save();
            savedTransactions.push(newTx);
        }

        // Notify via websocket if needed
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.user._id}`).emit('TRANSACTIONS_UPDATE', {
                message: `${savedTransactions.length} transactions uploaded successfully`
            });
        }

        res.status(201).json({
            message: 'Upload complete',
            count: savedTransactions.length,
            transactions: savedTransactions
        });

    } catch (err) {
        console.error('Error processing upload:', err);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

// ----------------------------------------
// EDIT TRANSACTIONS
// ----------------------------------------

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Verify the transaction belongs to the user by checking the account -> item
        const transaction = await Transaction.findById(id).populate({
            path: 'accountId',
            populate: { path: 'itemId' }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.accountId.itemId.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized to edit this transaction' });
        }

        // Only allow certain fields to be updated
        const allowedUpdates = [
            'amount', 'date', 'name', 'merchant_name', 'merchant_reference_number',
            'merchant_category_description', 'merchant_city', 'merchant_state_or_province',
            'merchant_country_code', 'category', 'isoCurrencyCode', 'unofficialCurrencyCode',
            'pending'
        ];

        const updates = {};
        for (const key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }

        // If category is updated, also update category id reference specifically
        if(updates.category && typeof updates.category === 'object' && updates.category._id) {
            updates.category = updates.category._id;
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(id, updates, { new: true }).populate('category');

        res.json(updatedTransaction);
    } catch (err) {
        console.error('Error updating transaction:', err);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// ----------------------------------------
// DELETE TRANSACTIONS
// ----------------------------------------

router.delete('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const { transactionIds } = req.body;

        if (!transactionIds || !Array.isArray(transactionIds)) {
            return res.status(400).json({ error: 'transactionIds array is required' });
        }

        // We must verify each transaction belongs to the user
        const items = await Item.find({ userId }).populate('accounts');
        const accountIds = items.flatMap(item => item.accounts.map(acc => acc._id));

        // Delete where _id is in the array AND accountId belongs to the user
        const result = await Transaction.deleteMany({
            _id: { $in: transactionIds },
            accountId: { $in: accountIds }
        });

        res.json({ message: `Successfully deleted ${result.deletedCount} transactions`, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Error deleting transactions:', err);
        res.status(500).json({ error: 'Failed to delete transactions' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const transaction = await Transaction.findById(id).populate({
            path: 'accountId',
            populate: { path: 'itemId' }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.accountId.itemId.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this transaction' });
        }

        await Transaction.findByIdAndDelete(id);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});


module.exports = router;
