const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, description } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const category = await Category.create({
            name,
            description,
            image,
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a subcategory
// @route   POST /api/categories/sub
// @access  Private/Admin
const createSubCategory = async (req, res) => {
    const { name, categoryId } = req.body;

    try {
        const subCategory = await SubCategory.create({
            name,
            category: categoryId,
        });
        res.status(201).json(subCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get subcategories by category ID
// @route   GET /api/categories/:id/sub
// @access  Public
const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({ category: req.params.id, isActive: true });
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a subcategory
// @route   DELETE /api/categories/sub/:id
// @access  Private/Admin
const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);
        if (subCategory) {
            await subCategory.deleteOne();
            res.json({ message: 'SubCategory removed' });
        } else {
            res.status(404).json({ message: 'SubCategory not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCategories, createCategory, createSubCategory, getSubCategories, deleteCategory, deleteSubCategory };
