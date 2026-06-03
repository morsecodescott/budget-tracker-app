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
            const rawAmount = row[mapping.amount];
            const rawMerchant = row[mapping.merchant_name];
            const rawName = mapping.name && row[mapping.name] ? row[mapping.name] : rawMerchant;

            const rawMerchantRef = mapping.merchant_reference_number && row[mapping.merchant_reference_number] ? row[mapping.merchant_reference_number] : undefined;
            const rawMerchantCategory = mapping.merchant_category_description && row[mapping.merchant_category_description] ? row[mapping.merchant_category_description] : undefined;
            const rawMerchantCity = mapping.merchant_city && row[mapping.merchant_city] ? row[mapping.merchant_city] : undefined;
            const rawMerchantState = mapping.merchant_state_or_province && row[mapping.merchant_state_or_province] ? row[mapping.merchant_state_or_province] : undefined;
            const rawMerchantCountry = mapping.merchant_country_code && row[mapping.merchant_country_code] ? row[mapping.merchant_country_code] : undefined;

            if (!rawDate || !rawAmount || !rawMerchant) continue; // Skip invalid rows

            // Basic parsing (amount could be negative or have $ signs)
            let amountStr = String(rawAmount).replace(/[^\d.-]/g, '');
            let amount = parseFloat(amountStr);
            if (isNaN(amount)) continue;

            // Plaid convention: positive amount is an expense, negative is income/refund
            // For standard bank CSVs, withdrawals/expenses are often negative. We need to invert it for our DB if so.
            // Let's assume standard logic: if it's negative in CSV, it's an expense (positive in our DB).
            amount = -amount;

            const date = new Date(rawDate);

            // Generate unique hash based on fields
            const hashString = `${accountId}-${date.toISOString()}-${amount}-${rawMerchant}`;
            const uniqueId = crypto.createHash('sha256').update(hashString).digest('hex');

            // Find existing to avoid duplicates
            const existing = await Transaction.findOne({ uniqueId, accountId });
            if (existing) continue;

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
                // Optional category logic could go here
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

module.exports = router;
