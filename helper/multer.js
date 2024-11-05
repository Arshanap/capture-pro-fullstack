const multer = require('multer')
const path = require('path')
const fs = require('fs')
// const a =  require("../public/uploads/re-image")
const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        const dir = path.join(__dirname, '../public/uploads/re-images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


module.exports = storage