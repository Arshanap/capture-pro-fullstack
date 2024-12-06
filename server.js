const express = require('express')
const app = express()
const path = require("path")
const env = require('dotenv').config()
const mongoose = require("mongoose")
const expressLayout = require("express-ejs-layouts")
const userRouter = require('./routs/user')
const adminRouter = require('./routs/admin')
const passport = require("passport")
const session = require("express-session")
const nocache = require("nocache")
const cors = require('cors');
const methodOverride = require('method-override');
app.use(cors());

require('./config/pasport');

app.use(methodOverride('_method'));


app.use(nocache())
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure: false,
        maxAge:1000*60*60*24
    }
}))

app.use(passport.initialize())
app.use(passport.session())


app.use(expressLayout)

// dbs connection
mongoose.connect(process.env.MONGODB_URI).then(console.log('db connected',process.env.MONGODB_URI))



//  urlencoding
app.use(express.urlencoded({extended:true}))
app.use(express.json())


// view engine setting
app.set("view engine", 'ejs')

//static assets
app.use(express.static(path.join(__dirname, 'public')))

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});


// user Router
app.use('/',userRouter)
app.use('/admin',adminRouter)


app.use((req,res,next)=>{
    res.status(404).render("user/pageNotFound")
})



app.listen(process.env.PORT, ()=>{
    console.log("#==*==*==*==*==*==*==*==*==*==*==*==*==*==*==#");
    console.log("              server started PORT:",process.env.PORT)
    console.log("#==*==*==*==*==*==*==*==*==*==*==*==*==*==*==#");
})