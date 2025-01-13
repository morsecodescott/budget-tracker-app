const { handleItemWebhook, unhandledWebhook } = require('./index');
const { logWebhookEvent } = require('./webhookUtils');

// Mock database queries
jest.mock('../db/queries', () => ({
    updateItemStatus: jest.fn().mockResolvedValue(true),
    retrieveItemByPlaidItemId: jest.fn().mockResolvedValue({
        id: 'test-db-item-id',
        userId: 'test-user-id'
    }),
    deleteItem: jest.fn().mockResolvedValue(true)
}));

// Mock logWebhookEvent
jest.mock('./webhookUtils', () => ({
    logWebhookEvent: jest.fn().mockResolvedValue(true)
}));

// Clear all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe('Webhook Handlers', () => {
    describe('handleItemWebhook', () => {
        // Import required mocks
        const {
            updateItemStatus,
            retrieveItemByPlaidItemId,
            deleteItem
        } = require('../db/queries');

        test('should throw error for missing request body', async () => {
            await expect(handleItemWebhook(null))
                .rejects
                .toThrow('Missing request body');
        });

        test('should throw error for missing webhook_code', async () => {
            await expect(handleItemWebhook({ item_id: 'test' }))
                .rejects
                .toThrow('Missing webhook_code');
        });

        test('should throw error for missing item_id', async () => {
            await expect(handleItemWebhook({ webhook_code: 'test' }))
                .rejects
                .toThrow('Missing item_id');
        });

        const basePayload = {
            webhook_code: 'TEST_CODE',
            item_id: 'test-item-id',
            error: null
        };

        test('should handle WEBHOOK_UPDATE_ACKNOWLEDGED', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'WEBHOOK_UPDATE_ACKNOWLEDGED'
            };

            await handleItemWebhook(payload);
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'WEBHOOK_UPDATE_ACKNOWLEDGED',
                plaidItemId: 'test-item-id',
                status: 'PROCESSED',
                details: 'Item is updated'
            });
        });

        test('should handle ERROR with ITEM_LOGIN_REQUIRED and update item status', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'ERROR',
                error: {
                    error_code: 'ITEM_LOGIN_REQUIRED',
                    error_message: 'Login required'
                }
            };

            await handleItemWebhook(payload);

            expect(retrieveItemByPlaidItemId).toHaveBeenCalledWith('test-item-id');
            expect(updateItemStatus).toHaveBeenCalledWith('test-db-item-id', 'bad');
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'ERROR',
                plaidItemId: 'test-item-id',
                status: 'ERROR',
                error: {
                    code: 'ITEM_LOGIN_REQUIRED',
                    message: 'Login required'
                }
            });
        });

        test('should handle PENDING_EXPIRATION and update item status', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'PENDING_EXPIRATION'
            };

            await handleItemWebhook(payload);

            expect(retrieveItemByPlaidItemId).toHaveBeenCalledWith('test-item-id');
            expect(updateItemStatus).toHaveBeenCalledWith('test-db-item-id', 'bad');
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'PENDING_EXPIRATION',
                plaidItemId: 'test-item-id',
                status: 'PROCESSED',
                details: 'User needs to re-enter login credentials'
            });
        });

        test('should handle ITEM_REMOVED and delete item', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'ITEM_REMOVED'
            };

            await handleItemWebhook(payload);

            expect(retrieveItemByPlaidItemId).toHaveBeenCalledWith('test-item-id');
            expect(deleteItem).toHaveBeenCalledWith('test-db-item-id', 'test-user-id');
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'ITEM_REMOVED',
                plaidItemId: 'test-item-id',
                status: 'PROCESSED',
                details: 'Item and associated data removed'
            });
        });

        test('should handle PENDING_DISCONNECT and update item status', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'PENDING_DISCONNECT'
            };

            await handleItemWebhook(payload);

            expect(retrieveItemByPlaidItemId).toHaveBeenCalledWith('test-item-id');
            expect(updateItemStatus).toHaveBeenCalledWith('test-db-item-id', 'bad');
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'PENDING_DISCONNECT',
                plaidItemId: 'test-item-id',
                status: 'PROCESSED',
                details: 'User needs to re-enter login credentials'
            });
        });

        test('should handle LOGIN_REPAIRED', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'LOGIN_REPAIRED'
            };

            await handleItemWebhook(payload);
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'LOGIN_REPAIRED',
                plaidItemId: 'test-item-id',
                status: 'UNHANDLED',
                details: 'Login repaired - implementation needed'
            });
        });

        test('should handle NEW_ACCOUNTS_AVAILABLE', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'NEW_ACCOUNTS_AVAILABLE'
            };

            await handleItemWebhook(payload);
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'NEW_ACCOUNTS_AVAILABLE',
                plaidItemId: 'test-item-id',
                status: 'UNHANDLED',
                details: 'New accounts available - implementation needed'
            });
        });

        test('should handle unknown webhook code', async () => {
            const payload = {
                ...basePayload,
                webhook_code: 'UNKNOWN_CODE'
            };

            await handleItemWebhook(payload);
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'ITEMS',
                code: 'UNKNOWN_CODE',
                plaidItemId: 'test-item-id',
                status: 'UNHANDLED',
                details: 'Unhandled webhook type received'
            });
        });
    });

    describe('unhandledWebhook', () => {
        test('should log unhandled webhook', async () => {
            const payload = {
                webhook_type: 'UNKNOWN_TYPE',
                webhook_code: 'UNKNOWN_CODE',
                item_id: 'test-item-id'
            };

            await unhandledWebhook(payload);
            expect(logWebhookEvent).toHaveBeenCalledWith({
                type: 'UNKNOWN_TYPE',
                code: 'UNKNOWN_CODE',
                plaidItemId: 'test-item-id',
                status: 'UNHANDLED',
                details: 'Unhandled webhook type received'
            });
        });
    });
});
