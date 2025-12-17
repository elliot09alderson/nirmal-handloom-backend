const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword
            ? {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i',
                },
            }
            : {};

        const products = await Product.find({ ...keyword }).populate('category').populate('subcategory');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category').populate('subcategory');

        if (product) {
            // Fetch similar products based on category
            const similarProducts = await Product.find({
                category: product.category._id,
                _id: { $ne: product._id }
            }).limit(4);

            res.json({ product, similarProducts });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            category,
            subcategory,
            countInStock,
            discount
        } = req.body;

        // Validations
        if (!name || !price || !description || !category || !countInStock) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        // Handle multiple images
        // req.files is an array of files
        const images = req.files ? req.files.map(file => file.path) : [];
        const image = images.length > 0 ? images[0] : '/images/sample.jpg';

        const product = new Product({
            name,
            price,
            user: req.user._id,
            image,
            images,
            category,
            subcategory,
            countInStock,
            numReviews: 0,
            description,
            discount
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(400).json({ message: error.message || 'Product creation failed' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const {
        name,
        price,
        description,
        image,
        category,
        subcategory,
        countInStock,
        discount
    } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.category = category || product.category;
            product.subcategory = subcategory || product.subcategory;
            product.countInStock = countInStock || product.countInStock;
            product.discount = discount || product.discount;

            // Handle image updates if new files are provided
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => file.path);
                product.images = newImages; // Replace existing images (or could append, but replacement is standard)
                product.image = newImages[0]; // Set main image to first of new images
            } else if (image) {
                // Fallback if image string is passed manually (e.g. valid URL) and no files
                product.image = image;
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    updateProduct,
};
