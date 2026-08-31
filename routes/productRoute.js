const express = require('express');
const { getAllProducts, getProductDetails, updateProduct, deleteProduct, getProductReviews, deleteReview, createProductReview, createProduct, getAdminProducts, getProducts, getAllProductsReviewsAdmin } = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

const router = express.Router();

router.route('/products').get(getAllProducts);
router.route('/products/all').get(getProducts);

router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.post(
  "/admin/product/new",
  isAuthenticatedUser,     // ❗ Must add this to set req.user
  upload.array("images"),  // multer
  createProduct
);

router.route('/admin/product/:id')
    .put(
        isAuthenticatedUser,
        authorizeRoles("admin"),
        upload.array('images'),
        updateProduct
    )
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route('/product/:id').get(getProductDetails);

router.route('/review').put(isAuthenticatedUser, createProductReview);
router.route('/reviews').get(getProductReviews);
router.route('/admin/reviews/all').get(isAuthenticatedUser, authorizeRoles("admin"), getAllProductsReviewsAdmin);

router.route('/admin/reviews')
    .get(getProductReviews)
    .delete(isAuthenticatedUser, deleteReview);

module.exports = router;