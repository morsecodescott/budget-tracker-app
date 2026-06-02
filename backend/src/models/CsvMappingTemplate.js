const mongoose = require('mongoose');

const csvMappingTemplateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    mapping: {
        date: { type: String, required: true },
        amount: { type: String, required: true },
        merchant_name: { type: String, required: true },
        // Optional mappings
        name: { type: String }, // For secondary description/name
        category: { type: String }, // To map CSV category to our internal categories (advanced)
    },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CsvMappingTemplate', csvMappingTemplateSchema);
