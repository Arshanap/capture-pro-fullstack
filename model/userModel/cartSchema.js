const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            required: true 
        },
        productCount: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            default: "placed"
        },
        cancellationReason: {
            type: String,
            default: "none"
        }
    }],
    total: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required:true
    },
    couponCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    }
});

cartSchema.pre("save", function(next) {
    this.total = this.items.reduce((acc, item) => acc + item.totalPrice, 0);

    this.grandTotal = this.total - this.discountAmount;

    next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
