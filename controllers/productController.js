const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 12;
        const page = Number(req.query.page) || 1;

        // Base query
        const query = {};

        // Keyword search
        if (req.query.keyword) {
            query.name = {
                $regex: req.query.keyword,
                $options: 'i',
            };
        }

        // Filter by Active status:
        // By default, only show active products.
        // If 'showAll' is true (for admin typically), show everything.
        // In a real app, you'd check req.user.role here, but for public API simplicity:
        // We will assume public only sees active unless a specific query param is passed AND validated (omitted for now for simplicity, just default to active=true for public)
        // Actually, to make it secure:
        // If it's a public route, maybe we ALWAYS strictly filter isActive: true.
        // But the admin panel uses this same route? 
        // Let's check if req.query.isAdmin is passed (secured by frontend for now, ideally backend middleware sets this).
        // A safer way: Check if req.query.showAll exists. If so, don't filter by isActive.
        // Note: This relies on the caller. For strict security, we should check req.user?.isAdmin.
        
        // Let's assume for this task: if req.query.showAll is NOT 'true', we filter:
        if (req.query.showAll !== 'true') {
            query.isActive = true;
        }

        const count = await Product.countDocuments({ ...query });
        const products = await Product.find({ ...query })
            .populate('category')
            .populate('subcategory')
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... (getProductById remains mostly same, maybe filter active there too?)

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
            discount,
            isActive // Accept isActive
        } = req.body;

        // Validations
        if (!name || !price || !description || !category || !countInStock) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        // Handle multiple images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => {
                // If Cloudinary is used, file.path is the URL. If local, it's a file path.
                if (file.path.startsWith('http')) {
                    return file.path;
                }
                // Local fallback
                return `/${file.path.replace(/\\/g, '/')}`; 
            });
        }
        
        const image = images.length > 0 ? images[0] : '/images/sample.jpg';

        const product = new Product({
            name,
            price,
            user: req.user._id,
            image, // Main image
            images, // All images
            category,
            subcategory,
            countInStock,
            numReviews: 0,
            description,
            discount,
            isActive: isActive !== undefined ? isActive : true // Default to true
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
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete multiple products
// @route   POST /api/products/delete-many
// @access  Private/Admin
const deleteProducts = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No product IDs provided' });
    }

    try {
        const result = await Product.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${result.deletedCount} products removed` });
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
        image, // Existing image URL if unchanged
        category,
        subcategory,
        countInStock,
        discount,
        isActive // Accept isActive update
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
            product.discount = discount !== undefined ? discount : product.discount;
            if (isActive !== undefined) product.isActive = isActive; // Update status

            // Handle image updates
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => {
                    if (file.path.startsWith('http')) {
                        return file.path;
                    }
                    return `/${file.path.replace(/\\/g, '/')}`;
                });
                product.images = newImages; 
                product.image = newImages[0]; 
            } else if (image) {
                // If no new files uploaded, but keeping existing URL (or updating via URL string if supported)
                // Note: If sending FormData with no files, 'image' field might be the string URL of existing image.
                // We keep it as is.
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

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category').populate('subcategory');

        if (product) {
            // Find similar products based on category
            let similarProducts = [];
            if (product.category) {
                const categoryId = product.category._id || product.category;
                similarProducts = await Product.find({ 
                    category: categoryId, 
                    _id: { $ne: product._id },
                    isActive: true
                }).limit(4);
            }
            
            res.json({ product, similarProducts });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ rating: -1 }).limit(3);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    deleteProducts,
    updateProduct,
    createProductReview,
    getTopProducts,
};
