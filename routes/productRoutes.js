const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, deleteProducts, createProductReview, getTopProducts } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.post('/delete-many', protect, admin, deleteProducts);

router.route('/')
    .get(getProducts)
    .post(protect, admin, upload.array('images', 10), createProduct);


router.get('/top', getTopProducts);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, upload.array('images', 10), updateProduct)
    .delete(protect, admin, deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;
