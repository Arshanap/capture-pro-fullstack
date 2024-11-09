const mongoose = require("mongoose")
const {Schema} = mongoose;

const adressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    address:{
        addresstype:{ 
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        buildingName:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required: true
        },
        pincode:{
            type:String,
            required:true
        },
        phone:{
            type:String,
            required:false
        },
        email:{
            type:String,
            required:true
        },
        address:{
            type:String,
            required:true,
        }
    }
})




const addressSchema = mongoose.model("Adress",adressSchema)

module.exports = addressSchema