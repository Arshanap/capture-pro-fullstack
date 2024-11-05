const mongoose = require("mongoose")
const { stringify } = require("uuid")
const {Schema} = mongoose

const bannerSchema = new Schema({
    image:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    link:{
        type:String
    },
    staartDate:{
        type:Date,
        required:true
    },
    endDate:{
        type:Date,
        required:true
    }
})


const Banner = mongoose.model("Banner", bannerSchema)

module.exports = Banner