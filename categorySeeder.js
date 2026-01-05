const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const categoryData = [
    {
        name: 'Banarsi Silk',
        image: '/assets/saree_model_1.png',
        description: 'The pride of Varanasi, known for gold and silver brocade.',
    },
    {
        name: 'Kanjivaram',
        image: '/assets/saree_model_2.png',
        description: 'Woven from pure mulberry silk, a symbol of royalty.',
    },
    {
        name: 'Patola',
        image: '/assets/cat_patola.png',
        description: 'Double ikat woven saree, usually made from silk.',
    },
    {
        name: 'Chanderi',
        image: '/assets/cat_chanderi.png',
        description: 'Traditional ethnic fabric characterized by its lightweight.',
    },
    {
        name: 'Saree',
        image: '/assets/saree_model_1.png',
        description: 'Elegant range of traditional and contemporary sarees.',
    },
    {
        name: 'Lancha',
        image: '/assets/cat_lancha.png',
        description: 'Beautifully crafted Lanchas for weddings and festivals.',
    },
    {
        name: 'Suit Piece',
        image: '/assets/cat_suit_piece.png',
        description: 'Premium unstitched suit pieces for custom tailoring.',
    },
    {
        name: 'Western Gown',
        image: '/assets/cat_western_gown.png',
        description: 'Stylish western gowns for evening parties and events.',
    },
    {
        name: 'Cotton Mangalagiri',
        image: '/assets/cat_mangalagiri.png',
        description: 'Durable and distinctive cotton sarees from Mangalagiri.',
    },
    {
        name: 'Dharmavaram Silk',
        image: '/assets/cat_dharmavaram.png',
        description: 'Rich silk sarees with broad borders and brocade patterns.',
    },
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const importData = async () => {
    try {
        await connectDB();

        // CLEAR EXISTING DATA
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await SubCategory.deleteMany();

        // Drop specific index if it exists (legacy index)
        try {
            await User.collection.dropIndex('username_1');
            console.log('Legacy username index dropped');
        } catch (err) {
            // Ignore error if index doesn't exist
        }

        console.log('Data Cleared');

        // CREATE USERS
        const createdUsers = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: '123456',
                role: 'admin',
                isActive: true
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123456',
                role: 'user',
                isActive: true
            },
        ]);

        const adminUser = createdUsers[0]._id;
        console.log('Users Created');

        // CREATE CATEGORIES
        // Loop through each main category
        for (const catData of categoryData) {
            console.log(`Processing Category: ${catData.name}`);
            
            let imageUrl = catData.image; // Default to path if upload fails/not needed
            
            try {
                // Construct absolute path to the file in frontend/public
                const imagePath = path.join(__dirname, '../frontend/public', catData.image);
                
                if (fs.existsSync(imagePath)) {
                    console.log(`Uploading ${catData.image} to Cloudinary...`);
                    const result = await cloudinary.uploader.upload(imagePath, {
                        folder: 'nirmal-handloom/categories',
                        use_filename: true,
                        unique_filename: false
                    });
                    imageUrl = result.secure_url;
                    console.log(`Uploaded to: ${imageUrl}`);
                } else {
                    console.log(`File not found: ${imagePath}, using local path.`);
                }
            } catch (error) {
                console.error(`Error uploading image for ${catData.name}:`, error.message);
            }

            // Create Category with Image
            await Category.create({
                name: catData.name,
                description: catData.description,
                isActive: true,
                image: imageUrl 
            });
            // No subcategories or products as per request
        }

        console.log(`Categories created. No products seeded.`);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await SubCategory.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
