const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');

const fs = require('fs');
const path = require('path');

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {

    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
    // console.log(req.query);

    const searchFeature = new SearchFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await searchFeature.query;
    let filteredProductsCount = products.length;

    searchFeature.pagination(resultPerPage);

    products = await searchFeature.query.clone();

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Get All Products ---ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Create Product ---ADMIN
exports.createProduct = async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        const images = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            category: req.body.category,
            status: req.body.status,
            subCategoryType: req.body.subCategoryType,
            gst: req.body.gst !== undefined ? req.body.gst : 0,
            images,
            user: req.user._id
        };

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};






// Update Product ---ADMIN
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
    console.log("UPDATE PRODUCT BODY:", req.body);
    let product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    // HANDLE IMAGES
    if (req.files && req.files.length > 0) {
        // Delete old images from uploads folder
        for (const img of product.images) {
            const filePath = path.join(__dirname, "../", img.url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Add new images from request
        const images = req.files.map(file => ({
            public_id: file.filename,
            url: `uploads/${file.filename}` // Standardized with createProduct
        }));

        req.body.images = images;
    }

    // ENSURE USER AND OTHER FIELDS ARE UPDATED
    const updatedData = {
        name: req.body.name || product.name,
        description: req.body.description || product.description,
        price: req.body.price !== undefined ? req.body.price : product.price,
        stock: req.body.stock !== undefined ? req.body.stock : product.stock,
        category: req.body.category || product.category,
        status: req.body.status || product.status,
        subCategoryType: req.body.subCategoryType || product.subCategoryType,
        gst: req.body.gst !== undefined ? req.body.gst : product.gst,
        images: req.body.images || product.images,
        user: req.user._id
    };

    product = await Product.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, product });
});

// Delete Product ---ADMIN
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Delete images from cloudinary
    for (let img of product.images) {
        await cloudinary.v2.uploader.destroy(img.public_id);
    }

    await Product.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true
    });
});


// Create OR Update Reviews
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const isReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString());

    if (isReviewed) {

        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString())
                (rev.rating = rating, rev.comment = comment);
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

// Get All Reviews of Product (Original - by Product ID)
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

// Get All Reviews Across All Products --- ADMIN
exports.getAllProductsReviewsAdmin = asyncErrorHandler(async (req, res, next) => {
    // Find all products that have at least one review
    const products = await Product.find({ 'reviews.0': { $exists: true } });
    
    let allReviews = [];
    products.forEach(product => {
        product.reviews.forEach(review => {
            allReviews.push({
                ...review._doc,
                productId: product._id,
                productName: product.name
            });
        });
    });

    // Sort by createdAt descending
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
        success: true,
        reviews: allReviews
    });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings: Number(ratings),
        numOfReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});