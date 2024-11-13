const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Ensure sharp is imported correctly
const multer = require('multer');
const Product = require('../../model/userModel/productSchema'); 
const Category = require("../../model/userModel/categorySchema");
const mongoose = require("mongoose")



const loadProducts = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const productId = req.params.productId; 
        const sess = req.session.user
        let product = null;
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
    
        req.session.successMessage = "";
        req.session.errorMessage = "";
        
        // Only fetch product if productId is provided
        if (productId) {
            product = await Product.findById(productId).populate('category');
            if (!product) {
                return res.status(404).send('Product not found');
            }
        }

        const prodata = await Product.find({
            productName: { $regex: new RegExp(search, 'i') }
        })
        .populate('category')
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await Product.countDocuments({
            productName: { $regex: new RegExp(search, 'i') }
        });

        const categories = await Category.find();

        res.render('admin/productManagement', {
            categories,
            prodata,
            product, 
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search,
            successMessage,
            errorMessage,
            sess
        });
        
        

    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).send('Server error');
    }
};





// Adding a new product in product page 
const addProduct = async (req, res) => {
    try {
        const { productName, description, category, regularPrice, salePrice, count } = req.body;
    
        // Validate required fields
        if (!productName || !description || !category || !regularPrice || !salePrice || !count) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }
    
        // Check if the product already exists
        const productExist = await Product.findOne({ productName });
        if (productExist) {
            return res.status(400).json({ error: 'Product already exists' });
        }
    
        // Set up the directory for resized images
        const dir = path.join(__dirname, 'public', 'uploads', 're-image');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log("Directory created");
        }
    
        const uploadImages = [];
    
        if (req.files && req.files.length > 0) {
            // console.log("file pathe is:",req.files)
            for (let i = 0; i < req.files.length; i++) {

                const originalImagePath = req.files[i].path;
                // console.log("originalimagepath",originalImagePath)
                const resizedFilename = Date.now()+req.files[i].filename; 
                const resizedImagesPath = path.join('public', 'uploads', 're-image', resizedFilename); 
                
                const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
                if (!supportedFormats.includes(req.files[i].mimetype)) {
                    return res.status(400).json({ error: 'Unsupported image format' });
                }
                try {
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagesPath);
        
                    uploadImages.push(resizedFilename);
                } catch (sharpError) {
                    console.error('Error processing image with sharp:', sharpError);
                    return res.status(500).json({ error: 'Error processing image' });
                }
            }
        }
        
        const categoryData = await Category.findOne({name:category})

        const newProduct = new Product({
            productName,
            description,
            regularPrice,
            productImage: uploadImages,
            category:categoryData._id,
            salePrice,
            count,
        });
    
        // Save product to the database
        const success = await newProduct.save();

        if(success){
            req.session.successMessage = "Product Adding is successful";
            req.session.errorMessage = "";
            res.redirect('/admin/products')
        }else{
            req.session.successMessage = "";
            req.session.errorMessage = "Product Adding Not successful";
            res.redirect('/admin/products')
        }
        // console.log("Product added successfully:", newProduct);
        
    } catch (error) {
        console.error('Error saving product:', error);
        return res.status(500).json({ error: 'An error occurred while saving the product' });
    }
    
};






const unlistProduct = async (req,res)=>{
   try {
    const id = req.query.id;
    await Product.updateOne({_id:id},{$set:{isBlocked:false}})
    res.redirect("/admin/products")
   } catch (error) {
    console.log("error for product unlist",error)
   }

}

const listProduct = async (req,res)=>{
    try {
        const id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/products")
    } catch (error) {
        console.log("error for listProduct",error)
    }

}


const getProductById = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) return res.status(400).json({ error: "Product ID is required" });

        const product = await Product.findById(productId).populate('category');
        if (!product) return res.status(404).json({ error: "Product not found" });

        res.json(product);
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        res.status(500).send("Server error");
    }
}


const editProduct = async (req, res) => {
    try {
        const productId = req.query.id;  
        const product = await Product.findById(productId).populate('category');
        const categories = await Category.find();  

        if (!product) {
            return res.status(404).render('errorPage', { message: 'Product not found' }); 
        }
        
        res.render('admin/ProductEdit', { product, categories });
    } catch (error) {
        console.error('Error fetching product data:', error);
        res.status(500).render('errorPage', { message: 'Server error' }); 
    }
};


const editProduct2 = async (req, res) => {
    try {
        const id = req.query.id;
        // console.log("id",id)
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name." });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            regularPrice: data.regularPrice,
            category: data.category,
            salePrice: data.salePrice,
            count: data.count,
        };

        if (images.length > 0) {
            updateFields.productImage = { $push: { $each: images } };
        }

        const success = await Product.findByIdAndUpdate(id, updateFields, { new: true });

        if (success) {
            req.session.successMessage = "Product Editing is successful";
            req.session.errorMessage = "";
            res.redirect("/admin/products");
        } else {
            req.session.successMessage = "";
            req.session.errorMessage = "Product Editing was not successful";
            res.redirect("/admin/products");
        }
        
    } catch (error) {
        console.log("Error updating product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const deleteSingleImage = async (req,res)=>{
    try {
        // Find product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Remove image name from product's images array
        product.productImage = product.productImage.filter(img => img !== imageName);
        
        // Save updated product
        await product.save();

        // Delete the image file from server
        const imagePath = path.join(__dirname, '../uploads/re-image/', imageName);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error("Error deleting image file:", err);
                return res.status(500).json({ success: false, message: "Failed to delete image file" });
            }
            // Successfully deleted image file
            res.json({ success: true, message: "Image deleted successfully" });
        });
    } catch (error) {
        console.error("Error in deleteImage:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}









module.exports = { addProduct, loadProducts, unlistProduct, listProduct, getProductById, editProduct, editProduct2, deleteSingleImage};

