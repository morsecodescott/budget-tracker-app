const mongoose = require('mongoose');

const csvMappingTemplateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    mapping: {
        date: { type: String, required: true },
        amount: { type: String }, // Optional if amount_in/amount_out are used
        merchant_name: { type: String, required: true },
        // Optional mappings
        amount_in: { type: String }, // For Funds In column
        amount_out: { type: String }, // For Funds Out column
        name: { type: String }, // For secondary description/name
        category: { type: String }, // To map CSV category to our internal categories (advanced)
        merchant_reference_number: { type: String },
        merchant_category_description: { type: String },
        merchant_city: { type: String },
        merchant_state_or_province: { type: String },
        merchant_country_code: { type: String },
    },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CsvMappingTemplate', csvMappingTemplateSchema);
