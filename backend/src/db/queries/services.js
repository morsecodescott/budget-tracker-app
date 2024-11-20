// services/categoryMappingService.js

const PlaidCategory = require('../../models/PlaidCategory');


/**
 * Maps a Plaid transaction to an internal category.
 * @param {Object} plaidCategory - A single Plaid personal finance category object, containing PRIMARY and DETAILED fields.
 * @returns {ObjectId|null} - Returns the ObjectId of the internal category if found, otherwise null.
 */
async function mapToInternalCategory(plaidCategory) {
    
    try {
        // Destructure the PRIMARY and DETAILED category fields from the Plaid transaction
        const { detailed } = plaidCategory;
        
        // Query the PlaidCategory collection for a matching category document
        const matchedCategory = await PlaidCategory.findOne({"DETAILED": detailed }).exec();
       
        // Return the internal category ID if a match is found, otherwise null
        return matchedCategory ? matchedCategory.internal_category : null;
    } catch (error) {
        console.error('Error mapping category:', error);
        return null;
    }
}

module.exports = {
    mapToInternalCategory
};
