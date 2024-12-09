const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Ensure sharp is imported correctly
const multer = require('multer');
const Product = require('../../model/userModel/productSchema'); 
const Category = require("../../model/userModel/categorySchema");
const mongoose = require("mongoose")
const {statusCodes} = require("../../config/key")


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
                return res.status(statusCodes.BAD_REQUEST).send('Product not found');
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
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send('Server error');
    }
};





// Adding a new product in product page 
const addProduct = async (req, res) => {
    try {
        // console.log("ethi ethi ethi")
        const { productName, description, category, regularPrice, salePrice, count } = req.body;
        // console.log(productName, description, category, regularPrice, salePrice, count )
        // Validate required fields
        // if (!productName || !description || !category || !regularPrice || !salePrice || !count) {
        //     return res.status(400).json({ error: 'All required fields must be provided' });
        // }
    
        // Check if the product already exists
        const productExist = await Product.findOne({ productName });
        if (productExist) {
            // return res.status(400).json({ error: 'Product already exists' });
        }
    
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
                    return res.status(statusCodes.BAD_REQUEST).json({ error: 'Unsupported image format' });
                }
                try {
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagesPath);
        
                    uploadImages.push(resizedFilename);
                } catch (sharpError) {
                    console.error('Error processing image with sharp:', sharpError);
                    // return res.status(500).json({ error: 'Error processing image' });
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
        req.session.successMessage = "";
            req.session.errorMessage = "Product Adding Not successful";
            res.redirect('/admin/products')
        console.error('Error saving product:', error);
        // return res.status(500).json({ error: 'An error occurred while saving the product' });
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
        if (!productId) return res.status(statusCodes.BAD_REQUEST).json({ error: "Product ID is required" });

        const product = await Product.findById(productId).populate('category');
        if (!product) return res.status(statusCodes.BAD_REQUEST).json({ error: "Product not found" });

        res.json(product);
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Server error");
    }
}


const editProduct = async (req, res) => {
    try {
        const productId = req.query.id;  
        const product = await Product.findById(productId).populate('category');
        const categories = await Category.find();  

        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).render('errorPage', { message: 'Product not found' }); 
        }
        
        res.render('admin/productEdit', { product, categories });
    } catch (error) {
        console.error('Error fetching product data:', error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).render('errorPage', { message: 'Server error' }); 
    }
};


const editProduct2 = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, error: "Product not found" });
        }

        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, error: "Product with this name already exists. Please try with another name." });
        }

        // Handle deleted images
        const deletedImages = req.body['deletedImages[]'] || [];
        const imagesToDelete = Array.isArray(deletedImages) ? deletedImages : [deletedImages];
        
        if (imagesToDelete.length > 0) {
            // Remove deleted images from product's image array
            product.productImage = product.productImage.filter(img => !imagesToDelete.includes(img));
            
            // Delete image files from the server
            imagesToDelete.forEach(imageName => {
                const imagePath = path.join(__dirname, '../../public/uploads/re-image/', imageName);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error("Error deleting image file:", err);
                    }
                });
            });
        }

        const newImages = [];
        if (req.files && req.files.length > 0) {
            const totalImages = product.productImage.length + req.files.length;
            if (totalImages > 4) {
                return res.status(statusCodes.BAD_REQUEST).json({ error: 'Cannot have more than 4 images per product' });
            }

            for (const file of req.files) {
                const originalImagePath = file.path;
                const resizedFilename = Date.now() + '-' + file.originalname;
                const resizedImagesPath = path.join('public', 'uploads', 're-image', resizedFilename);

                const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
                if (!supportedFormats.includes(file.mimetype)) {
                    return res.status(statusCodes.BAD_REQUEST).json({ error: 'Unsupported image format' });
                }

                try {
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagesPath);

                    newImages.push(resizedFilename);
                } catch (sharpError) {
                    console.error('Error processing image with sharp:', sharpError);
                }
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            regularPrice: data.regularPrice,
            category: data.category,
            salePrice: data.salePrice,
            count: data.count,
            productImage: [...product.productImage, ...newImages]
        };

        const success = await Product.findByIdAndUpdate(
            id, 
            updateFields,
            { new: true }
        );

        if (success) {
            return res.json({ 
                success: true, 
                message: "Product updated successfully" 
            });
        } else {
            return res.status(statusCodes.BAD_REQUEST).json({ 
                success: false, 
                error: "Failed to update product" 
            });
        }
        
        
    } catch (error) {
        console.log("Error updating product:", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ 
            success: false, 
            error: "Internal Server Error" 
        });
    }
};

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });
        console.log("ethi ethi ethi ethi")
        const imagePath = path.join(__dirname, '../../public/uploads/re-image/', imageNameToServer);
        
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }
        
        res.send({ status: true });
    } catch (error) {
        console.error("Error occurred while deleting", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: "Error occurred while deleting" });
    }
};

const addProductOffer = async (req, res) => {
    try {
        const { offerP } = req.body;
        const { id } = req.query; 

        if (!offerP || isNaN(offerP) || Number(offerP) <= 0) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid offer percentage. It must be a number greater than 0."
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Product not found."
            });
        }

        const discountAmount = (product.regularPrice * Number(offerP)) / 100;
        const newSalePrice = Math.round(product.salePrice - discountAmount);

        product.productOffer = Number(offerP);
        product.salePrice = newSalePrice;
        await product.save()

        res.status(statusCodes.OK).json({
            success: true,
            message: "Product offer added successfully.",
            product
        });
    } catch (error) {
        console.error("Error while adding product offer:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred while adding the product offer. Please try again later."
        });
    }
};


const removeProductOffer = async (req, res) => {
    try {
        const { id } = req.query;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Product not found."
            });
        }


        const discountAmount = (product.regularPrice * product.productOffer) / 100;

        product.productOffer = 0;
        Math.round(product.salePrice += discountAmount)
        await product.save().then(()=> console.log("successfully"))


        res.status(statusCodes.OK).json({
            success: true,
            message: "Product offer updated successfully.",
            product
        });
    } catch (error) {
        console.error("Error while updating product offer:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred while updating the product offer. Please try again later."
        });
    }
};





module.exports = { addProduct, loadProducts, unlistProduct, listProduct,
     getProductById, editProduct, editProduct2, deleteSingleImage,
    addProductOffer, removeProductOffer };
