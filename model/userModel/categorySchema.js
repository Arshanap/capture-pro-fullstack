const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure name uniqueness in the database
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOffer: {
        type: Number,
        default: 0,
        min: 0 // Ensure offer is not negative
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
