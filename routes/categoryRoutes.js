const express = require('express');
const router = express.Router();
const { getCategories, createCategory, createSubCategory, getSubCategories, deleteCategory, deleteSubCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getCategories)
    .post(protect, admin, upload.single('image'), createCategory);

router.route('/sub')
    .post(protect, admin, createSubCategory);

router.route('/:id')
    .delete(protect, admin, deleteCategory);

router.route('/:id/sub')
    .get(getSubCategories);

router.route('/sub/:id')
    .delete(protect, admin, deleteSubCategory);

module.exports = router;
