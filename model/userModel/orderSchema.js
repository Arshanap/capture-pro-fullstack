const mongoose = require("mongoose")
const {Schema} = mongoose
const {v4:uuidv4} = require("uuid")

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",  
            required: true  
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    paymentMethod: { 
        type: String,
        required: true
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address", 
        required: true
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"]  // Fixed typo ('returnd' to 'Returned')
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });



const Order = mongoose.model("Order", orderSchema)

module.exports = Order