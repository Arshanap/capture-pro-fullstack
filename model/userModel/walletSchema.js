const mongoose = require("mongoose")
const {Schema} = mongoose;
const walletSchema = new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,  
    },
    balance:{
        type:Number,
        required:true,
    },
    transaction:[
        {
            transactionType:{
                type:String,
                enum:["credit","debit"],
                required:true
            },
            amount:{
                type:Number,
                required:true
            },
            status:{
                type:String,
                default:"completed"
            },
            date: {
                type: Date,
                default: Date.now,  
            },
        },
    ]
},
{
    timestamps:true
}
)

 const Wallet = mongoose.model("Wallet",walletSchema)
 module.exports=Wallet