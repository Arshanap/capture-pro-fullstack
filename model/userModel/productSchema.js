const mongoose = require("mongoose")

const {Schema} = mongoose;

const productSchema = new Schema ({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:false
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        required:false,
        default:0
    },
    count:{
        type:Number,
        default:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available", "out of stock", "Discountinued"],
        required:true,
        default:"Available"
    }
},{timestamps:true})


const Product = mongoose.model("Product", productSchema)


module.exports = Product